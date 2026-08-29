import api from './api';
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then(({ data }) => data),
  fiscalLogin: (credentials) => api.post('/auth/fiscal/login', credentials).then(({ data }) => data),
  listFiscais: () => api.get('/auth/fiscais').then(({ data }) => data.items),
  me: () => api.get('/auth/me').then(({ data }) => data.usuario),
  updateProfile: (profile) => api.put('/auth/profile', profile).then(({ data }) => data),
  changePassword: (passwords) => api.put('/auth/password', passwords).then(({ data }) => data),
};
