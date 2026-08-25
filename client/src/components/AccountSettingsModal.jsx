import { useState } from 'react';
import Modal from './Modal';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

function errorMessage(error) {
  return error.response?.data?.message || 'Não foi possível salvar as alterações.';
}

export default function AccountSettingsModal({ onClose }) {
  const { administrador, updateAdministrador, logout } = useAuth();
  const [email, setEmail] = useState(administrador.email);
  const [emailPassword, setEmailPassword] = useState('');
  const [emailState, setEmailState] = useState({ loading: false, error: '', success: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordState, setPasswordState] = useState({ loading: false, error: '', success: '' });

  async function saveEmail(event) {
    event.preventDefault();
    setEmailState({ loading: true, error: '', success: '' });
    try {
      const result = await authService.updateProfile({ email, currentPassword: emailPassword });
      updateAdministrador(result.administrador);
      setEmailPassword('');
      setEmailState({ loading: false, error: '', success: result.message });
    } catch (error) {
      setEmailState({ loading: false, error: errorMessage(error), success: '' });
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordState({ loading: true, error: '', success: '' });
    try {
      await authService.changePassword(passwords);
      setPasswordState({ loading: false, error: '', success: 'Senha alterada. Faça login novamente.' });
      window.setTimeout(logout, 1200);
    } catch (error) {
      setPasswordState({ loading: false, error: errorMessage(error), success: '' });
    }
  }

  return <Modal title="Configurações da conta" onClose={onClose}>
    <div className="account-settings">
      <form className="modal-form account-settings-section" onSubmit={saveEmail}>
        <h3>Email de acesso</h3>
        <p>Este email será utilizado no próximo login administrativo.</p>
        <label htmlFor="settings-email">Email</label>
        <input id="settings-email" type="email" autoComplete="email" required maxLength="191" value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="settings-email-password">Senha atual</label>
        <input id="settings-email-password" type="password" autoComplete="current-password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} />
        {emailState.error && <div className="form-error" role="alert">{emailState.error}</div>}
        {emailState.success && <div className="form-success" role="status">{emailState.success}</div>}
        <button className="button button-primary" disabled={emailState.loading}>{emailState.loading ? 'Salvando...' : 'Atualizar email'}</button>
      </form>

      <form className="modal-form account-settings-section" onSubmit={savePassword}>
        <h3>Alterar senha</h3>
        <label htmlFor="settings-current-password">Senha atual</label>
        <input id="settings-current-password" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} />
        <label htmlFor="settings-new-password">Nova senha</label>
        <input id="settings-new-password" type="password" autoComplete="new-password" minLength="8" required value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} />
        <label htmlFor="settings-confirm-password">Confirmar nova senha</label>
        <input id="settings-confirm-password" type="password" autoComplete="new-password" minLength="8" required value={passwords.confirmPassword} onChange={(event) => setPasswords((value) => ({ ...value, confirmPassword: event.target.value }))} />
        {passwordState.error && <div className="form-error" role="alert">{passwordState.error}</div>}
        {passwordState.success && <div className="form-success" role="status">{passwordState.success}</div>}
        <button className="button button-primary" disabled={passwordState.loading}>{passwordState.loading ? 'Alterando...' : 'Alterar senha'}</button>
      </form>
    </div>
  </Modal>;
}
