import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import ChamadaPresencasModal from "../../components/ChamadaPresencasModal";
import AlunoNameSearchModal from "../../components/AlunoNameSearchModal";
import { chamadaService } from "../../services/chamada.service";

const labels = {
  MATUTINO: "Matutino",
  INTEGRAL: "Integral",
  NOTURNO: "Noturno",
  ABERTA: "Aberta",
  FINALIZADA: "Finalizada",
};

export default function ChamadaScannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const readingLockRef = useRef(false);
  const lastReadRef = useRef({ value: "", at: 0 });
  const mountedRef = useRef(true);
  const [chamada, setChamada] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");
  const [cameraRunning, setCameraRunning] = useState(false);
  const [cameraMessage, setCameraMessage] = useState(
    "Toque em “Iniciar câmera” para começar.",
  );
  const [aluno, setAluno] = useState(null);
  const [blockedAluno, setBlockedAluno] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPresence, setConfirmingPresence] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [recentPresences, setRecentPresences] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [showNameSearch, setShowNameSearch] = useState(false);
  const [askTrip, setAskTrip] = useState(false);

  const releaseReadLock = useCallback(() => {
    setTimeout(() => {
      readingLockRef.current = false;
    }, 900);
  }, []);

  const handleDetection = useCallback(
    async (rawValue) => {
      const uuid = rawValue.trim();
      const now = Date.now();
      if (
        readingLockRef.current ||
        (lastReadRef.current.value === uuid &&
          now - lastReadRef.current.at < 2500)
      )
        return;
      readingLockRef.current = true;
      lastReadRef.current = { value: uuid, at: now };
      setCameraMessage("Verificando aluno...");
      try {
        const identified = await chamadaService.identifyStudent(id, uuid);
        if (!mountedRef.current) return;
        setAluno(identified);
        setCameraMessage("Aluno encontrado. Confirme a presença.");
      } catch (error) {
        if (!mountedRef.current) return;
        if (error.response?.data?.code === "ALUNO_INATIVO") {
          setBlockedAluno({
            ...error.response.data.aluno,
            motivoInativacao: error.response.data.motivo,
          });
          setFeedback(null);
          setCameraMessage(
            "Aluno não autorizado. Feche o aviso para continuar.",
          );
          return;
        }
        setFeedback({
          type: "error",
          text:
            error.response?.data?.message ||
            "QR Code inválido ou aluno não encontrado.",
        });
        setCameraMessage("Aponte a câmera para o próximo QR Code.");
        releaseReadLock();
      }
    },
    [id, releaseReadLock],
  );

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setCameraRunning(false);
    setCameraMessage("Câmera parada.");
  }, []);

  const startCamera = useCallback(
    async (selectedId = cameraId) => {
      if (!videoRef.current || chamada?.status !== "ABERTA") return;
      stopCamera();
      setFeedback(null);
      setCameraMessage("Solicitando acesso à câmera...");
      try {
        const reader = readerRef.current || new BrowserQRCodeReader();
        readerRef.current = reader;
        const onResult = (result) => {
          if (result) handleDetection(result.getText());
        };
        controlsRef.current = selectedId
          ? await reader.decodeFromVideoDevice(
              selectedId,
              videoRef.current,
              onResult,
            )
          : await reader.decodeFromConstraints(
              { video: { facingMode: { ideal: "environment" } }, audio: false },
              videoRef.current,
              onResult,
            );
        if (!mountedRef.current) return controlsRef.current?.stop();
        setCameraRunning(true);
        setCameraMessage("Aponte a câmera para o QR Code do aluno.");
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        setCameras(devices);
        const activeTrack = videoRef.current.srcObject?.getVideoTracks?.()[0];
        const activeId = activeTrack?.getSettings?.().deviceId;
        if (activeId) setCameraId(activeId);
      } catch (error) {
        setCameraRunning(false);
        const denied = error?.name === "NotAllowedError";
        setCameraMessage(
          denied
            ? "Permissão da câmera negada. Autorize o acesso no navegador."
            : "Não foi possível iniciar a câmera. Verifique se ela está disponível.",
        );
      }
    },
    [cameraId, chamada?.status, handleDetection, stopCamera],
  );

  useEffect(() => {
    mountedRef.current = true;
    Promise.all([
      chamadaService.get(id),
      chamadaService.listPresences(id, { page: 1, limit: 5 }),
    ])
      .then(([call, presences]) => {
        setChamada(call);
        setRecentPresences(presences.items);
      })
      .catch((error) =>
        setFeedback({
          type: "error",
          text:
            error.response?.data?.message ||
            "Não foi possível carregar a chamada.",
        }),
      )
      .finally(() => setLoading(false));
    return () => {
      mountedRef.current = false;
      controlsRef.current?.stop();
      if (videoRef.current?.srcObject)
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    };
  }, [id]);

  async function confirmPresence() {
    setConfirmingPresence(true);
    try {
      const result = await chamadaService.addPresence(id, aluno.uuid);
      setChamada((old) => ({
        ...old,
        _count: { presencas: old._count.presencas + 1 },
      }));
      setRecentPresences((old) =>
        [{ ...result.presenca, aluno: result.aluno }, ...old].slice(0, 5),
      );
      setFeedback({ type: "success", text: "Presença registrada" });
      setAluno(null);
      setCameraMessage("Aponte a câmera para o próximo QR Code.");
      releaseReadLock();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message ||
          "Não foi possível registrar a presença.",
      });
      setAluno(null);
      setCameraMessage("Aponte a câmera para o próximo QR Code.");
      releaseReadLock();
    } finally {
      setConfirmingPresence(false);
    }
  }

  function cancelPresence() {
    setAluno(null);
    setCameraMessage("Aponte a câmera para o próximo QR Code.");
    releaseReadLock();
  }

  function closeBlockedStudent() {
    setBlockedAluno(null);
    setCameraMessage("Aponte a câmera para o próximo QR Code.");
    releaseReadLock();
  }

  function openNameSearch() {
    readingLockRef.current = true;
    setFeedback(null);
    setShowNameSearch(true);
    setCameraMessage("Busca por nome aberta.");
  }

  function closeNameSearch() {
    setShowNameSearch(false);
    setCameraMessage("Aponte a câmera para o próximo QR Code.");
    releaseReadLock();
  }

  function selectStudentByName(selectedAluno) {
    setShowNameSearch(false);
    if (!selectedAluno.ativo) {
      setBlockedAluno(selectedAluno);
      setCameraMessage("Aluno não autorizado. Feche o aviso para continuar.");
      return;
    }
    setAluno(selectedAluno);
    setCameraMessage("Aluno encontrado pelo nome. Confirme a presença.");
  }

  function handleRemoved(presenceId) {
    setRecentPresences((old) =>
      old.filter((presence) => presence.id !== presenceId),
    );
    setChamada((old) => ({
      ...old,
      _count: { presencas: Math.max(0, old._count.presencas - 1) },
    }));
    setFeedback({ type: "success", text: "Presença removida com sucesso." });
  }

  async function finish() {
    setFinishing(true);
    try {
      stopCamera();
      const finalized = await chamadaService.finish(id);
      setChamada(finalized);
      setConfirmingFinish(false);
      setFeedback({ type: "success", text: "Chamada finalizada com sucesso." });
      setAskTrip(true);
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message ||
          "Não foi possível finalizar a chamada.",
      });
      setConfirmingFinish(false);
    } finally {
      setFinishing(false);
    }
  }

  if (loading)
    return (
      <main className="centered-page">
        <p>Carregando chamada...</p>
      </main>
    );
  if (!chamada)
    return (
      <main className="app-content">
        <div className="feedback error">{feedback?.text}</div>
        <Link to="/admin/chamadas">Voltar</Link>
      </main>
    );

  return (
    <main className="scanner-page">
      <header className="scanner-top">
        <div>
          <Link to="/admin/chamadas" className="back-link">
            ← Chamadas
          </Link>
          <h1>Chamada #{chamada.id}</h1>
          <p>
            {chamada.fiscal.nome} · {labels[chamada.turno]}
          </p>
        </div>
        <div className="scanner-count">
          <strong>{chamada._count.presencas}</strong>
          <span>presenças</span>
        </div>
      </header>
      {feedback && (
        <div className={`feedback ${feedback.type}`} role="alert">
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}
      <section className="scanner-panel">
        <div className={`video-frame ${cameraRunning ? "running" : ""}`}>
          <video ref={videoRef} muted playsInline />
          <div className="scan-guide" aria-hidden="true" />
          <span className="camera-status">{cameraMessage}</span>
        </div>
        {cameras.length > 1 && (
          <label className="camera-select">
            <span>Câmera</span>
            <select
              value={cameraId}
              onChange={(event) => {
                const nextId = event.target.value;
                setCameraId(nextId);
                if (cameraRunning) startCamera(nextId);
              }}
            >
              {cameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Câmera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="scanner-actions">
          {cameraRunning ? (
            <button className="button button-secondary" onClick={stopCamera}>
              Parar câmera
            </button>
          ) : (
            <button
              className="button button-primary"
              disabled={chamada.status !== "ABERTA"}
              onClick={() => startCamera()}
            >
              Iniciar câmera
            </button>
          )}
          <button
            className="button button-secondary manual-presence-button"
            disabled={chamada.status !== "ABERTA"}
            onClick={openNameSearch}
          >
            Buscar aluno pelo nome
          </button>
          <button
            className="button button-danger finish-call-button"
            disabled={chamada.status !== "ABERTA"}
            onClick={() => setConfirmingFinish(true)}
          >
            Finalizar Chamada
          </button>
        </div>
      </section>
      <section className="recent-presences">
        <header>
          <div>
            <h2>Últimos registrados</h2>
            <span>{chamada._count.presencas} no total</span>
          </div>
          <button className="text-button" onClick={() => setShowAll(true)}>
            Ver todos
          </button>
        </header>
        {recentPresences.length === 0 ? (
          <p className="empty-inline">Nenhum aluno registrado.</p>
        ) : (
          <ol>
            {recentPresences.map((presence) => (
              <li key={presence.id}>
                <div>
                  <strong>{presence.aluno.nomeCompleto}</strong>
                  <span>Registrado</span>
                </div>
                <time>
                  {new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(presence.registradoEm))}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
      {showAll && (
        <ChamadaPresencasModal
          chamada={chamada}
          onClose={() => setShowAll(false)}
          onRemoved={handleRemoved}
        />
      )}
      {showNameSearch && (
        <AlunoNameSearchModal
          chamadaId={id}
          onClose={closeNameSearch}
          onSelect={selectStudentByName}
        />
      )}
      {blockedAluno && (
        <Modal title="ALUNO NÃO AUTORIZADO" onClose={closeBlockedStudent}>
          <div className="blocked-student" role="alert">
            <span>Nome</span>
            <strong>{blockedAluno.nomeCompleto}</strong>
            <span>Motivo</span>
            <p>{blockedAluno.motivoInativacao}</p>
          </div>
          <footer className="modal-actions">
            <button
              autoFocus
              className="button button-primary"
              onClick={closeBlockedStudent}
            >
              Fechar
            </button>
          </footer>
        </Modal>
      )}
      {aluno && (
        <Modal title="Aluno encontrado" onClose={cancelPresence}>
          <div className="student-confirm">
            <strong>{aluno.nomeCompleto}</strong>
            <p>Confirmar presença nesta chamada?</p>
          </div>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              disabled={confirmingPresence}
              onClick={cancelPresence}
            >
              Cancelar
            </button>
            <button
              className="button button-primary"
              disabled={confirmingPresence}
              onClick={confirmPresence}
            >
              {confirmingPresence ? "Confirmando..." : "Confirmar"}
            </button>
          </footer>
        </Modal>
      )}
      {confirmingFinish && (
        <Modal
          title="Finalizar Chamada"
          onClose={() => setConfirmingFinish(false)}
        >
          <p>
            <strong>Deseja realmente finalizar esta chamada?</strong>
          </p>
          <p>Novos alunos não poderão ser adicionados posteriormente.</p>
          <footer className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setConfirmingFinish(false)}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              disabled={finishing}
              onClick={finish}
            >
              {finishing ? "Finalizando..." : "Finalizar Chamada"}
            </button>
          </footer>
        </Modal>
      )}
      {askTrip && (
        <Modal
          title="Chamada finalizada com sucesso"
          onClose={() => navigate(`/admin/chamadas/${id}`)}
        >
          <p>Deseja preencher o formulário do motorista?</p>
          <footer className="modal-actions trip-choice">
            <button
              className="button button-secondary"
              onClick={() => navigate(`/admin/chamadas/${id}`)}
            >
              Agora não
            </button>
            <button
              className="button button-primary"
              onClick={() => navigate(`/admin/chamadas/${id}/viagem`)}
            >
              Preencher formulário
            </button>
          </footer>
        </Modal>
      )}
    </main>
  );
}
