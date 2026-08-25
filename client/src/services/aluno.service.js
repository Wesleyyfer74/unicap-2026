import api from './api';
export const alunoService = {
  list: (params) => api.get('/alunos', { params }).then(({ data }) => data),
  listArchived: (params) => api.get('/alunos/arquivados', { params }).then(({ data }) => data),
  get: (id) => api.get(`/alunos/${id}`).then(({ data }) => data.aluno),
  create: (data) => api.post('/alunos', data).then(({ data: response }) => response.aluno),
  update: (id, data) => api.put(`/alunos/${id}`, data).then(({ data: response }) => response.aluno),
  updateStatus: (id, ativo, motivo) => api.patch(`/alunos/${id}/status`, { ativo, ...(motivo && { motivo }) }).then(({ data }) => data.aluno),
  remove: (id) => api.delete(`/alunos/${id}`),
  presencas: (id, params) => api.get(`/alunos/${id}/historico/presencas`, { params }).then(({ data }) => data),
  ocorrencias: (id, params) => api.get(`/alunos/${id}/historico/ocorrencias`, { params }).then(({ data }) => data),
};
