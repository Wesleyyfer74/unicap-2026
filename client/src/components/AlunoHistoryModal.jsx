import { useCallback, useEffect, useState } from 'react';
import { alunoService } from '../services/aluno.service';
import { TRANSPORT_SHIFT_LABELS } from '../utils/transportShifts';
import Modal from './Modal';

const emptyPage = { items: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 1 } };
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR').format(new Date(value));
const shiftLabel = (value) => TRANSPORT_SHIFT_LABELS[value] || value;

function Pager({ data, onPage }) {
  return <div className="mini-pagination"><button disabled={data.pagination.page <= 1} onClick={() => onPage(data.pagination.page - 1)}>Anterior</button><span>{data.pagination.page}/{data.pagination.totalPages}</span><button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => onPage(data.pagination.page + 1)}>Próxima</button></div>;
}

export default function AlunoHistoryModal({ aluno, onClose }) {
  const [presencas, setPresencas] = useState(emptyPage);
  const [ocorrencias, setOcorrencias] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadPresencas = useCallback(async (page = 1) => setPresencas(await alunoService.presencas(aluno.id, { page, limit: 5 })), [aluno.id]);
  const loadOcorrencias = useCallback(async (page = 1) => setOcorrencias(await alunoService.ocorrencias(aluno.id, { page, limit: 5 })), [aluno.id]);
  useEffect(() => { setLoading(true); Promise.all([loadPresencas(), loadOcorrencias()]).catch((requestError) => setError(requestError.response?.data?.message || 'Não foi possível carregar o histórico.')).finally(() => setLoading(false)); }, [loadPresencas, loadOcorrencias]);

  return <Modal title={`Histórico — ${aluno.nomeCompleto}`} onClose={onClose}>
    {error && <div className="form-error">{error}</div>}
    {loading ? <p>Carregando...</p> : <div className="history">
      <section><div className="history-heading"><h3>Presenças</h3><span>{presencas.pagination.total}</span></div>{presencas.items.length ? presencas.items.map((item) => <article key={item.id}><strong>{formatDate(item.chamada.data)} · {shiftLabel(item.chamada.turno)}</strong><span>Fiscal: {item.chamada.fiscal.nome}</span><small>Registrado em {formatDate(item.registradoEm)}</small></article>) : <p className="empty-inline">Nenhuma presença registrada.</p>}<Pager data={presencas} onPage={(page) => loadPresencas(page).catch(() => setError('Falha ao carregar presenças.'))} /></section>
      <section><div className="history-heading"><h3>Ocorrências</h3><span>{ocorrencias.pagination.total}</span></div>{ocorrencias.items.length ? ocorrencias.items.map((item) => <article key={item.id}><strong>{formatDate(item.chamada.data)} · {shiftLabel(item.chamada.turno)}</strong><span>{item.observacao}</span><small>Fiscal: {item.fiscal.nome} · {formatDate(item.createdAt)}</small></article>) : <p className="empty-inline">Nenhuma ocorrência registrada.</p>}<Pager data={ocorrencias} onPage={(page) => loadOcorrencias(page).catch(() => setError('Falha ao carregar ocorrências.'))} /></section>
    </div>}
    <footer className="modal-actions"><button className="button button-secondary" onClick={onClose}>Fechar</button></footer>
  </Modal>;
}
