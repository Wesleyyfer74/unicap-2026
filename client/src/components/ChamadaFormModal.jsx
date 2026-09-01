import { useEffect, useState } from 'react';
import Modal from './Modal';
import { fiscalService } from '../services/fiscal.service';
import { BUS_COLORS } from '../utils/busColors';
import { useAuth } from '../hooks/useAuth';
import { TRANSPORT_SHIFTS } from '../utils/transportShifts';

export default function ChamadaFormModal({ saving, onSave, onClose }) {
  const { administrador } = useAuth();
  const [fiscais, setFiscais] = useState([]);
  const [form, setForm] = useState({ fiscalId: '', turno: TRANSPORT_SHIFTS[0].value, corOnibus: 'Azul' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (administrador.role === 'FISCAL') {
      setFiscais([{ id: administrador.fiscalId, nome: administrador.nome }]);
      setForm((current) => ({ ...current, fiscalId: String(administrador.fiscalId) }));
      return;
    }
    fiscalService.list({ page: 1, limit: 100, ativo: true })
      .then((data) => setFiscais(data.items))
      .catch(() => setError('Não foi possível carregar os fiscais ativos.'));
  }, [administrador]);

  function submit(event) {
    event.preventDefault();
    if (!form.fiscalId) return setError('Selecione o fiscal responsável.');
    setError('');
    return onSave({ fiscalId: Number(form.fiscalId), turno: form.turno, corOnibus: form.corOnibus });
  }

  return <Modal title="Nova Chamada" onClose={onClose}><form className="modal-form" onSubmit={submit}>
    <label htmlFor="call-fiscal">Fiscal responsável</label>
    <select id="call-fiscal" value={form.fiscalId} disabled={administrador.role === 'FISCAL'} onChange={(event) => setForm({ ...form, fiscalId: event.target.value })} required><option value="">Selecione</option>{fiscais.map((fiscal) => <option key={fiscal.id} value={fiscal.id}>{fiscal.nome}</option>)}</select>
    <label htmlFor="call-shift">Linha / Turno</label><select id="call-shift" value={form.turno} onChange={(event) => setForm({ ...form, turno: event.target.value })}>{TRANSPORT_SHIFTS.map((shift) => <option key={shift.value} value={shift.value}>{shift.label}</option>)}</select>
    <label htmlFor="call-bus-color">Cor do ônibus</label><select id="call-bus-color" value={form.corOnibus} onChange={(event) => setForm({ ...form, corOnibus: event.target.value })} required>{BUS_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}</select>
    <p className="field-help">A data e o horário de início serão definidos pelo servidor.</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    <footer><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Iniciando...' : 'Iniciar chamada'}</button></footer>
  </form></Modal>;
}
