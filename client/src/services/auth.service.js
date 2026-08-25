import api from './api';
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then(({ data }) => data),
  me: () => api.get('/auth/me').then(({ data }) => data.administrador),
  updateProfile: (profile) => api.put('/auth/profile', profile).then(({ data }) => data),
  changePassword: (passwords) => api.put('/auth/password', passwords).then(({ data }) => data),
};
