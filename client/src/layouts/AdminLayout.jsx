import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccountSettingsModal from '../components/AccountSettingsModal';

export default function AdminLayout() {
  const { administrador, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return <div className="app-shell">
    <header className="admin-header">
      <strong className="admin-brand"><img src="/logo.png" alt="UNICAP" /><span>Sistema de Transporte</span></strong>
      <nav><NavLink to="/admin" end>Dashboard</NavLink><NavLink to="/admin/fiscais">Fiscais</NavLink><NavLink to="/admin/alunos">Alunos</NavLink><NavLink to="/admin/chamadas">Chamadas</NavLink><NavLink to="/admin/ocorrencias">Ocorrências</NavLink><NavLink to="/admin/historico">Histórico</NavLink><NavLink to="/admin/relatorios">Relatórios</NavLink></nav>
      <div className="admin-account">
        <span>{administrador.nome}</span>
        <button type="button" className="settings-button" aria-label="Abrir configurações da conta" title="Configurações" onClick={() => setSettingsOpen(true)}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 0 0 .05-1 7.6 7.6 0 0 0-.05-1l2.1-1.65-2-3.46-2.55 1.03a8 8 0 0 0-1.72-1L14.85 3h-4l-.38 2.92a8 8 0 0 0-1.72 1L6.2 5.89l-2 3.46L6.3 11a7.6 7.6 0 0 0-.05 1 7.6 7.6 0 0 0 .05 1L4.2 14.65l2 3.46 2.55-1.03a8 8 0 0 0 1.72 1l.38 2.92h4l.38-2.92a8 8 0 0 0 1.72-1l2.55 1.03 2-3.46L19.4 13ZM12.85 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg></button>
        <button type="button" className="button button-secondary" onClick={logout}>Sair</button>
      </div>
    </header>
    <Outlet />
    {settingsOpen && <AccountSettingsModal onClose={() => setSettingsOpen(false)} />}
  </div>;
}
