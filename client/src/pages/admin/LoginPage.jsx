import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';

export default function LoginPage() {
  const { authenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [type, setType] = useState('FISCAL');
  const [form, setForm] = useState({ email: '', fiscalId: '', password: '' });
  const [fiscais, setFiscais] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Login | Sistema de Transporte';
    authService.listFiscais().then(setFiscais).catch(() => setError('Não foi possível carregar a lista de fiscais.'));
  }, []);

  if (!loading && authenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const usuario = await login({ ...form, type });
      const destination = usuario.role === 'FISCAL' ? '/admin/chamadas' : location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível conectar à API. Tente novamente.');
    } finally { setSubmitting(false); }
  }

  return <main className="login-page"><section className="login-card" aria-labelledby="login-title">
    <div className="login-brand"><img src="/logo.png" alt="UNICAP" /></div>
    <h1 id="login-title">Acesso ao sistema</h1>
    <p>Escolha o tipo de acesso para continuar.</p>
    <div className="login-type" role="tablist" aria-label="Tipo de acesso">
      <button type="button" role="tab" aria-selected={type === 'FISCAL'} className={type === 'FISCAL' ? 'active' : ''} onClick={() => { setType('FISCAL'); setError(''); }}>Fiscal</button>
      <button type="button" role="tab" aria-selected={type === 'ADMIN'} className={type === 'ADMIN' ? 'active' : ''} onClick={() => { setType('ADMIN'); setError(''); }}>Administrador</button>
    </div>
    <form onSubmit={handleSubmit}>
      {type === 'FISCAL' ? <><label htmlFor="fiscal">Quem está entrando?</label><select id="fiscal" required value={form.fiscalId} onChange={(event) => setForm({ ...form, fiscalId: event.target.value })}><option value="">Selecione seu nome</option>{fiscais.map((fiscal) => <option key={fiscal.id} value={fiscal.id}>{fiscal.nome}</option>)}</select></> : <><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></>}
      <label htmlFor="password">Senha</label><input id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary" disabled={submitting}>{submitting ? 'Entrando...' : `Entrar como ${type === 'FISCAL' ? 'fiscal' : 'administrador'}`}</button>
    </form>
  </section></main>;
}
