import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { currentDateInTimeZone } from '../utils/date.js';
import AppError from '../utils/AppError.js';

const detailSelect = {
  id: true, fiscalId: true, turno: true, corOnibus: true, data: true, status: true,
  startedAt: true, finishedAt: true, createdAt: true, updatedAt: true,
  fiscal: { select: { id: true, nome: true, ativo: true } },
  viagem: { select: {
    id: true, nomeMotorista: true, linhaRota: true, horarioSaida: true, horarioChegada: true,
    hodometroSaida: true, hodometroChegada: true, createdAt: true,
  } },
  _count: { select: { presencas: true, ocorrencias: true } },
};
const pagination = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

export async function list({ page, limit, fiscalId, turno, status, data }) {
  const where = {
    ...(fiscalId && { fiscalId }), ...(turno && { turno }), ...(status && { status }),
    ...(data && { data: new Date(`${data}T00:00:00.000Z`) }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.chamada.findMany({ where, select: detailSelect, orderBy: [{ data: 'desc' }, { startedAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
    prisma.chamada.count({ where }),
  ]);
  return { items, pagination: pagination(page, limit, total) };
}

export async function findById(id) {
  const chamada = await prisma.chamada.findUnique({ where: { id }, select: detailSelect });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  return chamada;
}

export async function findDetails(id, { presencasLimit, ocorrenciasLimit }) {
  const [chamada, presencas, ocorrencias] = await prisma.$transaction([
    prisma.chamada.findUnique({ where: { id }, select: detailSelect }),
    prisma.presenca.findMany({
      where: { chamadaId: id },
      select: { id: true, registradoEm: true, createdAt: true, aluno: { select: { id: true, uuid: true, nomeCompleto: true, ativo: true } } },
      orderBy: { registradoEm: 'desc' }, take: presencasLimit,
    }),
    prisma.ocorrencia.findMany({
      where: { chamadaId: id },
      select: {
        id: true, observacao: true, createdAt: true, updatedAt: true,
        aluno: { select: { id: true, uuid: true, nomeCompleto: true } },
        fiscal: { select: { id: true, nome: true } },
        chamada: { select: { id: true, data: true, turno: true, status: true } },
      },
      orderBy: { createdAt: 'desc' }, take: ocorrenciasLimit,
    }),
  ]);
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  return {
    chamada,
    presencas: { items: presencas, pagination: pagination(1, presencasLimit, chamada._count.presencas) },
    ocorrencias: { items: ocorrencias, pagination: pagination(1, ocorrenciasLimit, chamada._count.ocorrencias) },
  };
}

export async function create({ fiscalId, turno, corOnibus }) {
  const fiscal = await prisma.fiscal.findFirst({ where: { id: fiscalId, deletedAt: null }, select: { ativo: true } });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);
  if (!fiscal.ativo) throw new AppError('Não é possível iniciar chamada com fiscal inativo', 400);
  return prisma.chamada.create({
    data: { fiscalId, turno, corOnibus, data: currentDateInTimeZone(env.APP_TIMEZONE), status: 'ABERTA', startedAt: new Date() },
    select: detailSelect,
  });
}

export async function finish(id) {
  const chamada = await findById(id);
  if (chamada.status === 'FINALIZADA') throw new AppError('Chamada já finalizada', 409);
  return prisma.chamada.update({ where: { id }, data: { status: 'FINALIZADA', finishedAt: new Date() }, select: detailSelect });
}

export async function addPresence(chamadaId, uuid) {
  return prisma.$transaction(async (transaction) => {
    const chamada = await transaction.chamada.findUnique({ where: { id: chamadaId }, select: { id: true, status: true } });
    if (!chamada) throw new AppError('Chamada não encontrada', 404);
    if (chamada.status !== 'ABERTA') throw new AppError('Chamadas finalizadas não podem receber novas presenças', 409);
    const aluno = await transaction.aluno.findUnique({ where: { uuid }, select: { id: true, uuid: true, nomeCompleto: true, ativo: true, motivoInativacao: true } });
    if (!aluno) throw new AppError('Aluno não encontrado', 404);
    if (!aluno.ativo) throw inactiveStudentError(aluno);
    try {
      const presenca = await transaction.presenca.create({ data: { chamadaId, alunoId: aluno.id }, select: { id: true, registradoEm: true } });
      return { presenca, aluno };
    } catch (error) {
      if (error.code === 'P2002') throw new AppError('Aluno já registrado nesta chamada', 409);
      throw error;
    }
  });
}

export async function identifyStudent(chamadaId, uuid) {
  const chamada = await prisma.chamada.findUnique({ where: { id: chamadaId }, select: { id: true, status: true } });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  if (chamada.status !== 'ABERTA') throw new AppError('Chamadas finalizadas não podem receber novas presenças', 409);
  const aluno = await prisma.aluno.findUnique({ where: { uuid }, select: { id: true, uuid: true, nomeCompleto: true, ativo: true, motivoInativacao: true } });
  if (!aluno) throw new AppError('Aluno não encontrado', 404);
  if (!aluno.ativo) throw inactiveStudentError(aluno);
  const alreadyRegistered = await prisma.presenca.findUnique({ where: { chamadaId_alunoId: { chamadaId, alunoId: aluno.id } }, select: { id: true } });
  if (alreadyRegistered) throw new AppError('Aluno já registrado nesta chamada.', 409);
  return aluno;
}

export async function searchStudents(chamadaId, { search, limit }) {
  const chamada = await prisma.chamada.findUnique({ where: { id: chamadaId }, select: { id: true, status: true } });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  if (chamada.status !== 'ABERTA') throw new AppError('Chamadas finalizadas não podem receber novas presenças', 409);

  const alunos = await prisma.aluno.findMany({
    where: { deletedAt: null, nomeCompleto: { contains: search } },
    select: {
      id: true, uuid: true, nomeCompleto: true, ativo: true, motivoInativacao: true,
      presencas: { where: { chamadaId }, select: { id: true }, take: 1 },
    },
    orderBy: { nomeCompleto: 'asc' },
    take: limit,
  });

  return {
    items: alunos.map(({ presencas, ...aluno }) => ({ ...aluno, jaRegistrado: presencas.length > 0 })),
  };
}

export async function listPresences(chamadaId, { page, limit, search }) {
  await findById(chamadaId);
  const where = { chamadaId, ...(search && { aluno: { nomeCompleto: { contains: search } } }) };
  const [items, total] = await prisma.$transaction([
    prisma.presenca.findMany({
      where,
      select: { id: true, registradoEm: true, createdAt: true, aluno: { select: { id: true, uuid: true, nomeCompleto: true, ativo: true } } },
      orderBy: { registradoEm: 'desc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.presenca.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function removePresence(chamadaId, presencaId) {
  return prisma.$transaction(async (transaction) => {
    const chamada = await transaction.chamada.findUnique({ where: { id: chamadaId }, select: { status: true } });
    if (!chamada) throw new AppError('Chamada não encontrada', 404);
    if (chamada.status !== 'ABERTA') throw new AppError('Não é permitido remover presença de uma chamada finalizada', 409);
    const presenca = await transaction.presenca.findFirst({ where: { id: presencaId, chamadaId }, select: { id: true } });
    if (!presenca) throw new AppError('Presença não encontrada nesta chamada', 404);
    await transaction.presenca.delete({ where: { id: presencaId } });
  });
}

function inactiveStudentError(aluno) {
  return new AppError('Aluno não autorizado', 403, {
    ok: false,
    code: 'ALUNO_INATIVO',
    aluno: { nomeCompleto: aluno.nomeCompleto },
    motivo: aluno.motivoInativacao || 'Motivo não informado.',
  });
}
