import { rateLimit } from 'express-rate-limit';

const common = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
};

export const globalLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 500,
  message: { message: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
});

export const publicRegistrationLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { message: 'Limite de cadastros atingido. Tente novamente mais tarde.' },
});
