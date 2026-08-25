import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboard.service';

const labels = { MATUTINO: 'Matutino', INTEGRAL: 'Integral', NOTURNO: 'Noturno', ABERTA: 'Aberta', FINALIZADA: 'Finalizada' };
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));

export default function DashboardPage() {
  const { administrador } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { dashboardService.getSummary().then(setData).catch((requestError) => setError(requestError.response?.data?.message || 'Não foi possível carregar o dashboard.')); }, []);

  if (error) return <main className="app-content"><div className="feedback error">{error}</div></main>;
  if (!data) return <main className="app-content"><div className="dashboard-loading"><div /><div /><div /><div /><div /></div></main>;

  const cards = [
    { label: 'Alunos cadastrados', value: data.metrics.alunos, link: '/admin/alunos', tone: 'blue' },
    { label: 'Fiscais ativos', value: data.metrics.fiscaisAtivos, link: '/admin/fiscais', tone: 'green' },
    { label: 'Chamadas hoje', value: data.metrics.chamadasHoje, link: '/admin/chamadas', tone: 'purple' },
    { label: 'Presenças hoje', value: data.metrics.presencasHoje, link: '/admin/chamadas', tone: 'orange' },
    { label: 'Ocorrências recentes', value: data.metrics.ocorrenciasRecentes, link: '/admin/ocorrencias', tone: 'red', note: `Últimos ${data.period.ocorrenciasRecentesDias} dias` },
  ];

  return <main className="app-content dashboard"><div className="dashboard-heading"><div><span>Visão geral</span><h1>Olá, {administrador.nome}</h1><p>Acompanhe rapidamente a operação do transporte.</p></div><Link className="button button-primary link-button" to="/admin/chamadas">Ver chamadas</Link></div><section className="metric-grid" aria-label="Indicadores">{cards.map((card) => <Link key={card.label} to={card.link} className={`metric-card ${card.tone}`}><span>{card.label}</span><strong>{card.value}</strong>{card.note && <small>{card.note}</small>}</Link>)}</section><div className="dashboard-columns"><section className="dashboard-section"><header><div><h2>Últimas chamadas</h2><p>As cinco chamadas mais recentes</p></div><Link to="/admin/chamadas">Ver todas</Link></header><div className="table-wrapper"><table><thead><tr><th>Data</th><th>Fiscal</th><th>Turno</th><th>Alunos</th><th>Status</th></tr></thead><tbody>{data.ultimasChamadas.length === 0 ? <tr><td colSpan="5" className="empty-state">Nenhuma chamada registrada.</td></tr> : data.ultimasChamadas.map((call) => <tr key={call.id}><td data-label="Data">{formatDate(call.data)}</td><td data-label="Fiscal">{call.fiscal.nome}</td><td data-label="Turno">{labels[call.turno]}</td><td data-label="Alunos">{call._count.presencas}</td><td data-label="Status"><span className={`status ${call.status === 'ABERTA' ? 'active' : 'inactive'}`}>{labels[call.status]}</span></td></tr>)}</tbody></table></div></section><section className="dashboard-section recent-occurrences"><header><div><h2>Ocorrências recentes</h2><p>Últimos registros operacionais</p></div><Link to="/admin/ocorrencias">Ver todas</Link></header>{data.ultimasOcorrencias.length === 0 ? <p className="empty-state">Nenhuma ocorrência registrada.</p> : <ul>{data.ultimasOcorrencias.map((occurrence) => <li key={occurrence.id}><div><strong>{occurrence.aluno.nomeCompleto}</strong><span>Chamada #{occurrence.chamada.id} · {occurrence.fiscal.nome}</span></div><p>{occurrence.observacao}</p><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(occurrence.createdAt))}</time></li>)}</ul>}</section></div></main>;
}
