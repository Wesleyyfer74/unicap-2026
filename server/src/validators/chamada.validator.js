import { z } from 'zod';
import { ALL_SHIFT_VALUES, TRANSPORT_SHIFT_VALUES } from '../utils/transport-shifts.js';

const idSchema = z.object({ id: z.coerce.number().int().positive('ID inválido') }).strict();
const turnoSchema = z.enum(TRANSPORT_SHIFT_VALUES);
const turnoFilterSchema = z.enum(ALL_SHIFT_VALUES);
const corOnibusSchema = z.string().trim().min(2, 'Selecione a cor do ônibus').max(50, 'Cor do ônibus muito longa');

export const listChamadasSchema = z.object({ query: z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  fiscalId: z.coerce.number().int().positive().optional(),
  turno: turnoFilterSchema.optional(),
  status: z.enum(['ABERTA', 'FINALIZADA']).optional(),
  data: z.string().date().optional(),
}).strict() });
export const createChamadaSchema = z.object({ body: z.object({ fiscalId: z.coerce.number().int().positive('Fiscal inválido'), turno: turnoSchema, corOnibus: corOnibusSchema }).strict() });
export const chamadaIdSchema = z.object({ params: idSchema });
export const chamadaDetailsSchema = z.object({ params: idSchema, query: z.object({
  presencasLimit: z.coerce.number().int().min(1).max(50).default(20),
  ocorrenciasLimit: z.coerce.number().int().min(1).max(50).default(10),
}).strict() });
export const createPresencaSchema = z.object({ params: idSchema, body: z.object({ uuid: z.string().uuid('UUID inválido') }).strict() });
export const scannerAlunoSchema = z.object({ params: idSchema.extend({ uuid: z.string().uuid('UUID inválido') }) });
export const searchAlunosChamadaSchema = z.object({
  params: idSchema,
  query: z.object({
    search: z.string().trim().min(2, 'Digite pelo menos 2 caracteres').max(191, 'Pesquisa muito longa'),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  }).strict(),
});
export const listPresencasChamadaSchema = z.object({ params: idSchema, query: z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(191).optional().default(''),
}).strict() });
export const removePresencaSchema = z.object({ params: idSchema.extend({ presencaId: z.coerce.number().int().positive('Presença inválida') }) });
