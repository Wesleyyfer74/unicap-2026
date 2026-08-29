import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export async function authenticate(request, response, next) {
  try {
    const authorization = request.headers.authorization;
    const parts = typeof authorization === 'string' ? authorization.trim().split(/\s+/) : [];
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return response.status(401).json({ message: 'Token de autenticação não informado' });
    }
    const payload = jwt.verify(parts[1], env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE,
    });
    const userId = Number(payload.sub);
    if (typeof payload !== 'object' || !['admin', 'fiscal'].includes(payload.type) || !Number.isSafeInteger(userId) || userId <= 0) {
      return response.status(401).json({ message: 'Token inválido' });
    }
    if (payload.type === 'admin') {
      if (!Number.isInteger(payload.ver)) return response.status(401).json({ message: 'Token inválido' });
      const administrador = await prisma.administrador.findUnique({
        where: { id: userId },
        select: { id: true, nome: true, email: true, ativo: true, tokenVersion: true, createdAt: true, updatedAt: true },
      });
      if (!administrador?.ativo || administrador.tokenVersion !== payload.ver) {
        return response.status(401).json({ message: 'Sessão inválida ou expirada' });
      }
      const { tokenVersion: _tokenVersion, ...administradorSeguro } = administrador;
      request.administrador = administradorSeguro;
      request.auth = { role: 'ADMIN', usuario: { ...administradorSeguro, role: 'ADMIN' } };
      return next();
    }
    const fiscal = await prisma.fiscal.findFirst({
      where: { id: userId, ativo: true, deletedAt: null }, select: { id: true, nome: true },
    });
    if (!fiscal) return response.status(401).json({ message: 'Fiscal inativo ou sessão inválida' });
    request.fiscal = fiscal;
    request.auth = { role: 'FISCAL', fiscalId: fiscal.id, usuario: { ...fiscal, fiscalId: fiscal.id, role: 'FISCAL' } };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ message: 'Token inválido ou expirado' });
    }
    return next(error);
  }
}

export function authorizeAdmin(request, response, next) {
  if (request.auth?.role !== 'ADMIN') return response.status(403).json({ message: 'Acesso permitido somente para administradores' });
  return next();
}

export async function authorizeChamadaAccess(request, response, next, id) {
  try {
    if (request.auth?.role !== 'FISCAL' || !/^\d+$/.test(id)) return next();
    const chamada = await prisma.chamada.findUnique({ where: { id: Number(id) }, select: { fiscalId: true } });
    if (chamada && chamada.fiscalId !== request.auth.fiscalId) {
      return response.status(403).json({ message: 'Este fiscal não possui acesso a esta chamada' });
    }
    return next();
  } catch (error) { return next(error); }
}
