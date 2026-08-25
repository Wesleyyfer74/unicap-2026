import 'dotenv/config';
import app from './src/app.js';
import { env } from './src/config/env.js';
import { ensureInitialAdmin } from './src/services/bootstrap.service.js';

let server;

async function start() {
  server = app.listen(env.PORT, () => console.log(`API iniciada na porta ${env.PORT}`));
  try {
    await ensureInitialAdmin();
  } catch (error) {
    console.error('Falha ao verificar o administrador inicial:', error.message);
  }
}

function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando servidor...`);
  if (!server) return process.exit(0);
  return server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
