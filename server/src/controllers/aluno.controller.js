import * as alunoService from '../services/aluno.service.js';

export async function list(request, response, next) { try { return response.json(await alunoService.list(request.validated.query)); } catch (error) { return next(error); } }
export async function listArchived(request, response, next) { try { return response.json(await alunoService.listArchived(request.validated.query)); } catch (error) { return next(error); } }
export async function findById(request, response, next) { try { return response.json({ aluno: await alunoService.findById(request.validated.params.id) }); } catch (error) { return next(error); } }
export async function create(request, response, next) { try { return response.status(201).json({ aluno: await alunoService.create(request.validated.body.nomeCompleto) }); } catch (error) { return next(error); } }
export async function findPublicByCpf(request, response, next) { try { return response.json({ aluno: await alunoService.findPublicByCpf(request.validated.body.cpf) }); } catch (error) { return next(error); } }
export async function update(request, response, next) { try { return response.json({ aluno: await alunoService.update(request.validated.params.id, request.validated.body.nomeCompleto) }); } catch (error) { return next(error); } }
export async function updateStatus(request, response, next) { try { return response.json({ aluno: await alunoService.updateStatus(request.validated.params.id, request.validated.body.ativo, request.validated.body.motivo) }); } catch (error) { return next(error); } }
export async function remove(request, response, next) { try { await alunoService.remove(request.validated.params.id); return response.status(204).send(); } catch (error) { return next(error); } }
export async function listPresencas(request, response, next) { try { return response.json(await alunoService.listPresencas(request.validated.params.id, request.validated.query)); } catch (error) { return next(error); } }
export async function listOcorrencias(request, response, next) { try { return response.json(await alunoService.listOcorrencias(request.validated.params.id, request.validated.query)); } catch (error) { return next(error); } }
