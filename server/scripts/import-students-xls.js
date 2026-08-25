import 'dotenv/config';
import { createHmac } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const prisma = new PrismaClient();
const secret = process.env.CPF_HASH_SECRET || process.env.JWT_SECRET;
const normalizeCpf = (value) => String(value ?? '').replace(/\D/g, '');

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

const hashCpf = (cpf) => createHmac('sha256', secret).update(cpf).digest('hex');

async function main() {
  if (!secret || secret.length < 32) throw new Error('Configure CPF_HASH_SECRET com pelo menos 32 caracteres antes da importação.');
  const input = resolve(process.cwd(), process.argv[2] || '../../relatorioSociosCompletos (14).xls');
  const workbook = XLSX.readFile(input, { cellDates: false });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: false });
  const unique = new Map();
  let invalidos = 0;
  for (const row of rows) {
    const nomeCompleto = String(row.Nome ?? '').trim().replace(/\s+/g, ' ');
    const cpf = normalizeCpf(row.CPF);
    if (nomeCompleto.length < 2 || !validCpf(cpf)) { invalidos += 1; continue; }
    unique.set(hashCpf(cpf), nomeCompleto);
  }

  let criados = 0;
  let vinculados = 0;
  let atualizados = 0;
  for (const [cpfHash, nomeCompleto] of unique) {
    const existing = await prisma.aluno.findUnique({ where: { cpfHash }, select: { id: true, nomeCompleto: true } });
    if (existing) {
      if (existing.nomeCompleto !== nomeCompleto) await prisma.aluno.update({ where: { id: existing.id }, data: { nomeCompleto } });
      atualizados += 1;
      continue;
    }
    const sameName = await prisma.aluno.findMany({ where: { nomeCompleto, cpfHash: null, deletedAt: null }, select: { id: true }, take: 2 });
    if (sameName.length === 1) {
      await prisma.aluno.update({ where: { id: sameName[0].id }, data: { cpfHash } });
      vinculados += 1;
    } else {
      await prisma.aluno.create({ data: { nomeCompleto, cpfHash } });
      criados += 1;
    }
  }
  console.log(JSON.stringify({ linhasLidas: rows.length, cpfsUnicosValidos: unique.size, criados, vinculados, atualizados, ignoradosInvalidos: invalidos }));
}

main()
  .catch((error) => { console.error(`Falha na importação: ${error.message}`); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
