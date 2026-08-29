import { useCallback, useEffect, useState } from 'react';
import OcorrenciaDetailsModal from '../../components/OcorrenciaDetailsModal';
import OcorrenciaFormModal from '../../components/OcorrenciaFormModal';
import { alunoService } from '../../services/aluno.service';
import { ocorrenciaService } from '../../services/ocorrencia.service';
import { useAuth } from '../../hooks/useAuth';

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const emptyFilters = { aluno: '', alunoId: '', fiscal: '', dataInicio: '', dataFim: '', turno: '' };
const shiftLabels = { MATUTINO: 'Matutino', INTEGRAL: 'Integral', NOTURNO: 'Noturno' };

export default function OcorrenciasPage() {
  const { administrador } = useAuth();
  const isAdmin = administrador.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [showStudentOptions, setShowStudentOptions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(filterInput);
      setPagination((old) => ({ ...old, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [filterInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const data = await ocorrenciaService.list({ page: pagination.page, limit: pagination.limit, ...params });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível carregar as ocorrências.' });
    } finally { setLoading(false); }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const term = filterInput.aluno.trim();
    if (filterInput.alunoId || term.length < 2) {
      setStudentOptions([]);
      setSearchingStudents(false);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const data = await alunoService.list({ search: term, page: 1, limit: 8 });
        if (active) { setStudentOptions(data.items); setShowStudentOptions(true); }
      } catch { if (active) setStudentOptions([]); }
      finally { if (active) setSearchingStudents(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [filterInput.aluno, filterInput.alunoId]);

  function setFilter(field, value) { setFilterInput((old) => ({ ...old, [field]: value })); }
  function changeStudent(value) { setFilterInput((old) => ({ ...old, aluno: value, alunoId: '' })); setShowStudentOptions(true); }
  function selectStudent(student) { setFilterInput((old) => ({ ...old, aluno: student.nomeCompleto, alunoId: student.id })); setStudentOptions([]); setShowStudentOptions(false); }
  function startEdit() { setEditing(selected); setSelected(null); }

  return <main className="app-content">
    <div className="page-heading"><div><h1>Ocorrências</h1><p>Consulte e atualize observações do histórico operacional.</p></div></div>
    {feedback && <div className={`feedback ${feedback.type}`}><span>{feedback.text}</span><button onClick={() => setFeedback(null)}>×</button></div>}
    <section className="card">
      <div className="occurrence-filters">
        <label className="student-autocomplete"><span>Aluno</span><input type="search" role="combobox" aria-autocomplete="list" aria-expanded={showStudentOptions && studentOptions.length > 0} aria-controls="student-options" placeholder="Pesquisar aluno" value={filterInput.aluno} onFocus={() => setShowStudentOptions(true)} onBlur={() => setTimeout(() => setShowStudentOptions(false), 150)} onChange={(event) => changeStudent(event.target.value)} />{searchingStudents && <small>Buscando...</small>}{showStudentOptions && studentOptions.length > 0 && <ul id="student-options" role="listbox">{studentOptions.map((student) => <li key={student.id} role="option"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectStudent(student)}><span>{student.nomeCompleto}</span><small>{student.ativo ? 'Ativo' : 'Inativo'}</small></button></li>)}</ul>}</label>
        <label><span>Fiscal</span><input value={filterInput.fiscal} onChange={(event) => setFilter('fiscal', event.target.value)} /></label>
        <label><span>Data inicial</span><input type="date" value={filterInput.dataInicio} onChange={(event) => setFilter('dataInicio', event.target.value)} /></label>
        <label><span>Data final</span><input type="date" value={filterInput.dataFim} onChange={(event) => setFilter('dataFim', event.target.value)} /></label>
        <label><span>Turno</span><select value={filterInput.turno} onChange={(event) => setFilter('turno', event.target.value)}><option value="">Todos</option><option value="MATUTINO">Matutino</option><option value="INTEGRAL">Integral</option><option value="NOTURNO">Noturno</option></select></label>
      </div>
      {filterInput.alunoId && <div className="occurrence-student-summary" aria-live="polite"><div><span>Aluno</span><strong>{filterInput.aluno}</strong></div><div><span>Total de ocorrências</span><strong>{loading ? '—' : pagination.total}</strong></div></div>}
      <div className="table-wrapper"><table><thead><tr><th>Aluno</th><th>Data</th><th>Fiscal</th><th>Chamada</th><th>Observação</th><th>Ações</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty-state">Carregando...</td></tr> : items.length === 0 ? <tr><td colSpan="6" className="empty-state">Nenhuma ocorrência encontrada.</td></tr> : items.map((item) => <tr key={item.id}><td data-label="Aluno">{item.aluno.nomeCompleto}</td><td data-label="Data">{new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(item.chamada.data))}</td><td data-label="Fiscal">{item.fiscal.nome}</td><td data-label="Chamada">#{item.chamada.id} · {shiftLabels[item.chamada.turno]}</td><td data-label="Observação"><span className={filterInput.alunoId ? 'occurrence-note-full' : 'truncate-note'}>{item.observacao}</span></td><td data-label="Ações"><button className="text-button" onClick={() => setSelected(item)}>Detalhes</button>{isAdmin && <button className="text-button" onClick={() => setEditing(item)}>Editar</button>}</td></tr>)}</tbody></table></div>
      <div className="pagination"><span>{pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page - 1 }))}>Anterior</button><span>{pagination.page}/{pagination.totalPages}</span><button className="button button-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page + 1 }))}>Próxima</button></div></div>
    </section>
    {selected && <OcorrenciaDetailsModal ocorrencia={selected} onClose={() => setSelected(null)} onEdit={isAdmin ? startEdit : undefined} />}
    {editing && <OcorrenciaFormModal ocorrencia={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setFeedback({ type: 'success', text: 'Ocorrência atualizada com sucesso.' }); load(); }} />}
  </main>;
}
