import { z } from 'zod';

const bcryptPassword = (label) => z.string()
  .min(1, `${label} é obrigatória`)
  .max(128, `${label} é muito longa`)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, `${label} deve possuir no máximo 72 bytes`);

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, 'Email é obrigatório').max(191, 'Email muito longo').email('Email inválido').transform((email) => email.toLowerCase()),
    password: bcryptPassword('Senha'),
  }).strict(),
});

export const fiscalLoginSchema = z.object({
  body: z.object({
    fiscalId: z.coerce.number().int().positive('Selecione um fiscal'),
    password: bcryptPassword('Senha'),
  }).strict(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: bcryptPassword('Senha atual'),
    newPassword: bcryptPassword('A nova senha').refine((value) => value.length >= 8, 'A nova senha deve ter ao menos 8 caracteres'),
    confirmPassword: bcryptPassword('Confirmação da nova senha'),
  }).strict().superRefine(({ newPassword, confirmPassword }, context) => {
    if (newPassword !== confirmPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'A confirmação da senha não confere' });
    }
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, 'Email é obrigatório').max(191, 'Email muito longo').email('Email inválido').transform((email) => email.toLowerCase()),
    currentPassword: bcryptPassword('Senha atual'),
  }).strict(),
});
