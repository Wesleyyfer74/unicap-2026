import api from './api';
export const ocorrenciaService = {
  list: (params) => api.get('/ocorrencias', { params }).then(({ data }) => data.ocorrencias ? { ...data, items: data.ocorrencias } : data),
  get: (id) => api.get(`/ocorrencias/${id}`).then(({ data }) => data.ocorrencia),
  createForCall: (chamadaId, data) => api.post(`/chamadas/${chamadaId}/ocorrencias`, data).then(({ data: response }) => response.ocorrencia),
  update: (id, observacao) => api.put(`/ocorrencias/${id}`, { observacao }).then(({ data }) => data.ocorrencia),
};
