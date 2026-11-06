import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const hash = (value) => createHash('sha256').update(value).digest();

export function developerLogin(request, response) {
  if (!env.DEV_ACCESS_USERNAME || !env.DEV_ACCESS_PASSWORD) return response.status(503).json({ message: 'Acesso de segurança não configurado' });
  const validUser = timingSafeEqual(hash(request.body.username || ''), hash(env.DEV_ACCESS_USERNAME));
  const validPassword = timingSafeEqual(hash(request.body.password || ''), hash(env.DEV_ACCESS_PASSWORD));
  if (!validUser || !validPassword) return response.status(401).json({ message: 'Credenciais inválidas' });
  const token = jwt.sign({ type: 'developer' }, env.JWT_SECRET, { expiresIn: '2h', algorithm: 'HS256', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE });
  return response.json({ token });
}

export function authenticateDeveloper(request, response, next) {
  try {
    const token = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE });
    if (payload?.type !== 'developer') throw new Error('Token inválido');
    return next();
  } catch { return response.status(401).json({ message: 'Acesso de segurança não autorizado' }); }
}
