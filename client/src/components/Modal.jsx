import { useEffect } from 'react';

export default function Modal({ title, children, onClose }) {
  useEffect(() => {
    function handleEscape(event) { if (event.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}>×</button></header>{children}</section></div>;
}
