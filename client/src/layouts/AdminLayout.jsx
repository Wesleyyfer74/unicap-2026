import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccountSettingsModal from '../components/AccountSettingsModal';
import SystemHelpModal from '../components/SystemHelpModal';

export default function AdminLayout() {
  const { administrador, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const isAdmin = administrador.role === 'ADMIN';

  function handleLogout() {
    const loginPath = isAdmin ? '/admin/login' : '/fiscal/login';
    logout();
    navigate(loginPath, { replace: true });
  }

  return <div className="app-shell">
    <header className="admin-header">
      <strong className="admin-brand"><img src="/logo.png" alt="UNICAP" /><span>Sistema de Transporte</span></strong>
      <nav>
        {isAdmin && <NavLink to="/admin" end>Dashboard</NavLink>}
        {isAdmin && <NavLink to="/admin/fiscais">Fiscais</NavLink>}
        <NavLink to="/admin/alunos">Alunos</NavLink>
        <NavLink to="/admin/chamadas">Chamadas</NavLink>
        <NavLink to="/admin/ocorrencias">Ocorrências</NavLink>
        {isAdmin && <NavLink to="/admin/historico">Histórico</NavLink>}
        {isAdmin && <NavLink to="/admin/relatorios">Relatórios</NavLink>}
      </nav>
      <div className="admin-account">
        <span>{administrador.nome}</span>
        <button type="button" className="settings-button header-help-button" aria-label="Abrir manual de uso" title="Manual de uso" onClick={() => setHelpOpen(true)}>?</button>
        {isAdmin && <button type="button" className="settings-button" aria-label="Abrir configurações da conta" title="Configurações" onClick={() => setSettingsOpen(true)}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 0 0 .05-1 7.6 7.6 0 0 0-.05-1l2.1-1.65-2-3.46-2.55 1.03a8 8 0 0 0-1.72-1L14.85 3h-4l-.38 2.92a8 8 0 0 0-1.72 1L6.2 5.89l-2 3.46L6.3 11a7.6 7.6 0 0 0-.05 1 7.6 7.6 0 0 0 .05 1L4.2 14.65l2 3.46 2.55-1.03a8 8 0 0 0 1.72 1l.38 2.92h4l.38-2.92a8 8 0 0 0 1.72-1l2.55 1.03 2-3.46L19.4 13ZM12.85 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg></button>}
        <button type="button" className="button button-secondary" onClick={handleLogout}>Sair</button>
      </div>
    </header>
    <Outlet />
    {isAdmin && settingsOpen && <AccountSettingsModal onClose={() => setSettingsOpen(false)} />}
    {helpOpen && <SystemHelpModal onClose={() => setHelpOpen(false)} />}
  </div>;
}
