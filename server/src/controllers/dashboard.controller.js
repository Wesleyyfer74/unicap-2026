import { getSummary } from '../services/dashboard.service.js';
export async function summary(_request, response, next) {
  try {
    response.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response.json(await getSummary());
  }
  catch (error) { return next(error); }
}
