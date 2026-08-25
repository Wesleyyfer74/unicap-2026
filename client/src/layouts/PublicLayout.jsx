import { Outlet } from 'react-router-dom';
export default function PublicLayout() { return <div className="app-shell"><header className="app-header">Sistema de Transporte</header><main className="app-content"><Outlet /></main></div>; }
