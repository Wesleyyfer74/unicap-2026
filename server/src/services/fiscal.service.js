import { prisma } from '../config/prisma.js';
import AppError from '../utils/AppError.js';

const fiscalSelect = { id: true, nome: true, ativo: true, deletedAt: true, createdAt: true, updatedAt: true };

export async function list({ page, limit, search, ativo }) {
  const where = {
    deletedAt: null,
    ...(search && { nome: { contains: search } }),
    ...(ativo !== undefined && { ativo: ativo === 'true' }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.fiscal.findMany({ where, select: fiscalSelect, orderBy: { nome: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.fiscal.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function listArchived({ page, limit, search }) {
  const where = { deletedAt: { not: null }, ...(search && { nome: { contains: search } }) };
  const [items, total] = await prisma.$transaction([
    prisma.fiscal.findMany({ where, select: fiscalSelect, orderBy: { deletedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.fiscal.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function create(nome) {
  return prisma.fiscal.create({ data: { nome }, select: fiscalSelect });
}

export async function update(id, nome) {
  await ensureExists(id);
  return prisma.fiscal.update({ where: { id }, data: { nome }, select: fiscalSelect });
}

export async function updateStatus(id, ativo) {
  await ensureExists(id);
  return prisma.fiscal.update({ where: { id }, data: { ativo }, select: fiscalSelect });
}

export async function remove(id) {
  await ensureExists(id);
  return prisma.fiscal.update({ where: { id }, data: { ativo: false, deletedAt: new Date() }, select: fiscalSelect });
}

async function ensureExists(id) {
  if (!(await prisma.fiscal.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))) throw new AppError('Fiscal não encontrado', 404);
}
