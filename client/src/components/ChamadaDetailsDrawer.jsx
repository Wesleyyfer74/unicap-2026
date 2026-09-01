import { useEffect, useRef, useState } from 'react';
import { chamadaService } from '../services/chamada.service';
import { ocorrenciaService } from '../services/ocorrencia.service';
import { TRANSPORT_SHIFT_LABELS } from '../utils/transportShifts';

const labels = { ...TRANSPORT_SHIFT_LABELS, ABERTA: 'Aberta', FINALIZADA: 'Finalizada' };
const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value)) : 'Não informado';
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Não informado';
const formatTime = (value) => value ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Não informado';
const formatOdometer = (start, end) => start == null && end == null ? 'Não informado' : `${start ?? '—'} km → ${end ?? '—'} km`;

export default function ChamadaDetailsDrawer({ chamada, initialPresences, initialOccurrences, loading, error, onClose }) {
  const closeButtonRef = useRef(null);
  const [search, setSearch] = useState('');
  const [presenceState, setPresenceState] = useState({ items: [], pagination: null, loading: false, error: '' });
  const [occurrenceState, setOccurrenceState] = useState({ items: [], pagination: null, loading: false, error: '' });
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!chamada?.id) return undefined;
    if (!search && initialPresences) {
      setPresenceState({ ...initialPresences, loading: false, error: '' });
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setPresenceState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const data = await chamadaService.listPresences(chamada.id, { page: 1, limit: 20, ...(search.trim() && { search: search.trim() }) });
        if (active) setPresenceState({ items: data.items, pagination: data.pagination, loading: false, error: '' });
      } catch (requestError) {
        if (active) setPresenceState({ items: [], pagination: null, loading: false, error: requestError.response?.data?.message || 'Não foi possível carregar os alunos presentes.' });
      }
    }, search ? 300 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [chamada?.id, search, initialPresences]);

  useEffect(() => {
    if (!chamada?.id) return undefined;
    if (initialOccurrences) {
      setOccurrenceState({ ...initialOccurrences, loading: false, error: '' });
      return undefined;
    }
    let active = true;
    setOccurrenceState((current) => ({ ...current, loading: true, error: '' }));
    ocorrenciaService.list({ chamadaId: chamada.id, page: 1, limit: 10 })
      .then((data) => { if (active) setOccurrenceState({ items: data.items, pagination: data.pagination, loading: false, error: '' }); })
      .catch((requestError) => { if (active) setOccurrenceState({ items: [], pagination: null, loading: false, error: requestError.response?.data?.message || 'Não foi possível carregar as ocorrências.' }); });
    return () => { active = false; };
  }, [chamada?.id, initialOccurrences]);

  async function loadMore() {
    if (!chamada || !presenceState.pagination || presenceState.loading) return;
    const nextPage = presenceState.pagination.page + 1;
    setPresenceState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await chamadaService.listPresences(chamada.id, { page: nextPage, limit: 20, ...(search.trim() && { search: search.trim() }) });
      setPresenceState((current) => ({ items: [...current.items, ...data.items], pagination: data.pagination, loading: false, error: '' }));
    } catch (requestError) {
      setPresenceState((current) => ({ ...current, loading: false, error: requestError.response?.data?.message || 'Não foi possível carregar mais alunos.' }));
    }
  }

  async function loadMoreOccurrences() {
    if (!chamada || !occurrenceState.pagination || occurrenceState.loading) return;
    setOccurrenceState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await ocorrenciaService.list({ chamadaId: chamada.id, page: occurrenceState.pagination.page + 1, limit: 10 });
      setOccurrenceState((current) => ({ items: [...current.items, ...data.items], pagination: data.pagination, loading: false, error: '' }));
    } catch (requestError) {
      setOccurrenceState((current) => ({ ...current, loading: false, error: requestError.response?.data?.message || 'Não foi possível carregar mais ocorrências.' }));
    }
  }

  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="call-drawer" role="dialog" aria-modal="true" aria-labelledby="call-drawer-title" aria-busy={loading}>
      <header><div><span>Detalhes operacionais</span><h2 id="call-drawer-title">Chamada {chamada ? `#${chamada.id}` : ''}</h2></div><button ref={closeButtonRef} type="button" className="icon-button" aria-label="Fechar detalhes" onClick={onClose}>×</button></header>
      {loading && <div className="drawer-skeleton" role="status" aria-label="Carregando detalhes da chamada"><div className="drawer-skeleton-title" /><div className="drawer-skeleton-grid">{Array.from({ length: 8 }, (_, index) => <div key={index}><span /><strong /></div>)}</div><div className="drawer-skeleton-section" /><div className="drawer-skeleton-row" /><div className="drawer-skeleton-row" /><span className="sr-only">Carregando detalhes...</span></div>}
      {error && <div className="feedback error" role="alert">{error}</div>}
      {chamada && <div className="drawer-content"><section className="drawer-detail-grid" aria-label="Informações da chamada">
        <div><span>Data</span><strong>{formatDate(chamada.data)}</strong></div>
        <div><span>Fiscal</span><strong>{chamada.fiscal.nome}</strong></div>
        <div><span>Linha / Turno</span><strong>{labels[chamada.turno]}</strong></div>
        <div><span>Cor do ônibus</span><strong>{chamada.corOnibus}</strong></div>
        <div><span>Motorista</span><strong>{chamada.viagem?.nomeMotorista || 'Não informado'}</strong></div>
        <div><span>Status</span><strong className={`status ${chamada.status === 'ABERTA' ? 'active' : 'inactive'}`}>{labels[chamada.status]}</strong></div>
        <div><span>Horário de início</span><strong>{formatDateTime(chamada.startedAt)}</strong></div>
        <div><span>Horário de finalização</span><strong>{formatDateTime(chamada.finishedAt)}</strong></div>
        <div><span>Rota</span><strong>{chamada.viagem?.linhaRota || 'Não informada'}</strong></div>
        <div><span>Horário da viagem</span><strong>{formatTime(chamada.viagem?.horarioSaida)} → {formatTime(chamada.viagem?.horarioChegada)}</strong></div>
        <div><span>Hodômetro</span><strong>{formatOdometer(chamada.viagem?.hodometroSaida, chamada.viagem?.hodometroChegada)}</strong></div>
        <div><span>Quantidade de alunos</span><strong>{chamada._count.presencas} {chamada._count.presencas === 1 ? 'aluno' : 'alunos'}</strong></div>
        <div><span>Quantidade de ocorrências</span><strong>{chamada._count.ocorrencias} {chamada._count.ocorrencias === 1 ? 'ocorrência' : 'ocorrências'}</strong></div>
      </section>
        <section className="drawer-presences" aria-labelledby="drawer-presences-title">
          <header><div><h3 id="drawer-presences-title">Alunos presentes — {chamada._count.presencas}</h3>{search && presenceState.pagination && <span>{presenceState.pagination.total} encontrado(s)</span>}</div></header>
          <label className="drawer-presence-search"><span>Buscar por nome</span><input type="search" value={search} maxLength="191" placeholder="Digite o nome do aluno" onChange={(event) => setSearch(event.target.value)} /></label>
          {presenceState.error && <div className="feedback error" role="alert">{presenceState.error}</div>}
          {!presenceState.loading && presenceState.items.length === 0 && <p className="empty-inline">{search ? 'Nenhum aluno encontrado para esta busca.' : 'Nenhum aluno registrado nesta chamada.'}</p>}
          <ol className="drawer-presence-list">
            {presenceState.items.map((presence) => <li key={presence.id}><strong>{presence.aluno.nomeCompleto}</strong><time dateTime={presence.registradoEm}>{formatTime(presence.registradoEm)}</time></li>)}
          </ol>
          {presenceState.loading && <p className="drawer-presence-loading" role="status">Carregando alunos...</p>}
          {presenceState.pagination?.page < presenceState.pagination?.totalPages && <button type="button" className="button button-secondary drawer-load-more" disabled={presenceState.loading} onClick={loadMore}>Carregar mais alunos</button>}
        </section>
        <section className="drawer-occurrences" aria-labelledby="drawer-occurrences-title">
          <header><h3 id="drawer-occurrences-title">Ocorrências — {chamada._count.ocorrencias}</h3></header>
          {occurrenceState.error && <div className="feedback error" role="alert">{occurrenceState.error}</div>}
          {!occurrenceState.loading && occurrenceState.items.length === 0 && <p className="empty-inline">Nenhuma ocorrência registrada nesta chamada.</p>}
          <div className="drawer-occurrence-list">
            {occurrenceState.items.map((occurrence) => <article key={occurrence.id}>
              <header><div><strong>{occurrence.aluno.nomeCompleto}</strong><span>Fiscal: {occurrence.fiscal.nome}</span></div><time dateTime={occurrence.createdAt}>{formatDateTime(occurrence.createdAt)}</time></header>
              <p>“{occurrence.observacao}”</p>
            </article>)}
          </div>
          {occurrenceState.loading && <p className="drawer-presence-loading" role="status">Carregando ocorrências...</p>}
          {occurrenceState.pagination?.page < occurrenceState.pagination?.totalPages && <button type="button" className="button button-secondary drawer-load-more" disabled={occurrenceState.loading} onClick={loadMoreOccurrences}>Carregar mais ocorrências</button>}
        </section>
      </div>}
    </aside>
  </div>;
}
