import * as chamadaService from '../services/chamada.service.js';

export async function list(request, response, next) { try { return response.json(await chamadaService.list(request.validated.query, request.auth)); } catch (error) { return next(error); } }
export async function findById(request, response, next) { try { return response.json({ chamada: await chamadaService.findById(request.validated.params.id) }); } catch (error) { return next(error); } }
export async function findDetails(request, response, next) { try { return response.json(await chamadaService.findDetails(request.validated.params.id, request.validated.query)); } catch (error) { return next(error); } }
export async function create(request, response, next) { try { const body = request.auth.role === 'FISCAL' ? { ...request.validated.body, fiscalId: request.auth.fiscalId } : request.validated.body; return response.status(201).json({ chamada: await chamadaService.create(body) }); } catch (error) { return next(error); } }
export async function update(request, response, next) { try { return response.json({ chamada: await chamadaService.update(request.validated.params.id, request.validated.body) }); } catch (error) { return next(error); } }
export async function remove(request, response, next) { try { await chamadaService.remove(request.validated.params.id); return response.status(204).send(); } catch (error) { return next(error); } }
export async function finish(request, response, next) { try { return response.json({ chamada: await chamadaService.finish(request.validated.params.id) }); } catch (error) { return next(error); } }
export async function addPresence(request, response, next) { try { return response.status(201).json(await chamadaService.addPresence(request.validated.params.id, request.validated.body.uuid)); } catch (error) { return next(error); } }
export async function identifyStudent(request, response, next) { try { return response.json({ aluno: await chamadaService.identifyStudent(request.validated.params.id, request.validated.params.uuid) }); } catch (error) { return next(error); } }
export async function searchStudents(request, response, next) { try { return response.json(await chamadaService.searchStudents(request.validated.params.id, request.validated.query)); } catch (error) { return next(error); } }
export async function listPresences(request, response, next) { try { return response.json(await chamadaService.listPresences(request.validated.params.id, request.validated.query)); } catch (error) { return next(error); } }
export async function removePresence(request, response, next) { try { await chamadaService.removePresence(request.validated.params.id, request.validated.params.presencaId); return response.status(204).send(); } catch (error) { return next(error); } }
