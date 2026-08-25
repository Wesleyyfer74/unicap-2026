import * as viagemService from '../services/viagem.service.js';
export async function create(request, response, next) {
  try { return response.status(201).json({ viagem: await viagemService.create(request.validated.params.id, request.validated.body) }); }
  catch (error) { return next(error); }
}
export async function findByCall(request, response, next) {
  try { return response.json({ viagem: await viagemService.findByCall(request.validated.params.id) }); }
  catch (error) { return next(error); }
}
export async function update(request, response, next) {
  try { return response.json({ viagem: await viagemService.update(request.validated.params.id, request.validated.body) }); }
  catch (error) { return next(error); }
}
