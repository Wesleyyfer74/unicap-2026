import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { authenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { document.title = 'Login administrativo | Sistema de Transporte'; }, []);
  if (!loading && authenticated) return <Navigate to="/admin" replace />;
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login({ ...form, type: 'ADMIN' }); navigate(location.state?.from?.pathname || '/admin', { replace: true }); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível conectar à API. Tente novamente.'); }
    finally { setSubmitting(false); }
  }
  return <main className="login-page"><section className="login-card" aria-labelledby="login-title">
    <div className="login-brand"><img src="/logo.png" alt="UNICAP" /></div><h1 id="login-title">Acesso administrativo</h1><p>Entre com as credenciais de administrador.</p>
    <form onSubmit={handleSubmit}><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><label htmlFor="password">Senha</label><input id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary" disabled={submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button></form>
    <Link className="login-alternate-link" to="/fiscal/login">Acesso exclusivo para fiscais</Link>
  </section></main>;
}
