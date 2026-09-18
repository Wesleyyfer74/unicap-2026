import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://root@127.0.0.1:3306/sistema_transporte_test';
dotenv.config({ path: new URL('../.env', import.meta.url) });

const { default: app } = await import('../src/app.js');
const { prisma } = await import('../src/config/prisma.js');
const { env } = await import('../src/config/env.js');
const { hashCpf } = await import('../src/utils/cpf.js');

let server;
let baseUrl;
let administrador;
let token;
let fiscal;
let aluno;
let chamada;
let ocorrencia;

async function request(path, { method = 'GET', body, auth = token, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(auth && { Authorization: `Bearer ${auth}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
  return { response, data };
}

async function resetDatabase() {
  await prisma.ocorrencia.deleteMany();
  await prisma.viagem.deleteMany();
  await prisma.presenca.deleteMany();
  await prisma.chamada.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.fiscal.deleteMany();
  await prisma.administrador.deleteMany();
}

before(async () => {
  await resetDatabase();
  administrador = await prisma.administrador.create({
    data: {
      nome: 'Administrador de Teste',
      email: 'admin.teste@example.com',
      passwordHash: await bcrypt.hash('SenhaInicial123!', 12),
    },
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await resetDatabase();
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe('Autenticação', { concurrency: false }, () => {
  test('login correto', async () => {
    const { response, data } = await request('/auth/login', { method: 'POST', auth: null, body: { email: 'ADMIN.TESTE@EXAMPLE.COM', password: 'SenhaInicial123!' } });
    assert.equal(response.status, 200);
    assert.ok(data.token);
    assert.equal(data.administrador.email, 'admin.teste@example.com');
    assert.equal(data.administrador.passwordHash, undefined);
    token = data.token;
  });

  test('senha incorreta e usuário inexistente não revelam a conta', async () => {
    const wrong = await request('/auth/login', { method: 'POST', auth: null, body: { email: 'admin.teste@example.com', password: 'SenhaIncorreta!' } });
    const missing = await request('/auth/login', { method: 'POST', auth: null, body: { email: 'ninguem@example.com', password: 'SenhaIncorreta!' } });
    assert.equal(wrong.response.status, 401);
    assert.equal(missing.response.status, 401);
    assert.equal(wrong.data.message, missing.data.message);
  });

  test('token inválido e expirado são recusados', async () => {
    const invalid = await request('/auth/me', { auth: 'token.invalido.adulterado' });
    const expired = jwt.sign({ type: 'admin', ver: administrador.tokenVersion }, env.JWT_SECRET, {
      subject: String(administrador.id), algorithm: 'HS256', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: -1,
    });
    const expiredResponse = await request('/auth/me', { auth: expired });
    assert.equal(invalid.response.status, 401);
    assert.equal(expiredResponse.response.status, 401);
  });

  test('altera email somente com a senha atual correta', async () => {
    const denied = await request('/auth/profile', { method: 'PUT', body: { email: 'novo.admin@example.com', currentPassword: 'SenhaIncorreta!' } });
    assert.equal(denied.response.status, 400);
    const changed = await request('/auth/profile', { method: 'PUT', body: { email: 'NOVO.ADMIN@EXAMPLE.COM', currentPassword: 'SenhaInicial123!' } });
    assert.equal(changed.response.status, 200);
    assert.equal(changed.data.administrador.email, 'novo.admin@example.com');
  });

  test('alteração de senha revoga o token anterior', async () => {
    const previousToken = token;
    const changed = await request('/auth/password', { method: 'PUT', body: { currentPassword: 'SenhaInicial123!', newPassword: 'SenhaNova123!', confirmPassword: 'SenhaNova123!' } });
    assert.equal(changed.response.status, 200);
    assert.equal((await request('/auth/me', { auth: previousToken })).response.status, 401);
    const login = await request('/auth/login', { method: 'POST', auth: null, body: { email: 'novo.admin@example.com', password: 'SenhaNova123!' } });
    assert.equal(login.response.status, 200);
    token = login.data.token;
  });
});

describe('Alunos e QR Code', { concurrency: false }, () => {
  test('rejeita CPF inválido e localiza aluno autorizado com UUID', async () => {
    assert.equal((await request('/public/alunos', { method: 'POST', auth: null, body: { cpf: '111.111.111-11' } })).response.status, 422);
    aluno = await prisma.aluno.create({ data: { nomeCompleto: 'Aluno Principal', cpfHash: hashCpf('52998224725') } });
    const found = await request('/public/alunos', { method: 'POST', auth: null, body: { cpf: '529.982.247-25' } });
    assert.equal(found.response.status, 200);
    assert.equal(found.data.aluno.nomeCompleto, aluno.nomeCompleto);
    assert.match(found.data.aluno.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(found.data.aluno.cpf, undefined);
  });

  test('gera QR somente com UUID e mantém download configurado', async () => {
    const image = await QRCode.toDataURL(aluno.uuid, { width: 360, margin: 2, errorCorrectionLevel: 'M' });
    assert.match(image, /^data:image\/png;base64,/);
    const component = await fs.readFile(new URL('../../client/src/components/AlunoQrModal.jsx', import.meta.url), 'utf8');
    assert.match(component, /QRCode\.toDataURL\(aluno\.uuid/);
    assert.match(component, /link\.download\s*=\s*`qr-/);
    assert.doesNotMatch(component, /QRCode\.toDataURL\(aluno\.nomeCompleto/);
  });
});

describe('Fiscal e chamada', { concurrency: false }, () => {
  test('cadastra, edita e desativa fiscal', async () => {
    const created = await request('/fiscais', { method: 'POST', body: { nome: 'Fiscal Teste' } });
    assert.equal(created.response.status, 201);
    fiscal = created.data.fiscal;
    const edited = await request(`/fiscais/${fiscal.id}`, { method: 'PUT', body: { nome: 'Fiscal Editado' } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.fiscal.nome, 'Fiscal Editado');
    const disabled = await request(`/fiscais/${fiscal.id}/status`, { method: 'PATCH', body: { ativo: false } });
    assert.equal(disabled.response.status, 200);
    assert.equal(disabled.data.fiscal.ativo, false);
    assert.equal((await request('/chamadas', { method: 'POST', body: { fiscalId: fiscal.id, turno: 'UNIGRAN_MATUTINO_INTEGRAL', corOnibus: 'Azul' } })).response.status, 400);
    await request(`/fiscais/${fiscal.id}/status`, { method: 'PATCH', body: { ativo: true } });
  });

  test('abre chamada com fiscal e turno válidos', async () => {
    assert.equal((await request('/chamadas', { method: 'POST', body: { fiscalId: fiscal.id, turno: 'INVALIDO', corOnibus: 'Azul' } })).response.status, 422);
    assert.equal((await request('/chamadas', { method: 'POST', body: { fiscalId: fiscal.id, turno: 'UNIGRAN_MATUTINO_INTEGRAL' } })).response.status, 422);
    const created = await request('/chamadas', { method: 'POST', body: { fiscalId: fiscal.id, turno: 'UNIGRAN_MATUTINO_INTEGRAL', corOnibus: 'Azul' } });
    assert.equal(created.response.status, 201);
    assert.equal(created.data.chamada.status, 'ABERTA');
    assert.equal(created.data.chamada.turno, 'UNIGRAN_MATUTINO_INTEGRAL');
    assert.equal(created.data.chamada.corOnibus, 'Azul');
    const edited = await request(`/chamadas/${created.data.chamada.id}`, { method: 'PUT', body: { fiscalId: fiscal.id, turno: 'UFGD_MATUTINO_INTEGRAL', corOnibus: 'VAN FURTADO' } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.chamada.turno, 'UFGD_MATUTINO_INTEGRAL');
    assert.equal(edited.data.chamada.corOnibus, 'VAN FURTADO');
    chamada = edited.data.chamada;
  });

  test('valida QR, aluno inexistente, inativo e presença duplicada', async () => {
    assert.equal((await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: 'conteudo-arbitrario' } })).response.status, 422);
    assert.equal((await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: '11111111-1111-4111-8111-111111111111' } })).response.status, 404);
    const inactive = (await request('/alunos', { method: 'POST', body: { nomeCompleto: 'Aluno Inativo' } })).data.aluno;
    assert.equal((await request(`/alunos/${inactive.id}/status`, { method: 'PATCH', body: { ativo: false } })).response.status, 422);
    const disabled = await request(`/alunos/${inactive.id}/status`, { method: 'PATCH', body: { ativo: false, motivo: 'Aluno não pertence mais à rota.' } });
    assert.equal(disabled.response.status, 200);
    assert.equal(disabled.data.aluno.motivoInativacao, 'Aluno não pertence mais à rota.');
    assert.ok(disabled.data.aluno.desativadoEm);
    const blockedScan = await request(`/chamadas/${chamada.id}/scanner/alunos/${inactive.uuid}`);
    assert.equal(blockedScan.response.status, 403);
    assert.equal(blockedScan.data.ok, false);
    assert.equal(blockedScan.data.code, 'ALUNO_INATIVO');
    assert.equal(blockedScan.data.aluno.nomeCompleto, 'Aluno Inativo');
    assert.equal(blockedScan.data.motivo, 'Aluno não pertence mais à rota.');
    const presenceCountBeforeBlock = await prisma.presenca.count({ where: { chamadaId: chamada.id, alunoId: inactive.id } });
    const blockedPresence = await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: inactive.uuid } });
    assert.equal(blockedPresence.response.status, 403);
    assert.equal(blockedPresence.data.ok, false);
    assert.equal(blockedPresence.data.code, 'ALUNO_INATIVO');
    assert.equal(blockedPresence.data.motivo, 'Aluno não pertence mais à rota.');
    assert.equal(await prisma.presenca.count({ where: { chamadaId: chamada.id, alunoId: inactive.id } }), presenceCountBeforeBlock);
    const reactivated = await request(`/alunos/${inactive.id}/status`, { method: 'PATCH', body: { ativo: true } });
    assert.equal(reactivated.data.aluno.motivoInativacao, null);
    assert.equal(reactivated.data.aluno.desativadoEm, null);
    assert.equal(reactivated.data.aluno.uuid, inactive.uuid);
    assert.equal((await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: aluno.uuid } })).response.status, 201);
    assert.equal((await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: aluno.uuid } })).response.status, 409);
  });

  test('finaliza chamada e impede novas presenças', async () => {
    const finished = await request(`/chamadas/${chamada.id}/finalizar`, { method: 'PATCH' });
    assert.equal(finished.response.status, 200);
    assert.equal(finished.data.chamada.status, 'FINALIZADA');
    assert.ok(finished.data.chamada.finishedAt);
    assert.equal((await request(`/chamadas/${chamada.id}/presencas`, { method: 'POST', body: { uuid: aluno.uuid } })).response.status, 409);
  });

  test('arquiva fiscal sem apagar seu cadastro', async () => {
    const disposable = await request('/fiscais', { method: 'POST', body: { nome: 'Fiscal Sem Histórico' } });
    assert.equal(disposable.response.status, 201);

    const removed = await request(`/fiscais/${disposable.data.fiscal.id}`, { method: 'DELETE' });
    assert.equal(removed.response.status, 204);
    assert.ok((await prisma.fiscal.findUnique({ where: { id: disposable.data.fiscal.id } })).deletedAt);
    assert.equal((await request('/fiscais?search=Fiscal%20Sem%20Histórico')).data.pagination.total, 0);
    assert.equal((await request('/fiscais/arquivados?search=Fiscal%20Sem%20Histórico')).data.pagination.total, 1);
  });

  test('arquiva aluno sem apagar seu cadastro', async () => {
    const disposable = await request('/alunos', { method: 'POST', body: { nomeCompleto: 'Aluno Sem Histórico' } });
    assert.equal(disposable.response.status, 201);

    const removed = await request(`/alunos/${disposable.data.aluno.id}`, { method: 'DELETE' });
    assert.equal(removed.response.status, 204);
    assert.ok((await prisma.aluno.findUnique({ where: { id: disposable.data.aluno.id } })).deletedAt);
    assert.equal((await request('/alunos?search=Aluno%20Sem%20Histórico')).data.pagination.total, 0);
    assert.equal((await request('/alunos/arquivados?search=Aluno%20Sem%20Histórico')).data.pagination.total, 1);
  });

  test('libera CPF que esteja vinculado somente a aluno arquivado', async () => {
    const archived = await request('/alunos', { method: 'POST', body: { nomeCompleto: 'Cadastro Arquivado CPF', cpf: '045.499.261-04' } });
    assert.equal(archived.response.status, 201);
    assert.equal((await request(`/alunos/${archived.data.aluno.id}`, { method: 'DELETE' })).response.status, 204);
    const target = await request('/alunos', { method: 'POST', body: { nomeCompleto: 'Cadastro Corrigido CPF' } });
    const updated = await request(`/alunos/${target.data.aluno.id}`, { method: 'PUT', body: { nomeCompleto: 'Cadastro Corrigido CPF', cpf: '045.499.261-04' } });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.aluno.cpf, '045.499.261-04');
    const archivedRecord = await prisma.aluno.findUnique({ where: { id: archived.data.aluno.id }, select: { cpfHash: true, cpfEncrypted: true } });
    assert.equal(archivedRecord.cpfHash, null);
    assert.equal(archivedRecord.cpfEncrypted, null);
  });
});

describe('Viagem e ocorrência', { concurrency: false }, () => {
  test('valida hodômetro, cadastra e edita viagem', async () => {
    const invalid = await request(`/chamadas/${chamada.id}/viagem`, { method: 'POST', body: { nomeMotorista: 'Motorista Teste', fiscalId: fiscal.id, hodometroSaida: 200, hodometroChegada: 100 } });
    assert.equal(invalid.response.status, 422);
    const created = await request(`/chamadas/${chamada.id}/viagem`, { method: 'POST', body: { nomeMotorista: 'Motorista Teste', fiscalId: fiscal.id, linhaRota: 'Linha Azul', turno: 'UNIGRAN_MATUTINO_INTEGRAL', horarioSaida: '07:00', horarioChegada: '08:00', hodometroSaida: 100, hodometroChegada: 125 } });
    assert.equal(created.response.status, 201);
    const edited = await request(`/chamadas/${chamada.id}/viagem`, { method: 'PUT', body: { nomeMotorista: 'Motorista Editado', fiscalId: fiscal.id, linhaRota: 'Linha Verde', turno: 'UNIGRAN_MATUTINO_INTEGRAL', horarioSaida: '07:10', horarioChegada: '08:10', hodometroSaida: 101, hodometroChegada: 128 } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.viagem.nomeMotorista, 'Motorista Editado');
  });

  test('cadastra, consulta e edita ocorrência', async () => {
    const created = await request(`/chamadas/${chamada.id}/ocorrencias`, { method: 'POST', body: { alunoId: aluno.id, observacao: 'Ocorrência original para teste.' } });
    assert.equal(created.response.status, 201);
    ocorrencia = created.data.ocorrencia;
    const found = await request(`/ocorrencias/${ocorrencia.id}`);
    assert.equal(found.response.status, 200);
    const edited = await request(`/ocorrencias/${ocorrencia.id}`, { method: 'PUT', body: { observacao: 'Ocorrência atualizada para teste.' } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.ocorrencia.observacao, 'Ocorrência atualizada para teste.');
    const studentOccurrences = await request(`/ocorrencias?alunoId=${aluno.id}&page=1&limit=10`);
    assert.equal(studentOccurrences.response.status, 200);
    assert.deepEqual(studentOccurrences.data.aluno, { id: aluno.id, nomeCompleto: aluno.nomeCompleto });
    assert.equal(studentOccurrences.data.totalOcorrencias, studentOccurrences.data.pagination.total);
    assert.ok(Array.isArray(studentOccurrences.data.ocorrencias));
    assert.ok(studentOccurrences.data.ocorrencias.every((item) => item.aluno.id === aluno.id));
  });

  test('preserva presenças e ocorrências ao arquivar o aluno', async () => {
    const disposable = await prisma.aluno.create({ data: { nomeCompleto: 'Aluno Histórico Descartável' } });
    await prisma.presenca.create({ data: { alunoId: disposable.id, chamadaId: chamada.id } });
    await prisma.ocorrencia.create({ data: { alunoId: disposable.id, chamadaId: chamada.id, fiscalId: fiscal.id, observacao: 'Histórico para remoção.' } });

    assert.equal((await request(`/alunos/${disposable.id}`, { method: 'DELETE' })).response.status, 204);
    assert.equal(await prisma.presenca.count({ where: { alunoId: disposable.id } }), 1);
    assert.equal(await prisma.ocorrencia.count({ where: { alunoId: disposable.id } }), 1);
    const history = await request(`/alunos/${disposable.id}/historico/presencas?page=1&limit=5`);
    assert.equal(history.response.status, 200);
    assert.equal(history.data.pagination.total, 1);
  });
});

describe('Relatórios e PDF', { concurrency: false }, () => {
  test('retorna resumo e detalhes paginados da chamada sem N+1 no cliente', async () => {
    const summary = await request('/relatorios/chamadas?limit=50');
    assert.equal(summary.response.status, 200);
    assert.ok(summary.data.items.some((item) => item.id === chamada.id));
    const details = await request(`/chamadas/${chamada.id}/detalhes?presencasLimit=20&ocorrenciasLimit=10`);
    assert.equal(details.response.status, 200);
    assert.equal(details.data.chamada.id, chamada.id);
    assert.equal(details.data.presencas.pagination.total, details.data.chamada._count.presencas);
    assert.equal(details.data.ocorrencias.pagination.total, details.data.chamada._count.ocorrencias);
    assert.ok(Array.isArray(details.data.presencas.items));
    assert.ok(Array.isArray(details.data.ocorrencias.items));
  });

  test('combina filtros no backend', async () => {
    const cases = [
      { aluno: 'Aluno Principal' },
      { fiscal: 'Fiscal Editado' },
      { turno: 'UNIGRAN_MATUTINO_INTEGRAL' },
      { motorista: 'Motorista Editado' },
      { corOnibus: 'Azul' },
      { aluno: 'Aluno Principal', fiscal: 'Fiscal Editado', turno: 'UNIGRAN_MATUTINO_INTEGRAL', motorista: 'Motorista Editado' },
      { fiscal: 'Fiscal inexistente' },
      { aluno: 'Não Existe' },
    ];
    for (const filters of cases) {
      const query = new URLSearchParams(filters).toString();
      const result = await request(`/relatorios?${query}`);
      assert.equal(result.response.status, 200);
      assert.ok(Number.isInteger(result.data.pagination.total));
      if (result.data.items.length) {
        assert.ok(result.data.items.every((item) => item.corOnibus === 'Azul'));
        assert.ok(result.data.items.every((item) => Number.isInteger(item.totalAlunos)));
        assert.ok(result.data.items.every((item) => Number.isInteger(item.totalOcorrencias)));
        if (filters.aluno) {
          for (const item of result.data.items) {
            const matchingPresence = await prisma.presenca.count({
              where: { chamadaId: item.id, aluno: { nomeCompleto: { contains: filters.aluno } } },
            });
            assert.ok(matchingPresence > 0, `A chamada ${item.id} deve possuir presença do aluno filtrado`);
          }
        }
      }
      if (filters.aluno === 'Não Existe') assert.equal(result.data.pagination.total, 0);
      if (filters.fiscal === 'Fiscal inexistente') assert.equal(result.data.pagination.total, 0);
    }
  });

  test('gera PDF com poucos registros, filtros e ocorrências', async () => {
    const result = await request(`/relatorios/pdf?${new URLSearchParams({ aluno: 'Aluno Principal', motorista: 'Motorista Editado' })}`);
    assert.equal(result.response.status, 200);
    assert.match(result.response.headers.get('content-type'), /application\/pdf/);
    assert.match(result.response.headers.get('content-disposition'), /relatorio-frequencia-\d{4}-\d{2}-\d{2}\.pdf/);
    assert.equal(result.data.subarray(0, 4).toString(), '%PDF');
    assert.ok(result.data.length > 1500);
  });

  test('gera PDF paginado com muitos registros', async () => {
    const students = Array.from({ length: 120 }, (_, index) => ({ nomeCompleto: `Aluno Volume ${String(index).padStart(3, '0')}` }));
    await prisma.aluno.createMany({ data: students });
    const createdStudents = await prisma.aluno.findMany({ where: { nomeCompleto: { startsWith: 'Aluno Volume ' } }, select: { id: true } });
    await prisma.presenca.createMany({ data: createdStudents.map(({ id }) => ({ chamadaId: chamada.id, alunoId: id })) });
    const result = await request('/relatorios/pdf?aluno=Aluno%20Volume');
    assert.equal(result.response.status, 200);
    assert.equal(result.data.subarray(0, 4).toString(), '%PDF');
    assert.ok(result.data.length > 10000);
    const pageObjects = result.data.toString('latin1').match(/\/Type \/Page\b/g) || [];
    assert.ok(pageObjects.length > 1, 'O PDF volumoso deve possuir mais de uma página');
    const report = await request('/relatorios?aluno=Aluno%20Volume&limit=50');
    assert.equal(report.data.pagination.total, 1);
    assert.equal(report.data.items.length, 1);
    assert.ok(report.data.items[0].totalAlunos >= 120);
  });
});

describe('Administração de chamadas finalizadas', { concurrency: false }, () => {
  test('administrador edita e exclui uma chamada finalizada com seus registros', async () => {
    const created = await request('/chamadas', { method: 'POST', body: { fiscalId: fiscal.id, turno: 'UFGD_NOTURNO', corOnibus: 'ÔNIBUS FURTADO' } });
    assert.equal(created.response.status, 201);
    const callId = created.data.chamada.id;
    assert.equal((await request(`/chamadas/${callId}/presencas`, { method: 'POST', body: { uuid: aluno.uuid } })).response.status, 201);
    assert.equal((await request(`/chamadas/${callId}/finalizar`, { method: 'PATCH' })).response.status, 200);
    const edited = await request(`/chamadas/${callId}`, { method: 'PUT', body: { fiscalId: fiscal.id, turno: 'IFMS_MATUTINO', corOnibus: 'VAN FURTADO' } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.chamada.status, 'FINALIZADA');
    assert.equal(edited.data.chamada.corOnibus, 'VAN FURTADO');
    assert.equal((await request(`/chamadas/${callId}`, { method: 'DELETE' })).response.status, 204);
    assert.equal((await request(`/chamadas/${callId}`)).response.status, 404);
    assert.equal(await prisma.presenca.count({ where: { chamadaId: callId } }), 0);
  });
});
