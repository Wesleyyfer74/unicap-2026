import { useCallback, useEffect, useState } from 'react';
import { segurancaService } from '../../services/seguranca.service';

const labels = { ACESSO_SITE: 'Acesso ao site', LOGIN_ADMIN_SUCESSO: 'Login admin', LOGIN_ADMIN_FALHA: 'Falha no login admin', LOGIN_FISCAL_SUCESSO: 'Login fiscal', LOGIN_FISCAL_FALHA: 'Falha no login fiscal', DEV_LOGIN_SUCESSO: 'Login dev', DEV_LOGIN_FALHA: 'Falha no login dev', SENHA_ADMIN_ALTERADA: 'Senha alterada' };
const dateTime = (value) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));

export default function DevSecurityPage() {
  const [token, setToken] = useState(segurancaService.getToken());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setData(await segurancaService.list({ page, limit: 30, busca: search || undefined })); setError(''); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível carregar os registros.'); if (requestError.response?.status === 401) { segurancaService.logout(); setToken(null); } }
    finally { setLoading(false); }
  }, [page, search, token]);
  useEffect(() => { load(); }, [load]);
  async function login(event) { event.preventDefault(); setLoading(true); try { const nextToken = await segurancaService.login(username, password); segurancaService.setToken(nextToken); setToken(nextToken); setPassword(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível entrar.'); } finally { setLoading(false); } }
  if (!token) return <main className="public-page"><section className="public-card login-card"><img src="/logo.png" alt="UNICAP" className="public-logo" /><h1>Área de segurança</h1><p>Acesso restrito.</p><form className="modal-form" onSubmit={login}><label>Usuário<input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="form-error">{error}</div>}<button className="button button-primary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button></form></section></main>;
  return <main className="app-content"><div className="page-heading"><div><h1>Monitoramento de segurança</h1><p>Logins e acessos registrados pelo sistema.</p></div><button className="button button-secondary" onClick={() => { segurancaService.logout(); setToken(null); }}>Sair</button></div>{error && <div className="feedback error">{error}</div>}<section className="card"><div className="filters"><label><span>Buscar IP, usuário, página ou dispositivo</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Ex.: 191.240 ou Android" /></label></div><div className="table-wrapper"><table><thead><tr><th>Data / hora</th><th>Evento</th><th>IP</th><th>Dispositivo</th><th>Navegador</th><th>Usuário</th><th>Página</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="empty-state">Carregando...</td></tr> : data.items.length === 0 ? <tr><td colSpan="7" className="empty-state">Nenhum acesso registrado.</td></tr> : data.items.map((item) => <tr key={item.id}><td data-label="Data / hora">{dateTime(item.createdAt)}</td><td data-label="Evento"><span className={`status ${item.sucesso ? 'active' : 'inactive'}`}>{labels[item.tipo] || item.tipo}</span></td><td data-label="IP">{item.ip || 'Não informado'}</td><td data-label="Dispositivo">{item.dispositivo || 'Não identificado'}<br /><small>{item.sistema || ''}</small></td><td data-label="Navegador">{item.navegador || 'Não identificado'}</td><td data-label="Usuário">{item.usuarioNome || item.perfil || 'Visitante'}</td><td data-label="Página">{item.caminho || '-'}</td></tr>)}</tbody></table></div><div className="pagination"><span>{data.pagination.total} registro(s)</span><div><button className="button button-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page} de {data.pagination.totalPages}</span><button className="button button-secondary" disabled={page >= data.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}>Próxima</button></div></div></section></main>;
}
