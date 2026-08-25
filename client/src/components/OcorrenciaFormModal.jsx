import { useState } from 'react';
import Modal from './Modal';
import { ocorrenciaService } from '../services/ocorrencia.service';

export default function OcorrenciaFormModal({ chamada, aluno, ocorrencia, onClose, onSaved }) {
  const [observacao, setObservacao] = useState(ocorrencia?.observacao || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const call = ocorrencia?.chamada || chamada;
  const student = ocorrencia?.aluno || aluno;
  const fiscal = ocorrencia?.fiscal || chamada?.fiscal;
  async function submit(event) {
    event.preventDefault();
    if (observacao.trim().length < 3) return setError('A observação é obrigatória.');
    setSaving(true); setError('');
    try {
      const saved = ocorrencia ? await ocorrenciaService.update(ocorrencia.id, observacao.trim()) : await ocorrenciaService.createForCall(chamada.id, { alunoId: aluno.id, observacao: observacao.trim() });
      onSaved(saved);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível salvar a ocorrência.'); }
    finally { setSaving(false); }
  }
  return <Modal title={ocorrencia ? 'Editar ocorrência' : 'Adicionar ocorrência'} onClose={onClose}><div className="occurrence-context"><div><span>Aluno</span><strong>{student.nomeCompleto}</strong></div><div><span>Fiscal</span><strong>{fiscal.nome}</strong></div><div><span>Data</span><strong>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(call.data))}</strong></div></div><form className="modal-form" onSubmit={submit}><label htmlFor="occurrence-note">Observação</label><textarea id="occurrence-note" rows="6" maxLength="5000" required value={observacao} onChange={(event) => setObservacao(event.target.value)} />{error && <div className="form-error" role="alert">{error}</div>}<footer><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar ocorrência'}</button></footer></form></Modal>;
}
