import { useCallback, useEffect, useState } from 'react';
import Modal from './Modal';
import { chamadaService } from '../services/chamada.service';
import OcorrenciaFormModal from './OcorrenciaFormModal';

const emptyData = { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
const formatTime = (value) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));

export default function ChamadaPresencasModal({ chamada, onClose, onRemoved }) {
  const [data, setData] = useState(emptyData);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const [occurrenceAluno, setOccurrenceAluno] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [searchInput]);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await chamadaService.listPresences(chamada.id, { page, limit: 10, search: search || undefined })); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível carregar as presenças.'); }
    finally { setLoading(false); }
  }, [chamada.id, page, search]);
  useEffect(() => { load(); }, [load]);

  async function confirmRemoval() {
    try { await chamadaService.removePresence(chamada.id, removing.id); setRemoving(null); onRemoved(removing.id); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível remover a presença.'); setRemoving(null); }
  }

  return <Modal title="Alunos registrados" onClose={onClose}><div className="presence-modal"><label className="presence-search"><span>Pesquisar aluno</span><input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nome do aluno" /></label>{error && <div className="form-error" role="alert">{error}</div>}{success && <div className="feedback success">{success}</div>}<div className="table-wrapper"><table><thead><tr><th>Aluno</th><th>Horário</th><th>Status</th><th>Ações</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Carregando...</td></tr> : data.items.length === 0 ? <tr><td colSpan="4" className="empty-state">Nenhum aluno encontrado.</td></tr> : data.items.map((presence) => <tr key={presence.id}><td data-label="Aluno">{presence.aluno.nomeCompleto}</td><td data-label="Horário">{formatTime(presence.registradoEm)}</td><td data-label="Status"><span className="status active">Registrado</span></td><td data-label="Ações">{chamada.status === 'ABERTA' ? <button className="text-button danger" onClick={() => setRemoving(presence)}>Remover</button> : <button className="text-button" onClick={() => setOccurrenceAluno(presence.aluno)}>Adicionar ocorrência</button>}</td></tr>)}</tbody></table></div><div className="pagination"><span>{data.pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={page <= 1 || loading} onClick={() => setPage((old) => old - 1)}>Anterior</button><span>{page}/{data.pagination.totalPages}</span><button className="button button-secondary" disabled={page >= data.pagination.totalPages || loading} onClick={() => setPage((old) => old + 1)}>Próxima</button></div></div></div>{removing && <div className="nested-confirm" role="alertdialog" aria-modal="true"><div><h3>Remover presença?</h3><p>Confirma a remoção de <strong>{removing.aluno.nomeCompleto}</strong> desta chamada?</p><footer className="modal-actions"><button className="button button-secondary" onClick={() => setRemoving(null)}>Cancelar</button><button className="button button-danger" onClick={confirmRemoval}>Remover</button></footer></div></div>}{occurrenceAluno && <OcorrenciaFormModal chamada={chamada} aluno={occurrenceAluno} onClose={() => setOccurrenceAluno(null)} onSaved={() => { setOccurrenceAluno(null); setSuccess('Ocorrência registrada com sucesso.'); }} />}</Modal>;
}
