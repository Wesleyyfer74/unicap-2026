import { z } from 'zod';
const pagination = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(30) });
export const devLoginSchema = z.object({ body: z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(128) }).strict() });
export const accessSchema = z.object({ body: z.object({ path: z.string().trim().min(1).max(500) }).strict() });
export const listSecuritySchema = z.object({ query: pagination.extend({ tipo: z.string().trim().max(50).optional().default(''), busca: z.string().trim().max(191).optional().default('') }).strict() });
