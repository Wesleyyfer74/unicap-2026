import api from './api';
export const chamadaService = {
  list: (params) => api.get('/chamadas', { params }).then(({ data }) => data),
  get: (id) => api.get(`/chamadas/${id}`).then(({ data }) => data.chamada),
  getDetails: (id, params) => api.get(`/chamadas/${id}/detalhes`, { params }).then(({ data }) => data),
  create: (data) => api.post('/chamadas', data).then(({ data: response }) => response.chamada),
  finish: (id) => api.patch(`/chamadas/${id}/finalizar`).then(({ data }) => data.chamada),
  addPresence: (id, uuid) => api.post(`/chamadas/${id}/presencas`, { uuid }).then(({ data }) => data),
  identifyStudent: (id, uuid) => api.get(`/chamadas/${id}/scanner/alunos/${encodeURIComponent(uuid)}`).then(({ data }) => data.aluno),
  listPresences: (id, params) => api.get(`/chamadas/${id}/presencas`, { params }).then(({ data }) => data),
  removePresence: (id, presenceId) => api.delete(`/chamadas/${id}/presencas/${presenceId}`),
  createTrip: (id, data) => api.post(`/chamadas/${id}/viagem`, data).then(({ data: response }) => response.viagem),
  getTrip: (id) => api.get(`/chamadas/${id}/viagem`).then(({ data }) => data.viagem),
  updateTrip: (id, data) => api.put(`/chamadas/${id}/viagem`, data).then(({ data: response }) => response.viagem),
};
