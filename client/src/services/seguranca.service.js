import api from './api';
const key = 'unicap_dev_token';
export const segurancaService = {
  login: (username, password) => api.post('/seguranca/dev/login', { username, password }).then(({ data }) => data.token),
  list: (params) => api.get('/seguranca/acessos', { params, headers: { Authorization: `Bearer ${sessionStorage.getItem(key) || ''}` } }).then(({ data }) => data),
  track: (path) => api.post('/seguranca/access', { path }).catch(() => null),
  getToken: () => sessionStorage.getItem(key),
  setToken: (token) => sessionStorage.setItem(key, token),
  logout: () => sessionStorage.removeItem(key),
};
