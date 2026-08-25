import { prisma } from '../config/prisma.js';
import AppError from '../utils/AppError.js';

const detailSelect = {
  id: true, observacao: true, createdAt: true, updatedAt: true,
  aluno: { select: { id: true, uuid: true, nomeCompleto: true } },
  fiscal: { select: { id: true, nome: true } },
  chamada: { select: { id: true, data: true, turno: true, status: true } },
};

export async function create(chamadaId, alunoId, observacao) {
  const chamada = await prisma.chamada.findUnique({ where: { id: chamadaId }, select: { id: true, status: true, fiscalId: true } });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  if (chamada.status !== 'FINALIZADA') throw new AppError('Ocorrências só podem ser registradas após a finalização da chamada', 409);
  const presenca = await prisma.presenca.findUnique({ where: { chamadaId_alunoId: { chamadaId, alunoId } }, select: { id: true } });
  if (!presenca) throw new AppError('O aluno não possui presença nesta chamada', 400);
  return prisma.ocorrencia.create({ data: { chamadaId, alunoId, fiscalId: chamada.fiscalId, observacao }, select: detailSelect });
}

export async function list({ page, limit, aluno, alunoId, fiscal, dataInicio, dataFim, turno, chamadaId }) {
  const where = {
    ...(chamadaId && { chamadaId }),
    ...(alunoId ? { alunoId } : aluno && { aluno: { nomeCompleto: { contains: aluno } } }),
    ...(fiscal && { fiscal: { nome: { contains: fiscal } } }),
    ...((dataInicio || dataFim || turno) && { chamada: {
      ...(turno && { turno }),
      ...((dataInicio || dataFim) && { data: { ...(dataInicio && { gte: new Date(`${dataInicio}T00:00:00.000Z`) }), ...(dataFim && { lte: new Date(`${dataFim}T00:00:00.000Z`) }) } }),
    } }),
  };
  const occurrenceQuery = prisma.ocorrencia.findMany({ where, select: detailSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit });
  const countQuery = prisma.ocorrencia.count({ where });
  if (alunoId) {
    const [student, ocorrencias, totalOcorrencias] = await prisma.$transaction([
      prisma.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nomeCompleto: true } }),
      occurrenceQuery,
      countQuery,
    ]);
    if (!student) throw new AppError('Aluno não encontrado', 404);
    return {
      aluno: student,
      totalOcorrencias,
      ocorrencias,
      pagination: { page, limit, total: totalOcorrencias, totalPages: Math.max(1, Math.ceil(totalOcorrencias / limit)) },
    };
  }
  const [items, total] = await prisma.$transaction([occurrenceQuery, countQuery]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function findById(id) {
  const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id }, select: detailSelect });
  if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404);
  return ocorrencia;
}

export async function update(id, observacao) {
  await findById(id);
  return prisma.ocorrencia.update({ where: { id }, data: { observacao }, select: detailSelect });
}
