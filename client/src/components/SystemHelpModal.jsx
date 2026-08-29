import { useEffect } from 'react';

const sections = [
  {
    title: '1. Cadastro do aluno e QR Code',
    audience: 'Aluno',
    steps: [
      'Acesse a página inicial pelo celular e toque em “Fazer cadastro”.',
      'Informe o CPF completo. O sistema consulta a lista autorizada e identifica o nome do aluno.',
      'Confira o nome apresentado e gere o QR Code individual.',
      'Baixe a imagem e mantenha-a salva na galeria do celular para apresentar nas chamadas.',
      'O QR Code contém somente um identificador seguro; ele não contém nome nem CPF.',
    ],
  },
  {
    title: '2. Acesso ao painel',
    audience: 'Administrador e equipe autorizada',
    steps: [
      'Acesse /admin/login, informe o e-mail e a senha e toque em “Entrar”.',
      'Use a engrenagem no cabeçalho para alterar o e-mail ou a senha da conta.',
      'Ao terminar o trabalho, utilize “Sair”, principalmente em aparelhos compartilhados.',
    ],
  },
  {
    title: '3. Fiscais',
    audience: 'Administrador',
    steps: [
      'Abra “Fiscais” para cadastrar, pesquisar, editar, ativar ou desativar responsáveis.',
      'Antes de abrir uma chamada, confirme que o fiscal responsável está ativo.',
      'A exclusão arquiva o cadastro quando necessário; os históricos operacionais permanecem preservados.',
    ],
  },
  {
    title: '4. Alunos',
    audience: 'Administrador',
    steps: [
      'Abra “Alunos” para consultar nome, CPF, UUID, status e data de cadastro.',
      'Pesquise em tempo real por nome ou pelo CPF completo, com ou sem pontuação.',
      'Use “QR Code” para visualizar ou baixar novamente a identificação do aluno.',
      'Use “Histórico” para consultar presenças e ocorrências.',
      'Para desativar um aluno, informe obrigatoriamente o motivo. O scanner mostrará esse motivo ao fiscal.',
      'A exclusão arquiva o aluno e mantém os registros históricos relacionados.',
    ],
  },
  {
    title: '5. Abrir e operar uma chamada',
    audience: 'Fiscal ou operador autorizado',
    steps: [
      'Abra “Chamadas” e toque em “Nova Chamada”.',
      'Selecione o fiscal responsável, o turno e a cor do ônibus; a data e o início são registrados pelo servidor.',
      'Na tela do scanner, permita o uso da câmera e prefira a câmera traseira do celular.',
      'Aponte para o QR Code, confira o nome identificado e toque em “Confirmar”.',
      'Se o aluno estiver sem o QR Code, toque em “Buscar aluno pelo nome”, digite pelo menos duas letras, selecione o cadastro correto e confirme a presença.',
      'Após a mensagem de presença registrada, continue com o próximo aluno sem recarregar a página.',
      'QR inválido, aluno inexistente, duplicado ou inativo não gera presença. Para aluno inativo, confira o motivo exibido.',
      'Acompanhe o total e os últimos alunos registrados. Em “Ver todos”, pesquise e remova enganos enquanto a chamada estiver aberta.',
    ],
  },
  {
    title: '6. Finalizar chamada e registrar viagem',
    audience: 'Fiscal ou operador autorizado',
    steps: [
      'Confira a lista de presenças e toque em “Finalizar Chamada”.',
      'Confirme somente quando a leitura tiver terminado: chamadas finalizadas não aceitam novas presenças.',
      'Escolha “Preencher formulário” para registrar motorista, fiscal, linha/rota, turno, horários e hodômetros, ou “Agora não” para preencher depois.',
      'Quando saída e chegada forem informadas, confira a coerência dos horários e do hodômetro.',
    ],
  },
  {
    title: '7. Ocorrências',
    audience: 'Fiscal ou administrador',
    steps: [
      'Após a chamada ser finalizada, abra seus detalhes e localize o aluno presente.',
      'Toque em “Adicionar ocorrência”, confira aluno, fiscal e data, descreva a situação e salve.',
      'Em “Ocorrências”, pesquise por aluno e combine os filtros disponíveis para consultar ou editar registros.',
      'As ocorrências integram o histórico operacional e não devem ser apagadas silenciosamente.',
    ],
  },
  {
    title: '8. Relatórios e PDF',
    audience: 'Administrador',
    steps: [
      'Abra “Relatórios” e combine período, aluno, turno, fiscal, motorista e cor do ônibus.',
      'Use os atalhos Hoje, Esta semana, Este mês ou Este ano e depois aplique os filtros.',
      'Cada resultado representa uma chamada. Toque em “Ver detalhes” para consultar viagem, alunos e ocorrências.',
      'Use “Exportar PDF” para baixar o relatório com exatamente os filtros selecionados.',
    ],
  },
  {
    title: '9. Histórico e boas práticas',
    audience: 'Todos os operadores',
    steps: [
      'A aba “Histórico” reúne alunos e fiscais arquivados sem romper seus vínculos operacionais.',
      'Não compartilhe senha, token ou acesso administrativo e não registre dados sensíveis nas observações.',
      'Antes da operação, teste câmera e internet. Mantenha o aparelho carregado e evite fechar a página durante a chamada.',
      'Em caso de erro, anote a chamada, o horário e a mensagem apresentada antes de atualizar a página.',
    ],
  },
];

export default function SystemHelpModal({ onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop help-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <header>
          <div>
            <span className="help-eyebrow">Central de ajuda</span>
            <h2 id="help-title">Como utilizar o Sistema de Transporte</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar ajuda" onClick={onClose}>×</button>
        </header>
        <p className="help-intro">Guia rápido para cadastro de alunos, operação das chamadas e administração do sistema.</p>
        <div className="help-content">
          {sections.map((section) => (
            <article key={section.title}>
              <header><h3>{section.title}</h3><span>{section.audience}</span></header>
              <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
          ))}
        </div>
        <footer className="modal-actions"><button type="button" className="button button-primary" onClick={onClose}>Entendi</button></footer>
      </section>
    </div>
  );
}
