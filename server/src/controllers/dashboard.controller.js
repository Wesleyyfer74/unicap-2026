import { getSummary } from '../services/dashboard.service.js';
export async function summary(_request, response, next) {
  try { return response.json(await getSummary()); }
  catch (error) { return next(error); }
}
