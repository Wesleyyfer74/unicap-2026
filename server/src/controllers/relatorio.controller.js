import { list } from '../services/relatorio.service.js';
import { streamReportPdf } from '../services/relatorio-pdf.service.js';
import { env } from '../config/env.js';

export async function report(request, response, next) {
  try {
    return response.json(await list(request.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function pdf(request, response, next) {
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: env.APP_TIMEZONE }).format(new Date());
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="relatorio-frequencia-${today}.pdf"`);
    response.setHeader('Cache-Control', 'no-store');
    await streamReportPdf(response, request.validated.query);
  } catch (error) {
    if (!response.headersSent) return next(error);
    return response.destroy(error);
  }
}
