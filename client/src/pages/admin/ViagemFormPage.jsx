import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { chamadaService } from '../../services/chamada.service';
import { fiscalService } from '../../services/fiscal.service';
import { TRANSPORT_LINES } from '../../utils/transportLines';

const emptyForm = { nomeMotorista: '', fiscalId: '', linhaRota: '', turno: '', horarioSaida: '', horarioChegada: '', hodometroSaida: '', hodometroChegada: '' };

export default function ViagemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chamada, setChamada] = useState(null);
  const [fiscais, setFiscais] = useState([]);
  const [viagem, setViagem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([chamadaService.get(id), fiscalService.list({ page: 1, limit: 100 }), chamadaService.getTrip(id)])
      .then(([call, fiscalData, existingTrip]) => {
        setChamada(call);
        setFiscais(fiscalData.items);
        setViagem(existingTrip);
        const time = (value) => value ? new Date(value).toISOString().slice(11, 16) : '';
        setForm(existingTrip ? {
          nomeMotorista: existingTrip.nomeMotorista,
          fiscalId: String(existingTrip.fiscalId),
          linhaRota: existingTrip.linhaRota || '',
          turno: existingTrip.turno || '',
          horarioSaida: time(existingTrip.horarioSaida),
          horarioChegada: time(existingTrip.horarioChegada),
          hodometroSaida: existingTrip.hodometroSaida ?? '',
          hodometroChegada: existingTrip.hodometroChegada ?? '',
        } : { ...emptyForm, fiscalId: String(call.fiscalId), turno: call.turno });
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Não foi possível carregar o formulário.'));
  }, [id]);

  function set(field, value) { setForm((old) => ({ ...old, [field]: value })); }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.hodometroSaida !== '' && form.hodometroChegada !== '' && Number(form.hodometroChegada) < Number(form.hodometroSaida)) return setError('Hodômetro de chegada não pode ser menor que o de saída.');
    if (form.horarioSaida && form.horarioChegada && form.horarioChegada < form.horarioSaida) return setError('Horário de chegada não pode ser anterior ao de saída.');
    setSaving(true);
    try {
      const payload = { ...form, fiscalId: Number(form.fiscalId) };
      await (viagem ? chamadaService.updateTrip(id, payload) : chamadaService.createTrip(id, payload));
      navigate(`/admin/chamadas/${id}`, { replace: true, state: { message: 'Formulário do motorista salvo com sucesso.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar o formulário.');
    } finally { setSaving(false); }
  }

  if (!chamada && !error) return <main className="centered-page"><p>Carregando...</p></main>;
  return <main className="app-content">
    <div className="page-heading"><div><Link className="back-link" to={`/admin/chamadas/${id}`}>← Detalhes da chamada</Link><h1>{viagem ? 'Editar viagem' : 'Formulário do motorista'}</h1><p>{viagem ? 'Atualize os dados operacionais da viagem.' : 'A viagem somente será registrada ao salvar este formulário.'}</p></div></div>
    {error && <div className="feedback error">{error}</div>}
    <form className="card trip-form" onSubmit={submit}>
      <label><span>Nome do Motorista *</span><input value={form.nomeMotorista} maxLength="191" required onChange={(event) => set('nomeMotorista', event.target.value)} /></label>
      <label><span>Fiscal *</span><select value={form.fiscalId} required onChange={(event) => set('fiscalId', event.target.value)}>{fiscais.map((fiscal) => <option key={fiscal.id} value={fiscal.id}>{fiscal.nome}</option>)}</select></label>
      <label><span>Linha / Rota</span><select value={form.linhaRota} onChange={(event) => set('linhaRota', event.target.value)}><option value="">Não informado</option>{TRANSPORT_LINES.map((line) => <option key={line} value={line}>{line}</option>)}</select></label>
      <label><span>Turno</span><select value={form.turno} onChange={(event) => set('turno', event.target.value)}><option value="">Não informado</option><option value="MATUTINO">Matutino</option><option value="INTEGRAL">Integral</option><option value="NOTURNO">Noturno</option></select></label>
      <label><span>Horário de Saída</span><input type="time" value={form.horarioSaida} onChange={(event) => set('horarioSaida', event.target.value)} /></label>
      <label><span>Horário de Chegada</span><input type="time" value={form.horarioChegada} onChange={(event) => set('horarioChegada', event.target.value)} /></label>
      <label><span>Hodômetro de Saída</span><input type="number" min="0" step="0.1" value={form.hodometroSaida} onChange={(event) => set('hodometroSaida', event.target.value)} /></label>
      <label><span>Hodômetro de Chegada</span><input type="number" min="0" step="0.1" value={form.hodometroChegada} onChange={(event) => set('hodometroChegada', event.target.value)} /></label>
      <footer><Link className="button button-secondary link-button" to={`/admin/chamadas/${id}`}>Cancelar</Link><button className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : viagem ? 'Atualizar formulário' : 'Salvar formulário'}</button></footer>
    </form>
  </main>;
}
