import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const adminSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2),
  ADMIN_EMAIL: z.string().trim().email().transform((email) => email.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'ADMIN_PASSWORD deve possuir no máximo 72 bytes'),
});

async function main() {
  const admin = adminSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(admin.ADMIN_PASSWORD, 12);
  await prisma.administrador.upsert({
    where: { email: admin.ADMIN_EMAIL },
    update: { nome: admin.ADMIN_NAME, passwordHash, ativo: true, tokenVersion: { increment: 1 } },
    create: { nome: admin.ADMIN_NAME, email: admin.ADMIN_EMAIL, passwordHash },
  });
  console.log(`Administrador inicial configurado: ${admin.ADMIN_EMAIL}`);
}

main()
  .catch((error) => { console.error('Falha ao executar o seed:', error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
