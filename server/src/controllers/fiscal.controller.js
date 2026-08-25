import * as fiscalService from '../services/fiscal.service.js';

export async function list(request, response, next) {
  try { return response.json(await fiscalService.list(request.validated.query)); }
  catch (error) { return next(error); }
}
export async function listArchived(request, response, next) { try { return response.json(await fiscalService.listArchived(request.validated.query)); } catch (error) { return next(error); } }
export async function create(request, response, next) {
  try { return response.status(201).json({ fiscal: await fiscalService.create(request.validated.body.nome) }); }
  catch (error) { return next(error); }
}
export async function update(request, response, next) {
  try { return response.json({ fiscal: await fiscalService.update(request.validated.params.id, request.validated.body.nome) }); }
  catch (error) { return next(error); }
}
export async function updateStatus(request, response, next) {
  try { return response.json({ fiscal: await fiscalService.updateStatus(request.validated.params.id, request.validated.body.ativo) }); }
  catch (error) { return next(error); }
}
export async function remove(request, response, next) {
  try { await fiscalService.remove(request.validated.params.id); return response.status(204).send(); }
  catch (error) { return next(error); }
}
