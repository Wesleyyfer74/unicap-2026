# Manual de Uso — Sistema de Frequência e Gestão de Transporte UNICAP

## 1. Apresentação

O sistema registra alunos autorizados, gera QR Codes individuais, controla presenças em chamadas, organiza fiscais, viagens e ocorrências e produz relatórios operacionais em PDF.

Existem dois ambientes:

- Área pública: utilizada pelo aluno para localizar seu cadastro pelo CPF e salvar seu QR Code.
- Área administrativa: utilizada pela administração e pela equipe autorizada para operar chamadas e gerenciar registros.

> Importante: o cadastro de “Fiscal” identifica o responsável operacional associado à chamada. O acesso ao painel depende de uma conta administrativa autorizada.

## 2. Cadastro do aluno e geração do QR Code

1. Acesse o endereço principal do sistema pelo celular.
2. Na mensagem de boas-vindas, toque em **Fazer cadastro**.
3. Informe o CPF completo.
4. Toque em **Gerar QR Code**.
5. O sistema consulta a lista de alunos autorizados e apresenta o nome correspondente.
6. Confira o nome antes de continuar.
7. Baixe o QR Code e salve a imagem na galeria do celular.
8. Apresente essa imagem sempre que houver uma chamada.

O QR Code contém somente um UUID, que é um identificador seguro. Nome e CPF não são gravados na imagem.

Se o CPF não for localizado, confira os onze números e procure a administração. O aluno não deve criar cadastros repetidos.

## 3. Login administrativo

1. Acesse `/admin/login`.
2. Informe o e-mail administrativo.
3. Informe a senha.
4. Toque em **Entrar**.

Após o acesso, o sistema abre o Dashboard. Ao terminar, utilize **Sair**, principalmente em celulares, tablets ou computadores compartilhados.

### Alteração de conta e senha

1. Toque na engrenagem localizada no cabeçalho.
2. Para alterar o e-mail, informe o novo endereço e confirme com a senha atual.
3. Para alterar a senha, informe a senha atual, a nova senha e a confirmação.
4. Guarde as novas credenciais em local seguro.

## 4. Dashboard

O Dashboard apresenta um resumo da operação:

- alunos cadastrados;
- fiscais ativos;
- chamadas realizadas hoje;
- presenças registradas hoje;
- ocorrências recentes;
- últimas chamadas;
- últimas ocorrências.

Os cards funcionam como atalhos para os respectivos módulos. O botão de interrogação abre o guia de uso dentro do próprio sistema.

## 5. Gestão de fiscais

1. Abra **Fiscais** no menu.
2. Use **Novo Fiscal** para cadastrar um responsável.
3. Pesquise pelo nome quando necessário.
4. Use **Editar** para corrigir o nome.
5. Use **Desativar** quando o fiscal não estiver mais disponível para novas chamadas.
6. Use **Ativar** para permitir novamente sua seleção.
7. Use **Excluir** somente quando apropriado.

O histórico vinculado a um fiscal permanece preservado. Antes de abrir uma chamada, confirme que o fiscal responsável está ativo.

## 6. Gestão de alunos

A página **Alunos** mostra nome, CPF, UUID, status, cadastro e ações.

### Pesquisa

- Digite o nome para pesquisar em tempo real.
- Digite ou cole o CPF completo, com ou sem pontuação.
- O sistema aplica a máscara do CPF automaticamente.

### Ações

- **Editar:** altera nome e, quando necessário, CPF. O UUID não pode ser alterado.
- **Histórico:** mostra presenças e ocorrências do aluno.
- **QR Code:** permite visualizar e baixar novamente o QR Code.
- **Desativar:** bloqueia novas presenças e exige um motivo obrigatório.
- **Ativar:** libera novamente o aluno e limpa o bloqueio atual.
- **Excluir:** arquiva o cadastro, preservando vínculos históricos.

Quando um aluno inativo apresenta o QR Code, o scanner não registra presença e mostra seu nome e o motivo da desativação.

## 7. Abertura de uma chamada

1. Abra **Chamadas**.
2. Toque em **Nova Chamada**.
3. Selecione o fiscal responsável.
4. Selecione o turno: Matutino, Integral ou Noturno.
5. Selecione a cor/identificação do ônibus.
6. Toque em **Iniciar chamada**.

A data e o horário de início são definidos pelo servidor. A chamada é criada com status **Aberta** e o sistema direciona para o scanner.

## 8. Scanner e registro de presença

1. Permita o uso da câmera quando o navegador solicitar.
2. Prefira a câmera traseira do celular.
3. Se necessário, escolha outra câmera no seletor.
4. Posicione o QR Code dentro da área indicada.
5. Aguarde a identificação do aluno.
6. Confira o nome no modal.
7. Toque em **Confirmar** para registrar ou **Cancelar** para voltar ao scanner.

O scanner bloqueia leituras simultâneas enquanto confirma o aluno. Depois do registro ou cancelamento, ele é reativado para o próximo passageiro.

### Mensagens possíveis

- **Presença registrada:** operação concluída.
- **Aluno já registrado nesta chamada:** a presença anterior foi mantida e nenhuma duplicata foi criada.
- **QR Code inválido:** o conteúdo não corresponde a um UUID aceito.
- **Aluno não encontrado:** o UUID não pertence a um cadastro existente.
- **Aluno não autorizado:** o cadastro está inativo; confira o motivo apresentado.
- **Chamada finalizada:** novas presenças não podem ser incluídas.

## 9. Lista de presenças

Na tela do scanner é possível acompanhar:

- quantidade total registrada;
- últimos alunos registrados;
- horário de cada leitura;
- lista completa em **Ver todos**;
- pesquisa por nome dentro da chamada.

Uma presença registrada por engano pode ser removida com confirmação enquanto a chamada estiver aberta. Depois da finalização, a remoção comum fica bloqueada para proteger o histórico.

## 10. Finalização da chamada

1. Confira a quantidade e os alunos registrados.
2. Toque em **Finalizar Chamada**.
3. Leia o aviso e confirme.
4. O sistema define o status como **Finalizada** e registra o horário de término.

Após a finalização, escolha:

- **Preencher formulário:** abre o registro da viagem;
- **Agora não:** abre os detalhes da chamada, permitindo preencher a viagem posteriormente.

Não finalize enquanto ainda houver alunos aguardando leitura.

## 11. Formulário da viagem

O formulário registra:

- nome do motorista, obrigatório;
- fiscal, obrigatório;
- linha/rota selecionada;
- turno;
- horário de saída;
- horário de chegada;
- hodômetro de saída;
- hodômetro de chegada.

O hodômetro de chegada não pode ser menor que o de saída. Confira também a coerência dos horários. Cada chamada possui no máximo uma viagem; ao retornar ao formulário, o registro existente abre para edição.

## 12. Ocorrências

### Registrar pela chamada

1. Abra uma chamada finalizada.
2. Localize o aluno presente.
3. Toque em **Adicionar ocorrência**.
4. Confira aluno, fiscal e data.
5. Escreva a observação de forma objetiva.
6. Salve.

### Consultar e editar

1. Abra **Ocorrências**.
2. Pesquise um aluno pelo campo com sugestões.
3. Combine, quando necessário, fiscal, período e turno.
4. Consulte o total de ocorrências e os registros mais recentes.
5. Use **Detalhes** para leitura completa ou **Editar** para corrigir a observação.

Evite incluir senhas, documentos ou outros dados sensíveis no texto da ocorrência.

## 13. Histórico

A aba **Histórico** reúne alunos e fiscais arquivados. Esses cadastros continuam vinculados às chamadas, presenças, viagens e ocorrências anteriores, permitindo reconstruir a operação mesmo depois de uma exclusão administrativa.

## 14. Relatórios

1. Abra **Relatórios**.
2. Informe data inicial e final ou utilize Hoje, Esta semana, Este mês ou Este ano.
3. Combine filtros de aluno, turno, fiscal, motorista e cor do ônibus.
4. Toque em **Aplicar filtros**.
5. Use **Limpar filtros** para retornar à consulta geral.

Cada linha representa uma chamada e mostra data, fiscal, turno, ônibus, motorista, quantidade de alunos, quantidade de ocorrências e status.

Toque na linha ou em **Ver detalhes** para abrir a gaveta contendo:

- horários e dados operacionais;
- motorista, rota e hodômetros;
- alunos presentes e horários;
- ocorrências da chamada.

## 15. Exportação em PDF

1. Configure e aplique os filtros desejados.
2. Toque em **Exportar PDF**.
3. Aguarde a geração.
4. Salve ou compartilhe o arquivo baixado.

O PDF utiliza os filtros atualmente aplicados e apresenta cabeçalho, período, filtros, registros, totais e paginação.

## 16. Checklist rápido do fiscal

Antes da chamada:

- confirmar internet e carga do aparelho;
- testar permissão da câmera;
- confirmar fiscal, turno e ônibus;
- iniciar apenas uma chamada correspondente à operação atual.

Durante a chamada:

- conferir o nome antes de confirmar;
- observar mensagens de duplicidade ou bloqueio;
- acompanhar o contador de presentes;
- corrigir enganos antes de finalizar.

Depois da chamada:

- revisar a lista;
- finalizar a chamada;
- preencher os dados da viagem;
- registrar ocorrências quando necessário;
- sair da conta em aparelho compartilhado.

## 17. Solução de problemas

### A câmera não abre

Confira a permissão de câmera do navegador, utilize HTTPS, feche outros aplicativos que estejam usando a câmera e tente selecionar outro dispositivo.

### O QR Code não é lido

Aumente o brilho da tela, limpe a lente, mantenha o código inteiro dentro da área e evite reflexos.

### CPF não encontrado

Confira os onze números. Se estiver correto, a administração deve verificar se o aluno consta na lista autorizada e está ativo.

### Sessão encerrada

Faça login novamente. A sessão possui expiração por segurança.

### Erro inesperado

Não repita rapidamente a mesma operação. Anote a tela, chamada, horário e mensagem exibida e encaminhe essas informações ao responsável técnico.

## 18. Segurança e privacidade

- Não compartilhe credenciais administrativas.
- Não envie tokens ou arquivos de ambiente.
- Não exponha CPFs em mensagens ou ocorrências.
- O CPF é protegido no banco e somente a área administrativa autenticada pode exibi-lo.
- O QR Code utiliza apenas UUID e não carrega dados pessoais.
- Utilize sempre o domínio oficial com HTTPS.
