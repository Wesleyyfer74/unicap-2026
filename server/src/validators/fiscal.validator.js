import { z } from 'zod';

const idSchema = z.object({ id: z.coerce.number().int().positive('ID inválido') }).strict();
const fiscalBody = z.object({ nome: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(191, 'Nome muito longo') }).strict();

export const listFiscaisSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(191).optional().default(''),
    ativo: z.enum(['true', 'false']).optional(),
  }).strict(),
});
export const createFiscalSchema = z.object({ body: fiscalBody });
export const fiscalIdSchema = z.object({ params: idSchema });
export const updateFiscalSchema = z.object({ params: idSchema, body: fiscalBody });
export const updateFiscalStatusSchema = z.object({ params: idSchema, body: z.object({ ativo: z.boolean() }).strict() });
