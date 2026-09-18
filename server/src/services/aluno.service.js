import { prisma } from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { decryptCpf, encryptCpf, formatCpf, hashCpf, isValidCpf, normalizeCpf } from '../utils/cpf.js';

const alunoSelect = { id: true, uuid: true, cpfEncrypted: true, nomeCompleto: true, ativo: true, motivoInativacao: true, desativadoEm: true, deletedAt: true, createdAt: true, updatedAt: true };
const pagination = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
const toAdminAluno = ({ cpfEncrypted, ...aluno }) => ({ ...aluno, cpf: formatCpf(decryptCpf(cpfEncrypted)) });
const searchWhere = (search) => {
  if (!search) return {};
  const normalizedCpf = normalizeCpf(search);
  return normalizedCpf.length === 11 && isValidCpf(normalizedCpf)
    ? { OR: [{ nomeCompleto: { contains: search } }, { cpfHash: hashCpf(normalizedCpf) }] }
    : { nomeCompleto: { contains: search } };
};

async function cpfData(cpf, ignoredId, database = prisma) {
  if (!cpf) return {};
  if (!isValidCpf(cpf)) throw new AppError('Informe um CPF válido', 422);
  const cpfHash = hashCpf(cpf);
  const existing = await database.aluno.findFirst({ where: { cpfHash, ...(ignoredId && { id: { not: ignoredId } }) }, select: { id: true, deletedAt: true } });
  if (existing?.deletedAt) {
    await database.aluno.update({ where: { id: existing.id }, data: { cpfHash: null, cpfEncrypted: null } });
  } else if (existing) throw new AppError('CPF já cadastrado para outro aluno', 409);
  return { cpfHash, cpfEncrypted: encryptCpf(cpf) };
}

export async function list({ page, limit, search, ativo }) {
  const where = { deletedAt: null, ...searchWhere(search), ...(ativo !== undefined && { ativo: ativo === 'true' }) };
  const [items, total] = await prisma.$transaction([
    prisma.aluno.findMany({ where, select: alunoSelect, orderBy: { nomeCompleto: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.aluno.count({ where }),
  ]);
  return { items: items.map(toAdminAluno), pagination: pagination(page, limit, total) };
}

export async function listArchived({ page, limit, search }) {
  const where = { deletedAt: { not: null }, ...searchWhere(search) };
  const [items, total] = await prisma.$transaction([
    prisma.aluno.findMany({ where, select: alunoSelect, orderBy: { deletedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.aluno.count({ where }),
  ]);
  return { items: items.map(toAdminAluno), pagination: pagination(page, limit, total) };
}

export async function findById(id) {
  const aluno = await prisma.aluno.findFirst({ where: { id, deletedAt: null }, select: alunoSelect });
  if (!aluno) throw new AppError('Aluno não encontrado', 404);
  return toAdminAluno(aluno);
}

export async function create({ nomeCompleto, cpf }) {
  const aluno = await prisma.aluno.create({ data: { nomeCompleto, ...(await cpfData(cpf)) }, select: alunoSelect });
  return toAdminAluno(aluno);
}

export async function findPublicByCpf(cpf) {
  if (!isValidCpf(cpf)) throw new AppError('Informe um CPF válido', 422);
  const aluno = await prisma.aluno.findUnique({
    where: { cpfHash: hashCpf(cpf) },
    select: { uuid: true, nomeCompleto: true, ativo: true, deletedAt: true },
  });
  if (!aluno || aluno.deletedAt) throw new AppError('CPF não encontrado na lista de alunos autorizados', 404);
  if (!aluno.ativo) throw new AppError('Cadastro do aluno está inativo. Procure a administração.', 403);
  return { uuid: aluno.uuid, nomeCompleto: aluno.nomeCompleto };
}

export async function update(id, { nomeCompleto, cpf }) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.aluno.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new AppError('Aluno não encontrado', 404);
    const aluno = await transaction.aluno.update({
      where: { id },
      data: { nomeCompleto, ...(await cpfData(cpf, id, transaction)) },
      select: alunoSelect,
    });
    return toAdminAluno(aluno);
  });
}

export async function updateStatus(id, ativo, motivo) {
  await findById(id);
  const aluno = await prisma.aluno.update({
    where: { id },
    data: ativo
      ? { ativo: true, motivoInativacao: null, desativadoEm: null }
      : { ativo: false, motivoInativacao: motivo, desativadoEm: new Date() },
    select: alunoSelect,
  });
  return toAdminAluno(aluno);
}

export async function remove(id) {
  await findById(id);
  const aluno = await prisma.aluno.update({ where: { id }, data: { ativo: false, deletedAt: new Date() }, select: alunoSelect });
  return toAdminAluno(aluno);
}

export async function listPresencas(id, { page, limit }) {
  await ensureAlunoExists(id);
  const where = { alunoId: id };
  const [items, total] = await prisma.$transaction([
    prisma.presenca.findMany({
      where,
      select: { id: true, registradoEm: true, createdAt: true, chamada: { select: { id: true, data: true, turno: true, status: true, fiscal: { select: { id: true, nome: true } } } } },
      orderBy: { registradoEm: 'desc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.presenca.count({ where }),
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

export async function listOcorrencias(id, { page, limit }) {
  await ensureAlunoExists(id);
  const where = { alunoId: id };
  const [items, total] = await prisma.$transaction([
    prisma.ocorrencia.findMany({
      where,
      select: { id: true, observacao: true, createdAt: true, updatedAt: true, chamada: { select: { id: true, data: true, turno: true } }, fiscal: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.ocorrencia.count({ where }),
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

async function ensureAlunoExists(id) {
  if (!(await prisma.aluno.findUnique({ where: { id }, select: { id: true } }))) throw new AppError('Aluno não encontrado', 404);
}
