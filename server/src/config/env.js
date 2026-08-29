import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  CPF_HASH_SECRET: z.string().min(32, 'CPF_HASH_SECRET deve ter ao menos 32 caracteres').optional(),
  FISCAL_PASSWORD: z.string().min(8, 'FISCAL_PASSWORD deve ter ao menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN deve usar formato como 30m ou 8h').default('8h'),
  JWT_ISSUER: z.string().min(1).default('sistema-transporte-api'),
  JWT_AUDIENCE: z.string().min(1).default('sistema-transporte-admin'),
  FRONTEND_URL: z.string().url().optional(),
  CLIENT_URL: z.string().url().optional(),
  TRUST_PROXY: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),
}).superRefine((values, context) => {
  if (values.NODE_ENV === 'production' && !values.FRONTEND_URL) {
    context.addIssue({ code: 'custom', path: ['FRONTEND_URL'], message: 'FRONTEND_URL é obrigatória em produção' });
  }
  if (values.NODE_ENV === 'production' && values.JWT_SECRET.includes('substitua-por-uma-chave')) {
    context.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'JWT_SECRET padrão não pode ser usado em produção' });
  }
  if (values.NODE_ENV === 'production' && !values.CPF_HASH_SECRET) {
    context.addIssue({ code: 'custom', path: ['CPF_HASH_SECRET'], message: 'CPF_HASH_SECRET é obrigatória em produção' });
  }
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const expiresInSeconds = Number.parseInt(values.JWT_EXPIRES_IN, 10) * units[values.JWT_EXPIRES_IN.at(-1)];
  if (expiresInSeconds > 86400) {
    context.addIssue({ code: 'custom', path: ['JWT_EXPIRES_IN'], message: 'JWT_EXPIRES_IN não pode exceder 24 horas' });
  }
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) { console.error('Variáveis de ambiente inválidas:', z.treeifyError(parsed.error)); process.exit(1); }
export const env = {
  ...parsed.data,
  CPF_HASH_SECRET: parsed.data.CPF_HASH_SECRET || parsed.data.JWT_SECRET,
  FRONTEND_URL: parsed.data.FRONTEND_URL || parsed.data.CLIENT_URL
    ? new URL(parsed.data.FRONTEND_URL || parsed.data.CLIENT_URL).origin
    : null,
};
