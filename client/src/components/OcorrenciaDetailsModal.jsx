import Modal from './Modal';
import { TRANSPORT_SHIFT_LABELS } from '../utils/transportShifts';

export default function OcorrenciaDetailsModal({ ocorrencia, onClose, onEdit }) {
  const shift = TRANSPORT_SHIFT_LABELS[ocorrencia.chamada.turno] || ocorrencia.chamada.turno;
  return <Modal title="Detalhes da ocorrência" onClose={onClose}>
    <div className="occurrence-details">
      <div><span>Aluno</span><strong>{ocorrencia.aluno.nomeCompleto}</strong></div>
      <div><span>Fiscal</span><strong>{ocorrencia.fiscal.nome}</strong></div>
      <div><span>Chamada</span><strong>#{ocorrencia.chamada.id} · {shift}</strong></div>
      <div><span>Data da chamada</span><strong>{new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(ocorrencia.chamada.data))}</strong></div>
      <div><span>Registrada em</span><strong>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ocorrencia.createdAt))}</strong></div>
      <div className="full"><span>Observação</span><p>{ocorrencia.observacao}</p></div>
    </div>
    <footer className="modal-actions"><button className="button button-secondary" onClick={onClose}>Fechar</button>{onEdit && <button className="button button-primary" onClick={onEdit}>Editar</button>}</footer>
  </Modal>;
}
