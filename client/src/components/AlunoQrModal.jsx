import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';
import { createUnicapQrImage } from '../utils/brandedQr';

export default function AlunoQrModal({ aluno, onClose }) {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { QRCode.toDataURL(aluno.uuid, { width: 560, margin: 2, errorCorrectionLevel: 'M' }).then((qr) => createUnicapQrImage(qr, aluno.nomeCompleto)).then(setImage).catch(() => setError('Não foi possível gerar o QR Code.')); }, [aluno.uuid, aluno.nomeCompleto]);
  function download() { const link = document.createElement('a'); link.href = image; link.download = `qr-${aluno.nomeCompleto.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`; link.click(); }
  return <Modal title="QR Code do aluno" onClose={onClose}><div className="qr-content"><strong>{aluno.nomeCompleto}</strong><code>{aluno.uuid}</code>{error ? <div className="form-error">{error}</div> : image ? <img src={image} alt={`QR Code de ${aluno.nomeCompleto}`} /> : <p>Gerando QR Code...</p>}<p className="field-help">O QR Code contém somente o identificador UUID.</p><button className="button button-primary" disabled={!image} onClick={download}>Baixar QR Code</button></div></Modal>;
}
