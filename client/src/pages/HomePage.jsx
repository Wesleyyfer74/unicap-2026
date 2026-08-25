import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { publicAlunoService } from '../services/public-aluno.service.js';
import { createUnicapQrImage } from '../utils/brandedQr.js';

const STORAGE_KEY = 'unicap_aluno_cadastrado_v3';
const LEGACY_STORAGE_KEYS = ['unicap_aluno_cadastrado', 'unicap_aluno_cadastrado_v2'];

function readRegistration() {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value?.uuid && value?.nomeCompleto ? value : null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [registration, setRegistration] = useState(readRegistration);
  const [step, setStep] = useState(() => registration ? 'complete' : 'welcome');
  const [cpf, setCpf] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!registration?.uuid) return;
    QRCode.toDataURL(registration.uuid, { width: 560, margin: 2, errorCorrectionLevel: 'M' })
      .then((qr) => createUnicapQrImage(qr, registration.nomeCompleto))
      .then(setQrImage)
      .catch(() => setError('Não foi possível gerar o QR Code. Atualize a página e tente novamente.'));
  }, [registration]);

  async function register(event) {
    event.preventDefault();
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setError('Informe um CPF válido.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const student = await publicAlunoService.findByCpf(cpfDigits);
      const saved = { uuid: student.uuid, nomeCompleto: student.nomeCompleto };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setRegistration(saved);
      setStep('complete');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível realizar o cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function changeCpf(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const masked = digits.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
    setCpf(masked);
    setError('');
  }

  function downloadQr() {
    if (!qrImage) return;
    const filename = registration.nomeCompleto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `qrcode-unicap-${filename || 'aluno'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return <section className="public-registration-page" aria-label="Cadastro de alunos UNICAP">
    <div className="public-hero"><span>UNICAP</span><h1>Transporte escolar</h1><p>Cadastro e identificação segura por QR Code.</p></div>
    <div className="registration-backdrop">
      <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
        {step === 'welcome' && <div className="registration-welcome">
          <div className="registration-logo"><img src="/logo.png" alt="Logo da UNICAP" /></div>
          <p className="registration-eyebrow">Bem-vindo</p>
          <h2 id="registration-title">Cadastro de alunos UNICAP</h2>
          <p>Para participar das chamadas, crie seu cadastro e gere seu QR Code individual.</p>
          <button type="button" className="button button-primary registration-main-button" onClick={() => setStep('form')}>Fazer cadastro</button>
        </div>}

        {step === 'form' && <form className="registration-form" onSubmit={register}>
          <p className="registration-eyebrow">Cadastro do aluno</p>
          <h2 id="registration-title">Informe seu CPF</h2>
          <p>Consultaremos seu nome na lista de alunos autorizados para gerar o QR Code.</p>
          <label htmlFor="public-student-cpf">CPF</label>
          <input id="public-student-cpf" type="text" inputMode="numeric" autoFocus autoComplete="off" maxLength="14" required value={cpf} onChange={(event) => changeCpf(event.target.value)} placeholder="000.000.000-00" />
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary registration-main-button" disabled={submitting}>{submitting ? 'Consultando CPF...' : 'Gerar QR Code'}</button>
        </form>}

        {step === 'complete' && <div className="registration-complete">
          <div className="registration-success" aria-hidden="true">✓</div>
          <p className="registration-eyebrow">Cadastro concluído</p>
          <h2 id="registration-title">Bem-vindo, {registration?.nomeCompleto}</h2>
          <strong>Aqui está seu QR Code</strong>
          {error ? <div className="form-error" role="alert">{error}</div> : qrImage ? <img src={qrImage} alt="QR Code individual do aluno" /> : <p>Gerando seu QR Code...</p>}
          <p className="registration-instruction">Salve a imagem do QR Code para usá-lo nas chamadas.</p>
          <button type="button" className="button button-primary registration-main-button" disabled={!qrImage} onClick={downloadQr}>Salvar QR Code na galeria</button>
          <small>Este cadastro ficará salvo neste navegador.</small>
        </div>}
      </section>
    </div>
  </section>;
}
