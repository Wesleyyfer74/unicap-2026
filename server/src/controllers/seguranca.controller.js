import { registrar, listar } from '../services/seguranca.service.js';
import { developerLogin as login } from '../middlewares/dev-auth.middleware.js';
export async function developerLogin(request, response) { const result = login(request, response); await registrar(request, { tipo: response.statusCode === 200 ? 'DEV_LOGIN_SUCESSO' : 'DEV_LOGIN_FALHA', caminho: '/dev', sucesso: response.statusCode === 200 }); return result; }
export async function access(request, response) { await registrar(request, { tipo: 'ACESSO_SITE', caminho: request.validated.body.path, usuario: request.auth?.usuario }); return response.status(204).send(); }
export async function list(request, response, next) { try { return response.json(await listar(request.validated.query)); } catch (error) { return next(error); } }
