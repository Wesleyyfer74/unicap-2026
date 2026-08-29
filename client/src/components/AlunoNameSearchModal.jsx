import { useEffect, useState } from 'react';
import Modal from './Modal';
import { chamadaService } from '../services/chamada.service';

export default function AlunoNameSearchModal({ chamadaId, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setItems([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const results = await chamadaService.searchStudents(chamadaId, { search: term, limit: 10 });
        if (active) setItems(results);
      } catch (requestError) {
        if (active) {
          setItems([]);
          setError(requestError.response?.data?.message || 'Não foi possível pesquisar os alunos.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [chamadaId, search]);

  return (
    <Modal title="Buscar aluno pelo nome" onClose={onClose}>
      <div className="student-name-search">
        <label>
          <span>Nome do aluno</span>
          <input
            autoFocus
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite pelo menos 2 letras"
            autoComplete="off"
          />
        </label>

        <div className="student-search-results" aria-live="polite">
          {search.trim().length < 2 && <p className="empty-inline">Digite o nome para pesquisar.</p>}
          {loading && <p className="empty-inline">Pesquisando...</p>}
          {error && <div className="feedback error">{error}</div>}
          {!loading && !error && search.trim().length >= 2 && items.length === 0 && (
            <p className="empty-inline">Nenhum aluno encontrado.</p>
          )}
          {!loading && items.length > 0 && (
            <ul>
              {items.map((aluno) => (
                <li key={aluno.id}>
                  <button type="button" disabled={aluno.jaRegistrado} onClick={() => onSelect(aluno)}>
                    <strong>{aluno.nomeCompleto}</strong>
                    <span className={aluno.jaRegistrado || !aluno.ativo ? 'student-result-warning' : ''}>
                      {aluno.jaRegistrado ? 'Já registrado' : aluno.ativo ? 'Selecionar aluno' : 'Aluno inativo'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <footer className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button>
      </footer>
    </Modal>
  );
}
