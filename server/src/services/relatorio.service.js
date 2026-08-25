import { prisma } from '../config/prisma.js';

const pagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export function buildWhere({ dataInicio, dataFim, aluno, turno, fiscal, motorista, corOnibus }) {
  const data = dataInicio || dataFim
    ? {
        ...(dataInicio && { gte: new Date(`${dataInicio}T00:00:00.000Z`) }),
        ...(dataFim && { lte: new Date(`${dataFim}T00:00:00.000Z`) }),
      }
    : undefined;

  return {
    ...(aluno && { aluno: { nomeCompleto: { contains: aluno } } }),
    chamada: {
      ...(data && { data }),
      ...(turno && { turno }),
      ...(corOnibus && { corOnibus }),
      ...(fiscal && { fiscal: { nome: { contains: fiscal } } }),
      ...(motorista && { viagem: { is: { nomeMotorista: { contains: motorista } } } }),
    },
  };
}

export async function getReportBatch(filters, skip, take) {
  const where = buildWhere(filters);
  const presencas = await prisma.presenca.findMany({
      where,
      skip,
      take,
      orderBy: [{ chamada: { data: 'desc' } }, { registradoEm: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        alunoId: true,
        chamadaId: true,
        registradoEm: true,
        aluno: { select: { id: true, nomeCompleto: true } },
        chamada: {
          select: {
            id: true,
            data: true,
            turno: true,
            corOnibus: true,
            fiscal: { select: { id: true, nome: true } },
            viagem: { select: { nomeMotorista: true, linhaRota: true } },
          },
        },
      },
    });

  const pairs = presencas.map(({ chamadaId, alunoId }) => ({ chamadaId, alunoId }));
  const ocorrencias = pairs.length
    ? await prisma.ocorrencia.findMany({
        where: { OR: pairs },
        select: { id: true, chamadaId: true, alunoId: true, observacao: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const ocorrenciasPorPresenca = new Map();
  for (const ocorrencia of ocorrencias) {
    const key = `${ocorrencia.chamadaId}:${ocorrencia.alunoId}`;
    const values = ocorrenciasPorPresenca.get(key) || [];
    values.push({ id: ocorrencia.id, observacao: ocorrencia.observacao, createdAt: ocorrencia.createdAt });
    ocorrenciasPorPresenca.set(key, values);
  }

  const items = presencas.map((presenca) => ({
    id: presenca.id,
    data: presenca.chamada.data,
    horarioPresenca: presenca.registradoEm,
    turno: presenca.chamada.turno,
    corOnibus: presenca.chamada.corOnibus,
    aluno: presenca.aluno,
    fiscal: presenca.chamada.fiscal,
    motorista: presenca.chamada.viagem?.nomeMotorista ?? null,
    rota: presenca.chamada.viagem?.linhaRota ?? null,
    ocorrencias: ocorrenciasPorPresenca.get(`${presenca.chamadaId}:${presenca.alunoId}`) || [],
  }));

  return items;
}

export function countReport(filters) {
  return prisma.presenca.count({ where: buildWhere(filters) });
}

function buildCallWhere({ dataInicio, dataFim, aluno, turno, fiscal, motorista, corOnibus }) {
  const data = dataInicio || dataFim
    ? {
        ...(dataInicio && { gte: new Date(`${dataInicio}T00:00:00.000Z`) }),
        ...(dataFim && { lte: new Date(`${dataFim}T00:00:00.000Z`) }),
      }
    : undefined;
  return {
    ...(data && { data }),
    ...(turno && { turno }),
    ...(corOnibus && { corOnibus }),
    ...(fiscal && { fiscal: { nome: { contains: fiscal } } }),
    ...(motorista && { viagem: { is: { nomeMotorista: { contains: motorista } } } }),
    ...(aluno && { presencas: { some: { aluno: { nomeCompleto: { contains: aluno } } } } }),
  };
}

export async function list(filters) {
  const { page, limit } = filters;
  const where = buildCallWhere(filters);
  const [calls, total] = await prisma.$transaction([
    prisma.chamada.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ data: 'desc' }, { startedAt: 'desc' }],
      select: {
        id: true,
        data: true,
        turno: true,
        corOnibus: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        fiscal: { select: { id: true, nome: true } },
        viagem: { select: { id: true, nomeMotorista: true, linhaRota: true } },
        _count: { select: { presencas: true, ocorrencias: true } },
      },
    }),
    prisma.chamada.count({ where }),
  ]);
  const items = calls.map((call) => ({
    ...call,
    motorista: call.viagem?.nomeMotorista ?? null,
    rota: call.viagem?.linhaRota ?? null,
    totalAlunos: call._count.presencas,
    totalOcorrencias: call._count.ocorrencias,
  }));
  return { items, pagination: pagination(page, limit, total) };
}
