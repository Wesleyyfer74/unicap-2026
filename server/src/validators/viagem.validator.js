import { z } from 'zod';
import { ALL_SHIFT_VALUES } from '../utils/transport-shifts.js';

const optionalText = (max) => z.preprocess((value) => value === '' ? undefined : value, z.string().trim().max(max).optional());
const optionalNumber = z.preprocess((value) => value === '' || value === null ? undefined : value, z.coerce.number().nonnegative().max(999999999.9).optional());
const optionalTime = z.preprocess((value) => value === '' ? undefined : value, z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido').optional());

const chamadaParams = z.object({ id: z.coerce.number().int().positive() }).strict();
const viagemBody = z.object({
    nomeMotorista: z.string().trim().min(2, 'Nome do motorista é obrigatório').max(191),
    fiscalId: z.coerce.number().int().positive('Fiscal inválido'),
    linhaRota: optionalText(191),
    turno: z.preprocess((value) => value === '' ? undefined : value, z.enum(ALL_SHIFT_VALUES).optional()),
    horarioSaida: optionalTime,
    horarioChegada: optionalTime,
    hodometroSaida: optionalNumber,
    hodometroChegada: optionalNumber,
  }).strict().superRefine((data, context) => {
    if (data.hodometroSaida !== undefined && data.hodometroChegada !== undefined && data.hodometroChegada < data.hodometroSaida) {
      context.addIssue({ code: 'custom', path: ['hodometroChegada'], message: 'Hodômetro de chegada não pode ser menor que o de saída' });
    }
    if (data.horarioSaida && data.horarioChegada && data.horarioChegada < data.horarioSaida) {
      context.addIssue({ code: 'custom', path: ['horarioChegada'], message: 'Horário de chegada não pode ser anterior ao de saída' });
    }
  });

export const viagemIdSchema = z.object({ params: chamadaParams });
export const createViagemSchema = z.object({ params: chamadaParams, body: viagemBody });
export const updateViagemSchema = z.object({ params: chamadaParams, body: viagemBody });
