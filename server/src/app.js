import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import fiscalRoutes from './routes/fiscal.routes.js';
import alunoRoutes from './routes/aluno.routes.js';
import chamadaRoutes from './routes/chamada.routes.js';
import ocorrenciaRoutes from './routes/ocorrencia.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import relatorioRoutes from './routes/relatorio.routes.js';
import publicRoutes from './routes/public.routes.js';
import { globalLimiter, loginLimiter, publicRegistrationLimiter } from './middlewares/rate-limit.middleware.js';
const app = express();
app.disable('x-powered-by');
if (env.TRUST_PROXY) app.set('trust proxy', 1);
app.use(helmet());

// Mantém a verificação de disponibilidade independente do banco e do CORS.
// A Hostinger pode consultar este endpoint usando uma origem interna própria.
app.get('/api/health', (_request, response) => response.status(200).json({ ok: true }));

const apiCors = cors((request, callback) => {
  const origin = request.get('origin');
  const forwardedHost = request.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProtocol = request.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const publicRequestOrigin = forwardedHost ? `${forwardedProtocol || 'https'}://${forwardedHost}` : null;
  const allowedOrigins = new Set([env.FRONTEND_URL, publicRequestOrigin].filter(Boolean));

  if (!origin || allowedOrigins.has(origin)) {
    return callback(null, {
      origin: true,
      credentials: true,
      exposedHeaders: ['Content-Disposition', 'RateLimit', 'RateLimit-Policy'],
    });
  }

  const error = new Error('Origem não permitida pelo CORS');
  error.status = 403;
  return callback(error);
});

// CORS é uma proteção para chamadas de API feitas pelo navegador. Aplicá-lo
// aos arquivos do React também bloquearia probes internos e a página inicial.
app.use('/api', apiCors);
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb', parameterLimit: 100 }));
if (env.NODE_ENV !== 'test') {
  morgan.token('safe-path', (request) => request.path);
  app.use(morgan(':remote-addr :method :safe-path :status :response-time ms'));
}
app.use('/api/auth/login', loginLimiter);
app.use('/api/public/alunos', publicRegistrationLimiter);
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/fiscais', fiscalRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/chamadas', chamadaRoutes);
app.use('/api/ocorrencias', ocorrenciaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/v1', routes);
if (env.NODE_ENV === 'production') {
  const clientDist = resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist, { index: false, maxAge: '1d' }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => response.sendFile(resolve(clientDist, 'index.html')));
}
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
