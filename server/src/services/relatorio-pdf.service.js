import PDFDocument from 'pdfkit';
import { env } from '../config/env.js';
import { countReport, getReportBatch } from './relatorio.service.js';
import { TRANSPORT_SHIFT_LABELS } from '../utils/transport-shifts.js';

const shifts = TRANSPORT_SHIFT_LABELS;
const columns = [
  { key: 'data', label: 'Data', width: 50 },
  { key: 'aluno', label: 'Aluno', width: 105 },
  { key: 'turno', label: 'Linha / Turno', width: 115 },
  { key: 'corOnibus', label: 'Ônibus', width: 45 },
  { key: 'fiscal', label: 'Fiscal', width: 75 },
  { key: 'horario', label: 'Horário', width: 45 },
  { key: 'motorista', label: 'Motorista', width: 75 },
  { key: 'rota', label: 'Rota', width: 75 },
  { key: 'ocorrencias', label: 'Ocorrências', width: 185 },
];

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: env.APP_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: env.APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function filterDescription(filters) {
  const values = [];
  if (filters.aluno) values.push(`Aluno: ${filters.aluno}`);
  if (filters.turno) values.push(`Linha / Turno: ${shifts[filters.turno]}`);
  if (filters.fiscal) values.push(`Fiscal: ${filters.fiscal}`);
  if (filters.motorista) values.push(`Motorista: ${filters.motorista}`);
  if (filters.corOnibus) values.push(`Ônibus: ${filters.corOnibus}`);
  return values.length ? values.join('  •  ') : 'Nenhum filtro adicional';
}

function periodDescription(filters) {
  if (filters.dataInicio && filters.dataFim) return `${formatDate(`${filters.dataInicio}T00:00:00.000Z`)} a ${formatDate(`${filters.dataFim}T00:00:00.000Z`)}`;
  if (filters.dataInicio) return `A partir de ${formatDate(`${filters.dataInicio}T00:00:00.000Z`)}`;
  if (filters.dataFim) return `Até ${formatDate(`${filters.dataFim}T00:00:00.000Z`)}`;
  return 'Todo o período';
}

function drawTableHeader(doc) {
  const y = doc.y;
  doc.rect(36, y, 770, 22).fill('#123a63');
  let x = 36;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  for (const column of columns) {
    doc.text(column.label, x + 3, y + 7, { width: column.width - 6, lineBreak: false });
    x += column.width;
  }
  doc.y = y + 22;
}

function rowValues(item) {
  return {
    data: formatDate(item.data),
    aluno: item.aluno.nomeCompleto,
    turno: shifts[item.turno],
    corOnibus: item.corOnibus,
    fiscal: item.fiscal.nome,
    horario: formatTime(item.horarioPresenca),
    motorista: item.motorista || '—',
    rota: item.rota || '—',
    ocorrencias: item.ocorrencias.map(({ observacao }) => observacao).join(' | ') || '—',
  };
}

function drawRow(doc, item, striped) {
  const values = rowValues(item);
  doc.font('Helvetica').fontSize(7.2);
  const heights = columns.map((column) => doc.heightOfString(values[column.key], { width: column.width - 6, lineGap: 1 }));
  const height = Math.max(22, Math.min(54, Math.max(...heights) + 8));
  if (doc.y + height > 548) {
    doc.addPage();
    drawTableHeader(doc);
  }
  const y = doc.y;
  if (striped) doc.rect(36, y, 770, height).fill('#f3f6f9');
  doc.fillColor('#172033').font('Helvetica').fontSize(7.2);
  let x = 36;
  for (const column of columns) {
    doc.text(values[column.key], x + 3, y + 5, {
      width: column.width - 6,
      height: height - 8,
      ellipsis: true,
      lineGap: 1,
    });
    x += column.width;
  }
  doc.moveTo(36, y + height).lineTo(806, y + height).strokeColor('#dbe3eb').lineWidth(0.5).stroke();
  doc.y = y + height;
}

function addFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.font('Helvetica').fontSize(7.5).fillColor('#667387');
    doc.text('Sistema de Transporte Escolar', 36, 565, { width: 300, lineBreak: false });
    doc.text(`Página ${index + 1} de ${range.count}`, 506, 565, { width: 300, align: 'right', lineBreak: false });
  }
}

export async function streamReportPdf(response, filters) {
  const total = await countReport(filters);
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 32, right: 36, bottom: 38, left: 36 }, bufferPages: true, info: { Title: 'Relatório de Frequência' } });
  doc.pipe(response);

  doc.fillColor('#123a63').font('Helvetica-Bold').fontSize(20).text('Relatório de Frequência');
  doc.moveDown(0.35).fillColor('#4a586c').font('Helvetica').fontSize(9);
  doc.text(`Data de emissão: ${formatDateTime(new Date())}`);
  doc.text(`Período consultado: ${periodDescription(filters)}`);
  doc.text(`Filtros utilizados: ${filterDescription(filters)}`, { width: 770 });
  doc.text(`Total de registros: ${total}`);
  doc.moveDown(0.8);
  drawTableHeader(doc);

  if (total === 0) {
    doc.fillColor('#667387').font('Helvetica-Oblique').fontSize(9).text('Nenhum registro encontrado para os filtros selecionados.', 39, doc.y + 12);
  } else {
    const batchSize = 200;
    let offset = 0;
    let rowIndex = 0;
    while (offset < total) {
      const items = await getReportBatch(filters, offset, batchSize);
      if (!items.length) break;
      for (const item of items) {
        drawRow(doc, item, rowIndex % 2 === 1);
        rowIndex += 1;
      }
      offset += items.length;
    }
  }

  addFooters(doc);
  doc.end();
}
