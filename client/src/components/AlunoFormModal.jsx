import { useEffect, useState } from "react";
import Modal from "./Modal";

export default function AlunoFormModal({ aluno, saving, onSave, onClose }) {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setNomeCompleto(aluno?.nomeCompleto || "");
    setCpf(aluno?.cpf || "");
  }, [aluno]);
  function changeCpf(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setCpf(
      digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
    );
  }
  function submit(event) {
    event.preventDefault();
    const value = nomeCompleto.trim();
    if (value.length < 2)
      return setError("Informe um nome com ao menos 2 caracteres.");
    if (cpf && cpf.replace(/\D/g, "").length !== 11)
      return setError("Informe um CPF válido.");
    setError("");
    return onSave({ nomeCompleto: value, cpf });
  }
  return (
    <Modal title={aluno ? "Editar aluno" : "Novo aluno"} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label htmlFor="student-name">Nome completo</label>
        <input
          id="student-name"
          autoFocus
          maxLength="191"
          value={nomeCompleto}
          onChange={(event) => setNomeCompleto(event.target.value)}
          required
        />
        <label htmlFor="student-cpf">CPF</label>
        <input
          id="student-cpf"
          inputMode="numeric"
          autoComplete="off"
          maxLength="14"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(event) => changeCpf(event.target.value)}
        />
        {aluno && <p className="field-help">O UUID não pode ser alterado. Se este CPF estiver apenas em um cadastro arquivado, ele será liberado para este aluno.</p>}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <footer>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="button button-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
