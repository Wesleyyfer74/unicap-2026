import fs from 'node:fs';
import { createCipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const secret = process.env.TARGET_CPF_HASH_SECRET || process.env.CPF_HASH_SECRET;
const spreadsheetPath = resolve(process.cwd(), process.argv[2] || '../relatorioSociosCompletos (14).xls');
const outputPath = resolve(process.cwd(), process.argv[3] || 'atualizar-alunos-cpf-hostinger.sql');

if (!secret || secret.length < 32) throw new Error('Defina TARGET_CPF_HASH_SECRET com a mesma CPF_HASH_SECRET usada na Hostinger.');

const normalizeCpf = (value) => String(value ?? '').replace(/\D/g, '').padStart(11, '0');
const hashCpf = (cpf) => createHmac('sha256', secret).update(cpf).digest('hex');
const encryptionKey = createHash('sha256').update(`cpf-encryption:${secret}`).digest();
const escapeSql = (value) => value.replaceAll('\\', '\\\\').replaceAll("'", "''");

function validCpf(cpf) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function encryptCpf(cpf) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':');
}

const workbook = XLSX.readFile(spreadsheetPath, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
const students = rows.map((row, index) => ({
  row: index + 2,
  name: String(row.Nome ?? '').trim().replace(/\s+/g, ' '),
  cpf: normalizeCpf(row.CPF),
}));
const invalid = students.filter(({ name, cpf }) => name.length < 2 || !validCpf(cpf));
const duplicateCpfs = students.filter(({ cpf }, index) => students.findIndex((student) => student.cpf === cpf) !== index);
const duplicateNames = students.filter(({ name }, index) => students.findIndex((student) => student.name === name) !== index);

if (invalid.length || duplicateCpfs.length || duplicateNames.length) {
  throw new Error(`Planilha inconsistente: ${invalid.length} inválidos, ${duplicateCpfs.length} CPFs duplicados e ${duplicateNames.length} nomes duplicados.`);
}

const values = students.map(({ name, cpf }) =>
  `('${escapeSql(name)}','${hashCpf(cpf)}','${encryptCpf(cpf)}')`);

const sql = [
  '-- Atualização completa dos alunos gerada diretamente da planilha oficial.',
  '-- CPFs não são armazenados em texto puro: somente hash e conteúdo criptografado.',
  'SET NAMES utf8mb4;',
  'SET @cpf_column_exists = (',
  '  SELECT COUNT(*) FROM information_schema.COLUMNS',
  "  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alunos' AND COLUMN_NAME = 'cpfEncrypted'",
  ');',
  "SET @cpf_ddl = IF(@cpf_column_exists = 0, 'ALTER TABLE `alunos` ADD COLUMN `cpfEncrypted` VARCHAR(255) NULL', 'SELECT 1');",
  'PREPARE cpf_stmt FROM @cpf_ddl;',
  'EXECUTE cpf_stmt;',
  'DEALLOCATE PREPARE cpf_stmt;',
  'START TRANSACTION;',
  'CREATE TEMPORARY TABLE `tmp_alunos_planilha` (',
  '  `nomeCompleto` VARCHAR(191) NOT NULL PRIMARY KEY,',
  '  `cpfHash` VARCHAR(64) NOT NULL UNIQUE,',
  '  `cpfEncrypted` VARCHAR(255) NOT NULL',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
  `INSERT INTO \`tmp_alunos_planilha\` (\`nomeCompleto\`, \`cpfHash\`, \`cpfEncrypted\`) VALUES\n${values.join(',\n')};`,
  'UPDATE `alunos` AS a',
  'INNER JOIN `tmp_alunos_planilha` AS t ON TRIM(a.`nomeCompleto`) = t.`nomeCompleto`',
  'SET a.`cpfHash` = t.`cpfHash`, a.`cpfEncrypted` = t.`cpfEncrypted`, a.`updatedAt` = CURRENT_TIMESTAMP(3)',
  'WHERE a.`deletedAt` IS NULL;',
  'INSERT INTO `alunos` (`uuid`, `cpfHash`, `cpfEncrypted`, `nomeCompleto`, `ativo`, `createdAt`, `updatedAt`)',
  'SELECT UUID(), t.`cpfHash`, t.`cpfEncrypted`, t.`nomeCompleto`, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)',
  'FROM `tmp_alunos_planilha` AS t',
  'WHERE NOT EXISTS (SELECT 1 FROM `alunos` AS a WHERE a.`cpfHash` = t.`cpfHash`)',
  '  AND NOT EXISTS (SELECT 1 FROM `alunos` AS a WHERE TRIM(a.`nomeCompleto`) = t.`nomeCompleto` AND a.`deletedAt` IS NULL);',
  'COMMIT;',
  'SELECT COUNT(*) AS alunosComCpf FROM `alunos` AS a',
  'INNER JOIN `tmp_alunos_planilha` AS t ON a.`cpfHash` = t.`cpfHash`',
  'WHERE a.`deletedAt` IS NULL AND a.`cpfEncrypted` IS NOT NULL;',
  'DROP TEMPORARY TABLE `tmp_alunos_planilha`;',
  '',
].join('\n');

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(JSON.stringify({
  linhasAuditadas: students.length,
  cpfsValidosUnicos: new Set(students.map(({ cpf }) => cpf)).size,
  invalidos: invalid.length,
  cpfsDuplicados: duplicateCpfs.length,
  nomesDuplicados: duplicateNames.length,
  arquivo: outputPath,
}));
