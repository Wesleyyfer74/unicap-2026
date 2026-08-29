import * as authService from '../services/auth.service.js';

export async function login(request, response, next) {
  try {
    const { email, password } = request.validated.body;
    response.setHeader('Cache-Control', 'no-store');
    return response.json(await authService.login(email, password));
  } catch (error) { return next(error); }
}

export async function listFiscais(_request, response, next) {
  try { return response.json({ items: await authService.listLoginFiscais() }); }
  catch (error) { return next(error); }
}

export async function fiscalLogin(request, response, next) {
  try {
    const { fiscalId, password } = request.validated.body;
    response.setHeader('Cache-Control', 'no-store');
    return response.json(await authService.fiscalLogin(fiscalId, password));
  } catch (error) { return next(error); }
}

export async function me(request, response, next) {
  try {
    response.setHeader('Cache-Control', 'no-store');
    return response.json({ usuario: request.auth.usuario, ...(request.auth.role === 'ADMIN' && { administrador: request.auth.usuario }) });
  } catch (error) { return next(error); }
}

export async function changePassword(request, response, next) {
  try {
    const { currentPassword, newPassword } = request.validated.body;
    await authService.changePassword(request.administrador.id, currentPassword, newPassword);
    return response.json({ message: 'Senha alterada com sucesso' });
  } catch (error) { return next(error); }
}

export async function updateProfile(request, response, next) {
  try {
    const { email, currentPassword } = request.validated.body;
    const administrador = await authService.updateProfile(request.administrador.id, email, currentPassword);
    response.setHeader('Cache-Control', 'no-store');
    return response.json({ message: 'Email atualizado com sucesso', administrador });
  } catch (error) { return next(error); }
}
