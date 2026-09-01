import { useCallback, useEffect, useState } from 'react';
import ChamadaDetailsDrawer from '../../components/ChamadaDetailsDrawer';
import { chamadaService } from '../../services/chamada.service';
import { relatorioService } from '../../services/relatorio.service';
import { BUS_COLORS } from '../../utils/busColors';
import { TRANSPORT_SHIFTS, TRANSPORT_SHIFT_LABELS } from '../../utils/transportShifts';

const emptyFilters = { dataInicio: '', dataFim: '', aluno: '', turno: '', fiscal: '', motorista: '', corOnibus: '' };
const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
const shiftLabels = TRANSPORT_SHIFT_LABELS;
const statusLabels = { ABERTA: 'Aberta', FINALIZADA: 'Finalizada' };
const quantityLabel = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shortcutPeriod(period) {
  const end = new Date();
  let start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (period === 'week') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  }
  if (period === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1);
  if (period === 'year') start = new Date(end.getFullYear(), 0, 1);
  return { dataInicio: toDateInput(start), dataFim: toDateInput(end) };
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

export default function RelatoriosPage() {
  const [form, setForm] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawer, setDrawer] = useState({ open: false, chamada: null, presencas: null, ocorrencias: null, loading: false, error: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const data = await relatorioService.list({ page: pagination.page, limit: pagination.limit, ...activeFilters });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => { load(); }, [load]);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function apply(event) {
    event.preventDefault();
    if (form.dataInicio && form.dataFim && form.dataFim < form.dataInicio) {
      setError('Data final não pode ser anterior à data inicial.');
      return;
    }
    setError('');
    setSuccess('');
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters({ ...form });
  }

  function applyShortcut(period) {
    const next = { ...form, ...shortcutPeriod(period) };
    setForm(next);
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters(next);
  }

  function clearFilters() {
    setForm(emptyFilters);
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters(emptyFilters);
    setError('');
    setSuccess('');
  }

  async function exportPdf() {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const response = await relatorioService.pdf(activeFilters);
      const disposition = response.headers['content-disposition'] || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `relatorio-frequencia-${toDateInput(new Date())}.pdf`;
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess('PDF gerado e enviado para download com sucesso.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível exportar o PDF.');
    } finally {
      setExporting(false);
    }
  }

  async function openDetails(id) {
    setDrawer({ open: true, chamada: null, presencas: null, ocorrencias: null, loading: true, error: '' });
    try {
      const details = await chamadaService.getDetails(id, { presencasLimit: 20, ocorrenciasLimit: 10 });
      setDrawer({ open: true, chamada: details.chamada, presencas: details.presencas, ocorrencias: details.ocorrencias, loading: false, error: '' });
    } catch (requestError) {
      setDrawer({ open: true, chamada: null, presencas: null, ocorrencias: null, loading: false, error: requestError.response?.data?.message || 'Não foi possível carregar os detalhes da chamada.' });
    }
  }

  return <main className="app-content">
    <div className="page-heading"><div><h1>Relatórios</h1><p>Visão consolidada por chamada, com alunos, viagem e ocorrências.</p></div></div>

    <section className="card report-filter-card">
      <div className="period-shortcuts" aria-label="Atalhos de período">
        <span>Períodos rápidos</span>
        <button type="button" onClick={() => applyShortcut('today')}>Hoje</button>
        <button type="button" onClick={() => applyShortcut('week')}>Esta semana</button>
        <button type="button" onClick={() => applyShortcut('month')}>Este mês</button>
        <button type="button" onClick={() => applyShortcut('year')}>Este ano</button>
      </div>
      <form className="report-filters" onSubmit={apply}>
        <label><span>Data inicial</span><input type="date" value={form.dataInicio} onChange={(event) => change('dataInicio', event.target.value)} /></label>
        <label><span>Data final</span><input type="date" value={form.dataFim} onChange={(event) => change('dataFim', event.target.value)} /></label>
        <label><span>Aluno</span><input maxLength="191" value={form.aluno} onChange={(event) => change('aluno', event.target.value)} /></label>
        <label><span>Linha / Turno</span><select value={form.turno} onChange={(event) => change('turno', event.target.value)}><option value="">Todos</option>{TRANSPORT_SHIFTS.map((shift) => <option key={shift.value} value={shift.value}>{shift.label}</option>)}</select></label>
        <label><span>Fiscal</span><input maxLength="191" value={form.fiscal} onChange={(event) => change('fiscal', event.target.value)} /></label>
        <label><span>Motorista</span><input maxLength="191" value={form.motorista} onChange={(event) => change('motorista', event.target.value)} /></label>
        <label><span>Cor do ônibus</span><select value={form.corOnibus} onChange={(event) => change('corOnibus', event.target.value)}><option value="">Todas</option>{BUS_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}</select></label>
        <footer><button type="button" className="button button-secondary" onClick={clearFilters}>Limpar filtros</button><button className="button button-primary">Aplicar filtros</button></footer>
      </form>
    </section>

    {error && <div className="feedback error" role="alert"><span>{error}</span><button type="button" aria-label="Fechar mensagem" onClick={() => setError('')}>×</button></div>}
    {success && <div className="feedback success" role="status"><span>{success}</span><button type="button" aria-label="Fechar mensagem" onClick={() => setSuccess('')}>×</button></div>}
    <section className="card report-results">
      <header className="report-heading"><div><h2>Chamadas</h2><p>{pagination.total} chamada(s) encontrada(s)</p></div><button type="button" className="button button-primary" disabled={exporting || loading} onClick={exportPdf}>{exporting ? 'Gerando PDF...' : 'Exportar PDF'}</button></header>
      <div className="table-wrapper"><table><thead><tr><th>Data</th><th>Fiscal</th><th>Linha / Turno</th><th>Cor do ônibus</th><th>Motorista</th><th>Alunos</th><th>Ocorrências</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="9" className="empty-state">Carregando...</td></tr> : items.length === 0 ? <tr><td colSpan="9" className="empty-state">Nenhuma chamada encontrada.</td></tr> : items.map((item) => <tr key={item.id} className="report-call-row" tabIndex="0" role="button" aria-label={`Ver detalhes da chamada ${item.id}`} onClick={() => openDetails(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(item.id); } }}>
          <td data-label="Data">{formatDate(item.data)}</td>
          <td data-label="Fiscal">{item.fiscal.nome}</td>
          <td data-label="Linha / Turno">{shiftLabels[item.turno]}</td>
          <td data-label="Cor do ônibus">{item.corOnibus}</td>
          <td data-label="Motorista">{item.motorista || '—'}</td>
          <td data-label="Alunos"><strong>{quantityLabel(item.totalAlunos, 'aluno', 'alunos')}</strong></td>
          <td data-label="Ocorrências"><strong>{quantityLabel(item.totalOcorrencias, 'ocorrência', 'ocorrências')}</strong></td>
          <td data-label="Status"><span className={`status ${item.status === 'ABERTA' ? 'active' : 'inactive'}`}>{statusLabels[item.status]}</span></td>
          <td data-label="Ações"><button type="button" className="text-button" onClick={(event) => { event.stopPropagation(); openDetails(item.id); }}>Ver detalhes</button></td>
        </tr>)}
      </tbody></table></div>
      <div className="pagination"><span>{pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Anterior</button><span>Página {pagination.page} de {pagination.totalPages}</span><button className="button button-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Próxima</button></div></div>
    </section>
    {drawer.open && <ChamadaDetailsDrawer chamada={drawer.chamada} initialPresences={drawer.presencas} initialOccurrences={drawer.ocorrencias} loading={drawer.loading} error={drawer.error} onClose={() => setDrawer({ open: false, chamada: null, presencas: null, ocorrencias: null, loading: false, error: '' })} />}
  </main>;
}
