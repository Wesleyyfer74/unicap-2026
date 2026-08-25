import { z } from 'zod';

export const relatorioSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    dataInicio: z.string().date().optional(),
    dataFim: z.string().date().optional(),
    aluno: z.string().trim().max(191).optional().default(''),
    turno: z.enum(['MATUTINO', 'INTEGRAL', 'NOTURNO']).optional(),
    fiscal: z.string().trim().max(191).optional().default(''),
    motorista: z.string().trim().max(191).optional().default(''),
    corOnibus: z.string().trim().max(50).optional().default(''),
  }).strict().superRefine((data, context) => {
    if (data.dataInicio && data.dataFim && data.dataFim < data.dataInicio) {
      context.addIssue({ code: 'custom', path: ['dataFim'], message: 'Data final não pode ser anterior à data inicial' });
    }
  }),
});
