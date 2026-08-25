import { z } from 'zod';

const idSchema = z.object({ id: z.coerce.number().int().positive('ID inválido') }).strict();
const alunoBody = z.object({ nomeCompleto: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(191, 'Nome muito longo') }).strict();
const paginationQuery = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(50).default(10) }).strict();

export const listAlunosSchema = z.object({ query: paginationQuery.extend({ search: z.string().trim().max(191).optional().default(''), ativo: z.enum(['true', 'false']).optional() }).strict() });
export const createAlunoSchema = z.object({ body: alunoBody });
export const updateAlunoSchema = z.object({ params: idSchema, body: alunoBody });
export const updateAlunoStatusSchema = z.object({
  params: idSchema,
  body: z.object({
    ativo: z.boolean(),
    motivo: z.string().trim().max(1000, 'Motivo muito longo').optional(),
  }).strict().superRefine((data, context) => {
    if (!data.ativo && (!data.motivo || data.motivo.length < 3)) {
      context.addIssue({ code: 'custom', path: ['motivo'], message: 'Informe o motivo da desativação' });
    }
  }),
});
export const alunoIdSchema = z.object({ params: idSchema });
export const alunoHistorySchema = z.object({ params: idSchema, query: paginationQuery });
export const publicAlunoCpfSchema = z.object({ body: z.object({ cpf: z.string().trim().min(11).max(14) }).strict() });
