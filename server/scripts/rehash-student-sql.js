import fs from 'node:fs';
import { createCipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const serverEnv = dotenv.parse(fs.readFileSync(resolve(process.cwd(), 'server/.env')));
const sourceSecret = serverEnv.CPF_HASH_SECRET || serverEnv.JWT_SECRET;
const targetSecret = process.env.TARGET_CPF_HASH_SECRET;
const spreadsheetPath = resolve(process.cwd(), process.argv[2] || '../relatorioSociosCompletos (14).xls');
const dumpPath = resolve(process.cwd(), process.argv[3] || 'alunos-planilha-hostinger.sql');
const correctionPath = resolve(process.cwd(), process.argv[4] || 'corrigir-cpfs-hostinger.sql');
const syncPath = resolve(process.cwd(), process.argv[5] || 'sincronizar-alunos-hostinger.sql');

if (!sourceSecret || sourceSecret.length < 32) throw new Error('Chave de origem inválida em server/.env.');
if (!targetSecret || targetSecret.length < 32) throw new Error('Defina TARGET_CPF_HASH_SECRET com a chave usada na Hostinger.');

const normalizeCpf = (value) => String(value ?? '').replace(/\D/g, '').padStart(11, '0');
const hash = (cpf, secret) => createHmac('sha256', secret).update(cpf).digest('hex');
const encryptionKey = createHash('sha256').update(`cpf-encryption:${targetSecret}`).digest();
const encrypt = (cpf) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(cpf, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':');
};

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

const workbook = XLSX.readFile(spreadsheetPath, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
const students = rows.map((row, index) => ({
  row: index + 2,
  name: String(row.Nome ?? '').trim().replace(/\s+/g, ' '),
  cpf: normalizeCpf(row.CPF),
}));
const invalid = students.filter(({ name, cpf }) => name.length < 2 || !validCpf(cpf));
const duplicateCpfs = students.filter(({ cpf }, index) => students.findIndex((student) => student.cpf === cpf) !== index);
if (invalid.length || duplicateCpfs.length) {
  throw new Error(`Planilha inconsistente: ${invalid.length} inválidos e ${duplicateCpfs.length} CPFs duplicados.`);
}

let dump = fs.readFileSync(dumpPath, 'utf8');
const updates = [];
const targetHashes = [];
for (const student of students) {
  const sourceHash = hash(student.cpf, sourceSecret);
  const targetHash = hash(student.cpf, targetSecret);
  const sourceOccurrences = dump.split(sourceHash).length - 1;
  const targetOccurrences = dump.split(targetHash).length - 1;
  if (sourceOccurrences === 1) dump = dump.replace(sourceHash, targetHash);
  else if (targetOccurrences !== 1) throw new Error(`CPF da linha ${student.row} não foi localizado uma única vez no SQL.`);
  updates.push(`UPDATE \`alunos\` SET \`cpfHash\`='${targetHash}', \`updatedAt\`=CURRENT_TIMESTAMP(3) WHERE \`cpfHash\`='${sourceHash}';`);
  targetHashes.push(`'${targetHash}'`);
}

for (const student of students) {
  const targetHash = hash(student.cpf, targetSecret);
  if ((dump.split(targetHash).length - 1) !== 1) throw new Error(`Falha na auditoria do CPF da linha ${student.row}.`);
}

fs.writeFileSync(dumpPath, dump, 'utf8');
fs.writeFileSync(correctionPath, [
  '-- Atualiza os hashes de CPF já importados sem armazenar CPFs em texto puro.',
  'SET NAMES utf8mb4;',
  'START TRANSACTION;',
  ...updates,
  'COMMIT;',
  `SELECT COUNT(*) AS cpfsDaPlanilhaReconhecidos FROM \`alunos\` WHERE \`cpfHash\` IN (${targetHashes.join(',')});`,
  '',
].join('\n'), 'utf8');

const escapeSql = (value) => value.replaceAll('\\', '\\\\').replaceAll("'", "''");
const syncRows = students.map((student) =>
  `('${escapeSql(student.name)}','${hash(student.cpf, targetSecret)}','${encrypt(student.cpf)}')`);
fs.writeFileSync(syncPath, [
  '-- Sincroniza alunos pelo nome da planilha sem armazenar CPF em texto puro.',
  'SET NAMES utf8mb4;',
  'START TRANSACTION;',
  'CREATE TEMPORARY TABLE `tmp_alunos_planilha` (',
  '  `nomeCompleto` VARCHAR(191) NOT NULL PRIMARY KEY,',
  '  `cpfHash` VARCHAR(64) NOT NULL UNIQUE,',
  '  `cpfEncrypted` VARCHAR(255) NOT NULL',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
  `INSERT INTO \`tmp_alunos_planilha\` (\`nomeCompleto\`, \`cpfHash\`, \`cpfEncrypted\`) VALUES\n${syncRows.join(',\n')};`,
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
  'SELECT COUNT(*) AS alunosReconhecidos FROM `alunos` AS a',
  'INNER JOIN `tmp_alunos_planilha` AS t ON a.`cpfHash` = t.`cpfHash`',
  'WHERE a.`deletedAt` IS NULL;',
  'DROP TEMPORARY TABLE `tmp_alunos_planilha`;',
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  linhasAuditadas: students.length,
  cpfsValidosUnicos: new Set(students.map(({ cpf }) => cpf)).size,
  invalidos: invalid.length,
  duplicados: duplicateCpfs.length,
  dumpAtualizado: dumpPath,
  correcaoBancoExistente: correctionPath,
  sincronizacaoPorNome: syncPath,
}));
