import { z } from 'zod';

const idParams = z.object({ id: z.coerce.number().int().positive('ID inválido') }).strict();
const observation = z.object({ observacao: z.string().trim().min(3, 'Observação é obrigatória').max(5000, 'Observação muito longa') }).strict();

export const createOcorrenciaSchema = z.object({
  params: idParams,
  body: observation.extend({ alunoId: z.coerce.number().int().positive('Aluno inválido') }),
});
export const updateOcorrenciaSchema = z.object({ params: idParams, body: observation });
export const ocorrenciaIdSchema = z.object({ params: idParams });
export const listOcorrenciasSchema = z.object({ query: z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  aluno: z.string().trim().max(191).optional().default(''),
  alunoId: z.coerce.number().int().positive('Aluno inválido').optional(),
  fiscal: z.string().trim().max(191).optional().default(''),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
  turno: z.enum(['MATUTINO', 'INTEGRAL', 'NOTURNO']).optional(),
  chamadaId: z.coerce.number().int().positive('Chamada inválida').optional(),
}).strict() });
