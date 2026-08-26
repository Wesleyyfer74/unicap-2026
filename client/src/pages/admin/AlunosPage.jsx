import { useCallback, useEffect, useState } from "react";
import AlunoFormModal from "../../components/AlunoFormModal";
import AlunoHistoryModal from "../../components/AlunoHistoryModal";
import AlunoQrModal from "../../components/AlunoQrModal";
import Modal from "../../components/Modal";
import { alunoService } from "../../services/aluno.service";

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function AlunosPage() {
  const [alunos, setAlunos] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [ativo, setAtivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const [confirming, setConfirming] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationError, setDeactivationError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [historyAluno, setHistoryAluno] = useState(null);
  const [qrAluno, setQrAluno] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((old) => ({ ...old, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const loadAlunos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alunoService.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ativo: ativo || undefined,
      });
      setAlunos(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message ||
          "Não foi possível carregar os alunos.",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, ativo]);
  useEffect(() => {
    loadAlunos();
  }, [loadAlunos]);

  async function saveAluno(data) {
    setSaving(true);
    try {
      await (editing
        ? alunoService.update(editing.id, data)
        : alunoService.create(data));
      setFeedback({
        type: "success",
        text: editing
          ? "Aluno atualizado com sucesso."
          : "Aluno cadastrado com sucesso.",
      });
      setEditing(undefined);
      await loadAlunos();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message || "Não foi possível salvar o aluno.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(aluno, nextStatus, motivo) {
    const normalizedReason = motivo?.trim();
    if (!nextStatus && (!normalizedReason || normalizedReason.length < 3)) {
      setDeactivationError("Informe o motivo da desativação.");
      return;
    }
    setSaving(true);
    try {
      await alunoService.updateStatus(aluno.id, nextStatus, normalizedReason);
      setFeedback({
        type: "success",
        text: `Aluno ${nextStatus ? "ativado" : "desativado"} com sucesso.`,
      });
      setConfirming(null);
      setDeactivationReason("");
      setDeactivationError("");
      await loadAlunos();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message || "Não foi possível alterar o status.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAluno() {
    setSaving(true);
    try {
      await alunoService.remove(confirmingDelete.id);
      setFeedback({
        type: "success",
        text: "Aluno arquivado. Seu histórico foi preservado.",
      });
      setConfirmingDelete(null);
      if (alunos.length === 1 && pagination.page > 1)
        setPagination((old) => ({ ...old, page: old.page - 1 }));
      else await loadAlunos();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message || "Não foi possível excluir o aluno.",
      });
      setConfirmingDelete(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-content">
      <div className="page-heading">
        <div>
          <h1>Alunos</h1>
          <p>Gerencie cadastros, QR Codes e históricos.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setEditing(null)}
        >
          Novo Aluno
        </button>
      </div>
      {feedback && (
        <div className={`feedback ${feedback.type}`} role="alert">
          <span>{feedback.text}</span>
          <button aria-label="Fechar aviso" onClick={() => setFeedback(null)}>
            ×
          </button>
        </div>
      )}
      <section className="card">
        <div className="filters">
          <label>
            <span>Pesquisar</span>
            <input
              type="search"
              placeholder="Nome do aluno"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={ativo}
              onChange={(event) => {
                setAtivo(event.target.value);
                setPagination((old) => ({ ...old, page: 1 }));
              }}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </label>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>UUID</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Carregando...
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td data-label="Nome">{aluno.nomeCompleto}</td>
                    <td data-label="CPF">
                      <span className="cpf-value">{aluno.cpf || 'Não informado'}</span>
                    </td>
                    <td data-label="UUID">
                      <code className="uuid">{aluno.uuid}</code>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`status ${aluno.ativo ? "active" : "inactive"}`}
                        title={aluno.motivoDesativacao || undefined}
                      >
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td data-label="Cadastro">
                      {new Intl.DateTimeFormat("pt-BR").format(
                        new Date(aluno.createdAt),
                      )}
                    </td>
                    <td data-label="Ações" className="actions">
                      <button
                        className="text-button"
                        onClick={() => setEditing(aluno)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setHistoryAluno(aluno)}
                      >
                        Histórico
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setQrAluno(aluno)}
                      >
                        QR Code
                      </button>
                      <button
                        className="text-button danger"
                        onClick={() => setConfirmingDelete(aluno)}
                      >
                        Excluir
                      </button>
                      {aluno.ativo ? (
                        <button
                          className="text-button danger"
                          onClick={() => {
                            setConfirming(aluno);
                            setDeactivationReason("");
                            setDeactivationError("");
                          }}
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => changeStatus(aluno, true)}
                        >
                          Ativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>{pagination.total} registro(s)</span>
          <div>
            <button
              className="button button-secondary"
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                setPagination((old) => ({ ...old, page: old.page - 1 }))
              }
            >
              Anterior
            </button>
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              className="button button-secondary"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() =>
                setPagination((old) => ({ ...old, page: old.page + 1 }))
              }
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
      {editing !== undefined && (
        <AlunoFormModal
          aluno={editing}
          saving={saving}
          onSave={saveAluno}
          onClose={() => setEditing(undefined)}
        />
      )}
      {historyAluno && (
        <AlunoHistoryModal
          aluno={historyAluno}
          onClose={() => setHistoryAluno(null)}
        />
      )}
      {qrAluno && (
        <AlunoQrModal aluno={qrAluno} onClose={() => setQrAluno(null)} />
      )}
      {confirming && (
        <Modal
          title="Motivo da desativação"
          onClose={() => {
            setConfirming(null);
            setDeactivationReason("");
            setDeactivationError("");
          }}
        >
          <div className="deactivation-form">
            <p>
              Informe por que <strong>{confirming.nomeCompleto}</strong> será
              desativado.
            </p>
            <label htmlFor="deactivation-reason">Motivo da desativação</label>
            <textarea
              id="deactivation-reason"
              autoFocus
              required
              maxLength="1000"
              rows="5"
              value={deactivationReason}
              onChange={(event) => {
                setDeactivationReason(event.target.value);
                setDeactivationError("");
              }}
              placeholder="Ex.: Aluno não pertence mais à rota."
            />
            {deactivationError && (
              <div className="form-error" role="alert">
                {deactivationError}
              </div>
            )}
          </div>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              disabled={saving}
              onClick={() => {
                setConfirming(null);
                setDeactivationReason("");
                setDeactivationError("");
              }}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              disabled={saving || deactivationReason.trim().length < 3}
              onClick={() =>
                changeStatus(confirming, false, deactivationReason)
              }
            >
              {saving ? "Desativando..." : "Desativar aluno"}
            </button>
          </footer>
        </Modal>
      )}
      {confirmingDelete && (
        <Modal title="Excluir aluno" onClose={() => setConfirmingDelete(null)}>
          <p>
            Deseja excluir definitivamente{" "}
            <strong>{confirmingDelete.nomeCompleto}</strong>?
          </p>
          <p>
            Alunos com presenças ou ocorrências registradas não podem ser
            excluídos e devem ser desativados.
          </p>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setConfirmingDelete(null)}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              disabled={saving}
              onClick={deleteAluno}
            >
              {saving ? "Excluindo..." : "Excluir definitivamente"}
            </button>
          </footer>
        </Modal>
      )}
    </main>
  );
}
