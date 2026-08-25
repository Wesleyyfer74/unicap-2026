import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function FiscalFormModal({ fiscal, saving, onSave, onClose }) {
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setNome(fiscal?.nome || ''); }, [fiscal]);

  function submit(event) {
    event.preventDefault();
    const value = nome.trim();
    if (value.length < 2) return setError('Informe um nome com ao menos 2 caracteres.');
    setError('');
    return onSave({ nome: value });
  }

  return <Modal title={fiscal ? 'Editar fiscal' : 'Novo fiscal'} onClose={onClose}><form className="modal-form" onSubmit={submit}><label htmlFor="fiscal-name">Nome</label><input id="fiscal-name" autoFocus maxLength="191" value={nome} onChange={(event) => setNome(event.target.value)} required />{error && <div className="form-error" role="alert">{error}</div>}<footer><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></footer></form></Modal>;
}
