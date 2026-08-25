import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const initialAdminSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2),
  ADMIN_EMAIL: z.string().trim().email().transform((value) => value.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
});

export async function ensureInitialAdmin() {
  if (await prisma.administrador.count()) return;
  const parsed = initialAdminSchema.safeParse(process.env);
  if (!parsed.success) throw new Error('Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.');
  await prisma.administrador.create({
    data: {
      nome: parsed.data.ADMIN_NAME,
      email: parsed.data.ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(parsed.data.ADMIN_PASSWORD, 12),
    },
  });
  console.log('Administrador inicial criado com sucesso.');
}
