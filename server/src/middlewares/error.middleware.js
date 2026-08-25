import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

export function notFoundHandler(_request, response) {
  response.status(404).json({ message: 'Rota não encontrada' });
}

export function errorHandler(error, _request, response, _next) {
  let status = 500;
  let message = 'Erro interno do servidor';

  if (error instanceof AppError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') { status = 409; message = 'Registro duplicado'; }
    if (error.code === 'P2025') { status = 404; message = 'Registro não encontrado'; }
  } else if (error?.status === 403 && error.message === 'Origem não permitida pelo CORS') {
    status = 403;
    message = error.message;
  } else if (error instanceof SyntaxError && error?.status === 400) {
    status = 400;
    message = 'JSON inválido';
  }

  if (env.NODE_ENV === 'production') {
    console.error({ name: error?.name, code: error?.code, status });
  } else if (env.NODE_ENV !== 'test') {
    console.error(error?.stack || error);
  }

  response.status(status).json({ message, ...(error instanceof AppError && error.details ? error.details : {}) });
}
