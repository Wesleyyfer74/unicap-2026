import api from './api';
export const fiscalService = {
  list: (params) => api.get('/fiscais', { params }).then(({ data }) => data),
  listArchived: (params) => api.get('/fiscais/arquivados', { params }).then(({ data }) => data),
  create: (data) => api.post('/fiscais', data).then(({ data: response }) => response.fiscal),
  update: (id, data) => api.put(`/fiscais/${id}`, data).then(({ data: response }) => response.fiscal),
  updateStatus: (id, ativo) => api.patch(`/fiscais/${id}/status`, { ativo }).then(({ data }) => data.fiscal),
  remove: (id) => api.delete(`/fiscais/${id}`),
};
