import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ChamadaPresencasModal from '../../components/ChamadaPresencasModal';
import { TRANSPORT_SHIFT_LABELS } from '../../utils/transportShifts';
import { chamadaService } from '../../services/chamada.service';

const labels = { ...TRANSPORT_SHIFT_LABELS, ABERTA: 'Aberta', FINALIZADA: 'Finalizada' };
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function ChamadaDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [chamada, setChamada] = useState(null);
  const [showPresences, setShowPresences] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { chamadaService.get(id).then(setChamada).catch((requestError) => setError(requestError.response?.data?.message || 'Não foi possível carregar a chamada.')); }, [id]);
  if (error) return <main className="app-content"><div className="feedback error">{error}</div></main>;
  if (!chamada) return <main className="centered-page"><p>Carregando...</p></main>;

  return <main className="app-content"><div className="page-heading"><div><Link className="back-link" to="/admin/chamadas">← Chamadas</Link><h1>Detalhes da chamada #{chamada.id}</h1></div>{chamada.status === 'ABERTA' && <Link className="button button-primary link-button" to={`/admin/chamadas/${id}/scanner`}>Abrir scanner</Link>}</div>{location.state?.message && <div className="feedback success">{location.state.message}</div>}<section className="card detail-grid"><div><span>Data</span><strong>{formatDate(chamada.data)}</strong></div><div><span>Fiscal</span><strong>{chamada.fiscal.nome}</strong></div><div><span>Turno</span><strong>{labels[chamada.turno]}</strong></div><div><span>Cor do ônibus</span><strong>{chamada.corOnibus}</strong></div><div><span>Status</span><strong>{labels[chamada.status]}</strong></div><div><span>Início</span><strong>{formatDateTime(chamada.startedAt)}</strong></div><div><span>Finalização</span><strong>{formatDateTime(chamada.finishedAt)}</strong></div><div><span>Presenças</span><strong>{chamada._count.presencas}</strong></div><div><span>Motorista</span><strong>{chamada.viagem?.nomeMotorista || 'Não informado'}</strong></div></section><div className="detail-actions"><button className="button button-secondary" onClick={() => setShowPresences(true)}>Ver alunos presentes</button>{chamada.status === 'FINALIZADA' && <Link className="button button-primary link-button" to={`/admin/chamadas/${id}/viagem`}>{chamada.viagem ? 'Editar formulário da viagem' : 'Preencher formulário do motorista'}</Link>}</div>{showPresences && <ChamadaPresencasModal chamada={chamada} onClose={() => setShowPresences(false)} onRemoved={() => {}} />}</main>;
}
