import { prisma } from '../config/prisma.js';
import AppError from '../utils/AppError.js';

const toTime = (value) => value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
const viagemSelect = { id: true, chamadaId: true, nomeMotorista: true, fiscalId: true, linhaRota: true, turno: true, horarioSaida: true, horarioChegada: true, hodometroSaida: true, hodometroChegada: true, createdAt: true, updatedAt: true, fiscal: { select: { id: true, nome: true } } };

export async function findByCall(chamadaId) {
  const chamada = await prisma.chamada.findUnique({ where: { id: chamadaId }, select: { id: true } });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  return prisma.viagem.findUnique({ where: { chamadaId }, select: viagemSelect });
}

export async function create(chamadaId, data) {
  const chamada = await prisma.chamada.findUnique({ where: { id: chamadaId }, select: { status: true, viagem: { select: { id: true } } } });
  if (!chamada) throw new AppError('Chamada não encontrada', 404);
  if (chamada.status !== 'FINALIZADA') throw new AppError('A viagem só pode ser preenchida após a finalização da chamada', 409);
  if (chamada.viagem) throw new AppError('Esta chamada já possui uma viagem registrada', 409);
  const fiscal = await prisma.fiscal.findFirst({ where: { id: data.fiscalId, deletedAt: null }, select: { id: true } });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);
  return prisma.viagem.create({
    data: {
      chamadaId,
      nomeMotorista: data.nomeMotorista,
      fiscalId: data.fiscalId,
      linhaRota: data.linhaRota,
      turno: data.turno,
      horarioSaida: toTime(data.horarioSaida),
      horarioChegada: toTime(data.horarioChegada),
      hodometroSaida: data.hodometroSaida,
      hodometroChegada: data.hodometroChegada,
    },
    select: viagemSelect,
  });
}

export async function update(chamadaId, data) {
  if (!(await findByCall(chamadaId))) throw new AppError('Viagem não encontrada para esta chamada', 404);
  const fiscal = await prisma.fiscal.findFirst({ where: { id: data.fiscalId, deletedAt: null }, select: { id: true } });
  if (!fiscal) throw new AppError('Fiscal não encontrado', 404);
  return prisma.viagem.update({
    where: { chamadaId },
    data: {
      nomeMotorista: data.nomeMotorista,
      fiscalId: data.fiscalId,
      linhaRota: data.linhaRota ?? null,
      turno: data.turno ?? null,
      horarioSaida: toTime(data.horarioSaida),
      horarioChegada: toTime(data.horarioChegada),
      hodometroSaida: data.hodometroSaida ?? null,
      hodometroChegada: data.hodometroChegada ?? null,
    },
    select: viagemSelect,
  });
}
