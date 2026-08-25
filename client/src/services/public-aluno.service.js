import api from './api';

export const publicAlunoService = {
  findByCpf: (cpf) => api.post('/public/alunos', { cpf }).then(({ data }) => data.aluno),
};
