import { useCallback, useEffect, useState } from 'react';
import AlunoHistoryModal from '../../components/AlunoHistoryModal';
import { alunoService } from '../../services/aluno.service';
import { fiscalService } from '../../services/fiscal.service';

const initialPage = { page: 1, limit: 10, total: 0, totalPages: 1 };
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export default function HistoricoPage() {
  const [type, setType] = useState('alunos');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(initialPage);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput.trim()); setPagination((old) => ({ ...old, page: 1 })); }, 350); return () => clearTimeout(timer); }, [searchInput]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const service = type === 'alunos' ? alunoService : fiscalService; const data = await service.listArchived({ page: pagination.page, limit: pagination.limit, search: search || undefined }); setItems(data.items); setPagination(data.pagination); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível carregar o histórico.'); }
    finally { setLoading(false); }
  }, [type, search, pagination.page, pagination.limit]);
  useEffect(() => { load(); }, [load]);
  function changeType(nextType) { setType(nextType); setItems([]); setPagination(initialPage); }

  return <main className="app-content"><div className="page-heading"><div><h1>Histórico</h1><p>Cadastros arquivados permanecem vinculados ao histórico operacional.</p></div></div>{error && <div className="feedback error" role="alert">{error}</div>}<section className="card"><div className="filters"><div className="shortcut-buttons" role="tablist"><button className={`button ${type === 'alunos' ? 'button-primary' : 'button-secondary'}`} onClick={() => changeType('alunos')}>Alunos excluídos</button><button className={`button ${type === 'fiscais' ? 'button-primary' : 'button-secondary'}`} onClick={() => changeType('fiscais')}>Fiscais excluídos</button></div><label><span>Pesquisar</span><input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Pesquisar por nome" /></label></div><div className="table-wrapper"><table><thead><tr><th>Nome</th>{type === 'alunos' && <th>UUID</th>}<th>Data da exclusão</th>{type === 'alunos' && <th>Ações</th>}</tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Carregando...</td></tr> : items.length === 0 ? <tr><td colSpan="4" className="empty-state">Nenhum cadastro arquivado.</td></tr> : items.map((item) => <tr key={item.id}><td data-label="Nome">{type === 'alunos' ? item.nomeCompleto : item.nome}</td>{type === 'alunos' && <td data-label="UUID"><code className="uuid">{item.uuid}</code></td>}<td data-label="Exclusão">{formatDate(item.deletedAt)}</td>{type === 'alunos' && <td data-label="Ações"><button className="text-button" onClick={() => setSelectedAluno(item)}>Ver histórico</button></td>}</tr>)}</tbody></table></div><div className="pagination"><span>{pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page - 1 }))}>Anterior</button><span>Página {pagination.page} de {pagination.totalPages}</span><button className="button button-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page + 1 }))}>Próxima</button></div></div></section>{selectedAluno && <AlunoHistoryModal aluno={selectedAluno} onClose={() => setSelectedAluno(null)} />}</main>;
}
