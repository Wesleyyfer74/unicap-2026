import { useCallback, useEffect, useState } from 'react';
import FiscalFormModal from '../../components/FiscalFormModal';
import Modal from '../../components/Modal';
import { fiscalService } from '../../services/fiscal.service';

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function FiscaisPage() {
  const [fiscais, setFiscais] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [ativo, setAtivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const [confirming, setConfirming] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput.trim()); setPagination((old) => ({ ...old, page: 1 })); }, 350); return () => clearTimeout(timer); }, [searchInput]);

  const loadFiscais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fiscalService.list({ page: pagination.page, limit: pagination.limit, search: search || undefined, ativo: ativo || undefined });
      setFiscais(data.items); setPagination(data.pagination);
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível carregar os fiscais.' }); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search, ativo]);

  useEffect(() => { loadFiscais(); }, [loadFiscais]);

  async function saveFiscal(data) {
    setSaving(true);
    try {
      await (editing ? fiscalService.update(editing.id, data) : fiscalService.create(data));
      setFeedback({ type: 'success', text: editing ? 'Fiscal atualizado com sucesso.' : 'Fiscal cadastrado com sucesso.' });
      setEditing(undefined); await loadFiscais();
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível salvar o fiscal.' }); }
    finally { setSaving(false); }
  }

  async function changeStatus(fiscal, nextStatus) {
    setSaving(true);
    try {
      await fiscalService.updateStatus(fiscal.id, nextStatus);
      setFeedback({ type: 'success', text: `Fiscal ${nextStatus ? 'ativado' : 'desativado'} com sucesso.` });
      setConfirming(null); await loadFiscais();
    } catch (error) { setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível alterar o status.' }); }
    finally { setSaving(false); }
  }

  async function deleteFiscal() {
    setSaving(true);
    try {
      await fiscalService.remove(confirmingDelete.id);
      setFeedback({ type: 'success', text: 'Fiscal arquivado. Seu histórico foi preservado.' });
      setConfirmingDelete(null);
      if (fiscais.length === 1 && pagination.page > 1) setPagination((old) => ({ ...old, page: old.page - 1 }));
      else await loadFiscais();
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Não foi possível excluir o fiscal.' });
      setConfirmingDelete(null);
    } finally { setSaving(false); }
  }

  return <main className="app-content"><div className="page-heading"><div><h1>Fiscais</h1><p>Cadastre e gerencie os fiscais responsáveis pelas chamadas.</p></div><button className="button button-primary" onClick={() => setEditing(null)}>Novo Fiscal</button></div>{feedback && <div className={`feedback ${feedback.type}`} role="alert"><span>{feedback.text}</span><button aria-label="Fechar aviso" onClick={() => setFeedback(null)}>×</button></div>}<section className="card"><div className="filters"><label><span>Pesquisar</span><input type="search" placeholder="Nome do fiscal" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label><label><span>Status</span><select value={ativo} onChange={(event) => { setAtivo(event.target.value); setPagination((old) => ({ ...old, page: 1 })); }}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label></div><div className="table-wrapper"><table><thead><tr><th>Nome</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>{loading ? <tr><td colSpan="4" className="empty-state">Carregando...</td></tr> : fiscais.length === 0 ? <tr><td colSpan="4" className="empty-state">Nenhum fiscal encontrado.</td></tr> : fiscais.map((fiscal) => <tr key={fiscal.id}><td data-label="Nome">{fiscal.nome}</td><td data-label="Status"><span className={`status ${fiscal.ativo ? 'active' : 'inactive'}`}>{fiscal.ativo ? 'Ativo' : 'Inativo'}</span></td><td data-label="Cadastro">{new Intl.DateTimeFormat('pt-BR').format(new Date(fiscal.createdAt))}</td><td data-label="Ações" className="actions"><button className="text-button" onClick={() => setEditing(fiscal)}>Editar</button>{fiscal.ativo ? <button className="text-button danger" onClick={() => setConfirming(fiscal)}>Desativar</button> : <button className="text-button" onClick={() => changeStatus(fiscal, true)}>Ativar</button>}<button className="text-button danger" onClick={() => setConfirmingDelete(fiscal)}>Excluir</button></td></tr>)}</tbody></table></div><div className="pagination"><span>{pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={pagination.page <= 1 || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page - 1 }))}>Anterior</button><span>Página {pagination.page} de {pagination.totalPages}</span><button className="button button-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => setPagination((old) => ({ ...old, page: old.page + 1 }))}>Próxima</button></div></div></section>{editing !== undefined && <FiscalFormModal fiscal={editing} saving={saving} onSave={saveFiscal} onClose={() => setEditing(undefined)} />}{confirming && <Modal title="Desativar fiscal" onClose={() => setConfirming(null)}><p>Deseja desativar <strong>{confirming.nome}</strong>? O histórico será preservado.</p><footer className="modal-actions"><button className="button button-secondary" onClick={() => setConfirming(null)}>Cancelar</button><button className="button button-danger" disabled={saving} onClick={() => changeStatus(confirming, false)}>{saving ? 'Desativando...' : 'Desativar'}</button></footer></Modal>}{confirmingDelete && <Modal title="Excluir fiscal" onClose={() => setConfirmingDelete(null)}><p>Deseja excluir definitivamente <strong>{confirmingDelete.nome}</strong>?</p><p>Fiscais com histórico de chamadas, viagens ou ocorrências não podem ser excluídos.</p><footer className="modal-actions"><button className="button button-secondary" onClick={() => setConfirmingDelete(null)}>Cancelar</button><button className="button button-danger" disabled={saving} onClick={deleteFiscal}>{saving ? 'Excluindo...' : 'Excluir definitivamente'}</button></footer></Modal>}</main>;
}
