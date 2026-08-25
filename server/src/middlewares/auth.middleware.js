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
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    const administradorId = Number(payload.sub);
    if (typeof payload !== 'object' || payload.type !== 'admin' || !Number.isSafeInteger(administradorId) || administradorId <= 0 || !Number.isInteger(payload.ver)) {
      return response.status(401).json({ message: 'Token inválido' });
    }

    const administrador = await prisma.administrador.findUnique({
      where: { id: administradorId },
      select: { id: true, nome: true, email: true, ativo: true, tokenVersion: true, createdAt: true, updatedAt: true },
    });
    if (!administrador?.ativo || administrador.tokenVersion !== payload.ver) {
      return response.status(401).json({ message: 'Sessão inválida ou expirada' });
    }

    const { tokenVersion: _tokenVersion, ...administradorSeguro } = administrador;
    request.administrador = administradorSeguro;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ message: 'Token inválido ou expirado' });
    }
    return next(error);
  }
}
