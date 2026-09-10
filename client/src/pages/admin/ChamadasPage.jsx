import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChamadaFormModal from '../../components/ChamadaFormModal';
import { chamadaService } from '../../services/chamada.service';
import { TRANSPORT_SHIFTS, TRANSPORT_SHIFT_LABELS } from '../../utils/transportShifts';
import { useAuth } from '../../hooks/useAuth';

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const labels = { ...TRANSPORT_SHIFT_LABELS, ABERTA: 'Aberta', FINALIZADA: 'Finalizada' };
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
const formatTime = (value) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export default function ChamadasPage() {
  const navigate = useNavigate();
  const { administrador } = useAuth();
  const [chamadas, setChamadas] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [filters, setFilters] = useState({ data: '', turno: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadChamadas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chamadaService.list({ page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
      setChamadas(data.items); setPagination(data.pagination);
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível carregar as chamadas.' }); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, filters]);
  useEffect(() => { loadChamadas(); }, [loadChamadas]);

  async function createChamada(data) {
    setSaving(true);
    try { const chamada = await chamadaService.create(data); setCreating(false); navigate(`/admin/chamadas/${chamada.id}/scanner`); }
    catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível iniciar a chamada.' }); }
    finally { setSaving(false); }
  }
  async function updateChamada(data) {
    setSaving(true);
    try {
      await chamadaService.update(editing.id, data);
      setEditing(null);
      setFeedback({ type: 'success', text: 'Chamada atualizada com sucesso.' });
      await loadChamadas();
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível atualizar a chamada.' }); }
    finally { setSaving(false); }
  }
  async function removeChamada(chamada) {
    if (!window.confirm(`Excluir a chamada de ${chamada.fiscal.nome}? Presenças, ocorrências e viagem vinculadas serão excluídas permanentemente.`)) return;
    try {
      await chamadaService.remove(chamada.id);
      setFeedback({ type: 'success', text: 'Chamada excluída com sucesso.' });
      await loadChamadas();
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível excluir a chamada.' }); }
  }
  function changeFilter(field, value) { setFilters((old) => ({ ...old, [field]: value })); setPagination((old) => ({ ...old, page: 1 })); }

  return <main className="app-content">
    <div className="page-heading"><div><h1>Chamadas</h1><p>Acompanhe as chamadas e presenças registradas.</p></div><button className="button button-primary" onClick={() => setCreating(true)}>Nova Chamada</button></div>
    {feedback && <div className={`feedback ${feedback.type}`} role="alert"><span>{feedback.text}</span><button onClick={() => setFeedback(null)}>×</button></div>}
    <section className="card">
      <div className="filters filters-three">
        <label><span>Data</span><input type="date" value={filters.data} onChange={(event) => changeFilter('data', event.target.value)} /></label>
        <label><span>Linha / Turno</span><select value={filters.turno} onChange={(event) => changeFilter('turno', event.target.value)}><option value="">Todos</option>{TRANSPORT_SHIFTS.map((shift) => <option key={shift.value} value={shift.value}>{shift.label}</option>)}</select></label>
        <label><span>Status</span><select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}><option value="">Todos</option><option value="ABERTA">Aberta</option><option value="FINALIZADA">Finalizada</option></select></label>
      </div>
      <div className="table-wrapper"><table><thead><tr><th>Data</th><th>Início</th><th>Fiscal</th><th>Linha / Turno</th><th>Cor do ônibus</th><th>Alunos</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="8" className="empty-state">Carregando...</td></tr> : chamadas.length === 0 ? <tr><td colSpan="8" className="empty-state">Nenhuma chamada encontrada.</td></tr> : chamadas.map((chamada) => <tr key={chamada.id}><td data-label="Data">{formatDate(chamada.data)}</td><td data-label="Início">{formatTime(chamada.startedAt)}</td><td data-label="Fiscal">{chamada.fiscal.nome}</td><td data-label="Linha / Turno">{labels[chamada.turno]}</td><td data-label="Cor do ônibus">{chamada.corOnibus}</td><td data-label="Alunos">{chamada._count.presencas}</td><td data-label="Status"><span className={`status ${chamada.status === 'ABERTA' ? 'active' : 'inactive'}`}>{labels[chamada.status]}</span></td><td data-label="Ações"><button className="text-button" onClick={() => navigate(`/admin/chamadas/${chamada.id}/scanner`)}>{chamada.status === 'ABERTA' ? 'Abrir' : 'Visualizar'}</button>{administrador.role === 'ADMIN' && <><button className="text-button" onClick={() => setEditing(chamada)}>Editar</button><button className="text-button danger" onClick={() => removeChamada(chamada)}>Excluir</button></>}</td></tr>)}
      </tbody></table></div>
      <div className="pagination"><span>{pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page - 1 }))}>Anterior</button><span>Página {pagination.page} de {pagination.totalPages}</span><button className="button button-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page + 1 }))}>Próxima</button></div></div>
    </section>
    {creating && <ChamadaFormModal saving={saving} onSave={createChamada} onClose={() => setCreating(false)} />}
    {editing && <ChamadaFormModal chamada={editing} saving={saving} onSave={updateChamada} onClose={() => setEditing(null)} />}
  </main>;
}
