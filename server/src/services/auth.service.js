import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

const publicAdminSelect = { id: true, nome: true, email: true, ativo: true, createdAt: true, updatedAt: true };
const DUMMY_PASSWORD_HASH = '$2b$12$NWFitxA2htyIyhj4y3AUj.U1D0pPYMphgRF8G6nd/EwE5et7utjZa';

export async function login(email, password) {
  const administrador = await prisma.administrador.findUnique({ where: { email: email.toLowerCase() } });
  const passwordMatches = await bcrypt.compare(password, administrador?.passwordHash || DUMMY_PASSWORD_HASH);
  if (!administrador || !passwordMatches || !administrador.ativo) {
    throw new AppError('Email ou senha inválidos', 401);
  }

  const token = jwt.sign(
    { type: 'admin', ver: administrador.tokenVersion },
    env.JWT_SECRET,
    {
      subject: String(administrador.id),
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  );
  const { passwordHash: _passwordHash, tokenVersion: _tokenVersion, ...adminSeguro } = administrador;
  return { token, administrador: { ...adminSeguro, role: 'ADMIN' }, usuario: { ...adminSeguro, role: 'ADMIN' } };
}

export async function listLoginFiscais() {
  return prisma.fiscal.findMany({
    where: { ativo: true, deletedAt: null },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });
}

export async function fiscalLogin(fiscalId, password) {
  const fiscal = await prisma.fiscal.findFirst({
    where: { id: fiscalId, ativo: true, deletedAt: null },
    select: { id: true, nome: true },
  });
  const supplied = createHash('sha256').update(password).digest();
  const expected = createHash('sha256').update(env.FISCAL_PASSWORD).digest();
  if (!fiscal || !timingSafeEqual(supplied, expected)) throw new AppError('Fiscal ou senha inválidos', 401);

  const token = jwt.sign({ type: 'fiscal' }, env.JWT_SECRET, {
    subject: String(fiscal.id), expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256',
    issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE,
  });
  return { token, usuario: { ...fiscal, fiscalId: fiscal.id, role: 'FISCAL' } };
}

export async function getSession(administradorId) {
  const administrador = await prisma.administrador.findUnique({ where: { id: administradorId }, select: publicAdminSelect });
  if (!administrador?.ativo) throw new AppError('Sessão inválida', 401);
  return administrador;
}

export async function changePassword(administradorId, currentPassword, newPassword) {
  const administrador = await prisma.administrador.findUnique({ where: { id: administradorId } });
  if (!administrador?.ativo) throw new AppError('Administrador inválido ou inativo', 401);
  if (!(await bcrypt.compare(currentPassword, administrador.passwordHash))) throw new AppError('Senha atual incorreta', 400);
  if (await bcrypt.compare(newPassword, administrador.passwordHash)) throw new AppError('A nova senha deve ser diferente da senha atual', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.administrador.update({
    where: { id: administradorId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
}

export async function updateProfile(administradorId, email, currentPassword) {
  const administrador = await prisma.administrador.findUnique({ where: { id: administradorId } });
  if (!administrador?.ativo) throw new AppError('Administrador inválido ou inativo', 401);
  if (!(await bcrypt.compare(currentPassword, administrador.passwordHash))) throw new AppError('Senha atual incorreta', 400);

  const normalizedEmail = email.toLowerCase();
  const emailOwner = await prisma.administrador.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (emailOwner && emailOwner.id !== administradorId) throw new AppError('Este email já está em uso', 409);

  return prisma.administrador.update({
    where: { id: administradorId },
    data: { email: normalizedEmail },
    select: publicAdminSelect,
  });
}
