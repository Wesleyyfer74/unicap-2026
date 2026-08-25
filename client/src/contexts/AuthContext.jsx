import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.service';
import { authStorage } from '../utils/authStorage';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [administrador, setAdministrador] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => { authStorage.clear(); setAdministrador(null); }, []);
  useEffect(() => {
    async function validateSession() { if (!authStorage.getToken()) return setLoading(false); try { setAdministrador(await authService.me()); } catch { logout(); } finally { setLoading(false); } }
    validateSession();
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);
  const login = useCallback(async (credentials) => { const session = await authService.login(credentials); authStorage.setToken(session.token); setAdministrador(session.administrador); return session.administrador; }, []);
  const updateAdministrador = useCallback((data) => setAdministrador(data), []);
  const value = useMemo(() => ({ administrador, authenticated: Boolean(administrador), loading, login, logout, updateAdministrador }), [administrador, loading, login, logout, updateAdministrador]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
