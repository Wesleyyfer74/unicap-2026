import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function AlunoFormModal({ aluno, saving, onSave, onClose }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setNomeCompleto(aluno?.nomeCompleto || ''); }, [aluno]);
  function submit(event) {
    event.preventDefault();
    const value = nomeCompleto.trim();
    if (value.length < 2) return setError('Informe um nome com ao menos 2 caracteres.');
    setError(''); return onSave({ nomeCompleto: value });
  }
  return <Modal title={aluno ? 'Editar aluno' : 'Novo aluno'} onClose={onClose}><form className="modal-form" onSubmit={submit}><label htmlFor="student-name">Nome completo</label><input id="student-name" autoFocus maxLength="191" value={nomeCompleto} onChange={(event) => setNomeCompleto(event.target.value)} required />{aluno && <p className="field-help">O UUID não pode ser alterado.</p>}{error && <div className="form-error" role="alert">{error}</div>}<footer><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></footer></form></Modal>;
}
