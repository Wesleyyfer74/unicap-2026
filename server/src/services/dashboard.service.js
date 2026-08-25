import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { currentDateInTimeZone } from '../utils/date.js';

export async function getSummary() {
  const today = currentDateInTimeZone(env.APP_TIMEZONE);
  const recentSince = new Date();
  recentSince.setDate(recentSince.getDate() - 7);

  const [alunos, fiscaisAtivos, chamadasHoje, presencasHoje, ocorrenciasRecentes, ultimasChamadas, ultimasOcorrencias] = await prisma.$transaction([
    prisma.aluno.count({ where: { deletedAt: null } }),
    prisma.fiscal.count({ where: { ativo: true, deletedAt: null } }),
    prisma.chamada.count({ where: { data: today } }),
    prisma.presenca.count({ where: { chamada: { data: today } } }),
    prisma.ocorrencia.count({ where: { createdAt: { gte: recentSince } } }),
    prisma.chamada.findMany({
      take: 5,
      orderBy: [{ data: 'desc' }, { startedAt: 'desc' }],
      select: { id: true, data: true, turno: true, status: true, startedAt: true, fiscal: { select: { id: true, nome: true } }, _count: { select: { presencas: true } } },
    }),
    prisma.ocorrencia.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, observacao: true, createdAt: true, aluno: { select: { id: true, nomeCompleto: true } }, fiscal: { select: { id: true, nome: true } }, chamada: { select: { id: true, data: true, turno: true } } },
    }),
  ]);

  return {
    metrics: { alunos, fiscaisAtivos, chamadasHoje, presencasHoje, ocorrenciasRecentes },
    ultimasChamadas,
    ultimasOcorrencias,
    period: { ocorrenciasRecentesDias: 7 },
  };
}
