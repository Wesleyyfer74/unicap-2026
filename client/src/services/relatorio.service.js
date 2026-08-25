import api from './api';

export const relatorioService = {
  list: (params) => api.get('/relatorios/chamadas', { params }).then(({ data }) => data),
  pdf: (params) => api.get('/relatorios/pdf', { params, responseType: 'blob', timeout: 60000 }),
};
