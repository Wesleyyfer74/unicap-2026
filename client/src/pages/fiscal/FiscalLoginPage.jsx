import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';

export default function FiscalLoginPage() {
  const { authenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fiscalId: '', password: '' });
  const [fiscais, setFiscais] = useState([]);
  const [loadingFiscais, setLoadingFiscais] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    document.title = 'Acesso dos fiscais | Sistema de Transporte';
    authService.listFiscais().then(setFiscais).catch(() => setError('Não foi possível carregar a lista de fiscais.')).finally(() => setLoadingFiscais(false));
  }, []);
  if (!loading && authenticated) return <Navigate to="/admin/chamadas" replace />;
  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login({ ...form, type: 'FISCAL' }); navigate('/admin/chamadas', { replace: true }); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível entrar. Tente novamente.'); }
    finally { setSubmitting(false); }
  }
  return <main className="login-page fiscal-login-page"><section className="login-card" aria-labelledby="fiscal-login-title">
    <div className="login-brand"><img src="/logo.png" alt="UNICAP" /></div><span className="login-profile-label">Área do fiscal</span><h1 id="fiscal-login-title">Acesso dos fiscais</h1><p>Selecione seu nome e informe a senha operacional.</p>
    <form onSubmit={handleSubmit}><label htmlFor="fiscal">Fiscal</label><select id="fiscal" required disabled={loadingFiscais} value={form.fiscalId} onChange={(event) => setForm({ ...form, fiscalId: event.target.value })}><option value="">{loadingFiscais ? 'Carregando fiscais...' : 'Selecione seu nome'}</option>{fiscais.map((fiscal) => <option key={fiscal.id} value={fiscal.id}>{fiscal.nome}</option>)}</select><label htmlFor="fiscal-password">Senha</label><input id="fiscal-password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary" disabled={submitting || loadingFiscais}>{submitting ? 'Entrando...' : 'Entrar como fiscal'}</button></form>
    <Link className="login-alternate-link" to="/admin/login">Voltar ao acesso administrativo</Link>
  </section></main>;
}
