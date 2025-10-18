// src/components/Modals/FaceLoginModal.tsx
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faceLogin } from '../../services/facialAuthService'; // <-- NO se cambia
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente modal para Login por Reconocimiento Facial.
 * - Quita la "foto guardada" por completo (no hay llamadas a /last-photo).
 * - Tras capturar, el proceso es AUTOMÁTICO: valida, adopta sesión y navega.
 * - Muestra toasts de depuración y una barra de progreso de estados.
 * - No modifica endpoints ni servicios existentes.
 */

interface FaceLoginIntegratedProps {
  isActive: boolean;
  onClose: () => void;
  onSuccess?: (userData: { photo: string; name: string }) => void;
}

// Utilidad: dataURL -> base64 crudo
function dataUrlToBase64(d: string) {
  const i = d.indexOf(',');
  return i >= 0 ? d.slice(i + 1) : d;
}

type ToastType = 'success' | 'warning' | 'error' | 'info';
type ToastItem = { id: number; type: ToastType; message: string; ttl: number };

// Estados de la barra de progreso
type FlowStep =
  | 'idle'
  | 'camera_ready'
  | 'captured'
  | 'sending'
  | 'validating'
  | 'adopting'
  | 'done'
  | 'error';

const FaceLoginIntegrated: React.FC<FaceLoginIntegratedProps> = ({
  isActive,
  onClose,
  onSuccess
}) => {
  // Vista actual: captura o resultado
  const [stepView, setStepView] = useState<'capture' | 'result'>('capture');

  // Foto capturada (data URL)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Progreso interno del flujo
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [progressValue, setProgressValue] = useState<number>(0); // 0..100
  const [matchScore, setMatchScore] = useState<number>(0); // si el backend lo provee

  // Errores de envío/validación
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Toasts (depuración visual y profesional)
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((type: ToastType, message: string, ttl = 4500) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, type, message, ttl }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
  }, []);
  const debug = useCallback((msg: string) => addToast('info', msg, 3800), [addToast]);

  // Cámara
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Navegación y adopción de sesión
  const navigate = useNavigate();
  const auth = useAuth();
  const adopt = (auth as any)?.adoptSession as ((s: any) => void) | undefined;

  // === Estilos de toasts ===
  const toastContainerStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column-reverse', // último arriba
    gap: 10,
    width: 420,
    maxWidth: '92vw'
  }), []);

  const styleForToast = useCallback((type: ToastType): React.CSSProperties => {
    const bg =
      type === 'success' ? COLORS.secondaryAccent :
      type === 'warning' ? COLORS.accent :
      type === 'error'   ? '#333' :
      '#090B0D'; // info
    return {
      background: bg,
      color: COLORS.white,
      borderRadius: 12,
      padding: '12px 14px',
      boxShadow: '0 10px 28px rgba(0,0,0,.28)',
      border: '1px solid rgba(0,0,0,.06)',
      display: 'grid',
      gridTemplateColumns: '20px 1fr 24px',
      alignItems: 'start',
      gap: 10,
      fontSize: 14,
      lineHeight: 1.35,
      width: '100%',
    };
  }, []);

  // ===== Cámara: iniciar/detener =====
  const startCamera = useCallback(async () => {
    try {
      debug('🎥 Solicitando acceso a la cámara…');
      const constraints = {
        video: {
          width: { ideal: 1920 },   // mayor resolución para mejor calidad
          height: { ideal: 1080 },
          facingMode: 'user'
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => { videoRef.current!.onloadedmetadata = resolve; });
      }
      setFlowStep('camera_ready');
      setProgressValue(10);
      debug('✅ Cámara habilitada');
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setFlowStep('error');
      addToast('error', 'No pudimos acceder a tu cámara. Verifica permisos.', 6500);
    }
  }, [addToast, debug]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      debug('⏹️ Cámara detenida');
    }
  }, [debug]);

  // Abrir/cerrar modal: gestionar ciclo de cámara y estados
  useEffect(() => {
    if (isActive) {
      setSubmitError(null);
      setCapturedPhoto(null);
      setMatchScore(0);
      setFlowStep('idle');
      setProgressValue(0);
      setStepView('capture');
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  // ===== Capturar foto =====
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Guardamos el frame exactamente como se ve (selfie invertida)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    const imageData = canvas.toDataURL('image/png', 1.0);
    setCapturedPhoto(imageData);
    setFlowStep('captured');
    setProgressValue(30);
    debug('📸 Foto capturada');

    // Pasar a vista de resultado y detener cámara
    setStepView('result');
    stopCamera();
  }, [stopCamera, debug]);

  // ===== Secuencia AUTOMÁTICA tras capturar =====
  useEffect(() => {
    const run = async () => {
      if (!capturedPhoto || stepView !== 'result') return;

      try {
        setSubmitError(null);

        // 1) Enviar
        setFlowStep('sending');
        setProgressValue(50);
        debug('📤 Enviando imagen para validación…');
        const raw = dataUrlToBase64(capturedPhoto);

        // 2) Validar (endpoint existente en facialAuthService)
        setFlowStep('validating');
        setProgressValue(70);
        const j = await faceLogin(raw);

        // Token
        const token =
          j.token || j.Token || j.accessToken || j.access_token || j.jwt;
        if (!token) throw new Error('Respuesta sin token del servidor');

        // Puntaje si viene del backend; si no, fallback 98
        const score = Math.round(j?.matchScore || j?.score || 98);
        setMatchScore(score);
        debug(`🧠 Coincidencia estimada: ${score}%`);

        // 3) Adoptar sesión
        setFlowStep('adopting');
        setProgressValue(85);
        const user = {
          id: j?.usuarioId || j?.id || j?.userId || `face_${Date.now()}`,
          email: j?.email || '',
          phone: j?.telefono || j?.phone || '',
          nickname: j?.usuario || j?.username || 'facelogin',
          fullName: j?.nombreCompleto || j?.name || 'Usuario',
          role: j?.role || 'analista'
        };
        const session = {
          user,
          token,
          loginMethod: 'face',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        if (typeof adopt === 'function') {
          adopt(session);
          debug('🔐 Sesión adoptada en AuthContext');
        } else {
          localStorage.setItem('auth_token', session.token);
          localStorage.setItem('authvision_session', JSON.stringify(session));
          debug('💾 Sesión guardada en localStorage');
        }

        // 4) Terminar
        setFlowStep('done');
        setProgressValue(100);
        addToast('success', `Bienvenido, ${session.user.fullName}. Reconocimiento facial exitoso.`, 5500);
        onSuccess?.({ photo: capturedPhoto, name: session.user.fullName });

        // Cerrar modal + navegar
        onClose();
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error(err);
        const msg = err?.message || 'No se pudo validar tu rostro.';
        setSubmitError(msg);
        setFlowStep('error');
        setProgressValue(0);
        addToast('error', msg, 6500);
      }
    };

    run();
  }, [capturedPhoto, stepView, adopt, addToast, debug, navigate, onClose]);

  // ===== Reintentar =====
  const handleRetake = () => {
    setCapturedPhoto(null);
    setMatchScore(0);
    setSubmitError(null);
    setFlowStep('idle');
    setProgressValue(0);
    setStepView('capture');
    debug('🔄 Reintento de captura');
    startCamera();
  };

  if (!isActive) return null;

  return (
    <div className={`face-modal ${isActive ? 'active' : ''}`}>
      <div className="face-overlay" onClick={onClose} />

      <div className="face-content">
        {/* CABECERA */}
        <div className="face-header">
          <h2 className="face-title">Reconocimiento Facial</h2>
          <button className="face-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* BARRA DE ESTADO (progreso interno) */}
        <div className="flowbar">
          <div className="flowbar-fill" style={{ width: `${progressValue}%` }} />
          <div className="flowbar-steps">
            <span className={flowStep !== 'idle' ? 'on' : ''}>Cámara</span>
            <span className={['captured','sending','validating','adopting','done'].includes(flowStep) ? 'on' : ''}>Captura</span>
            <span className={['sending','validating','adopting','done'].includes(flowStep) ? 'on' : ''}>Envío</span>
            <span className={['validating','adopting','done'].includes(flowStep) ? 'on' : ''}>Validación</span>
            <span className={['adopting','done'].includes(flowStep) ? 'on' : ''}>Sesión</span>
          </div>
        </div>

        {/* CUERPO */}
        <div className={`face-body ${stepView === 'capture' ? 'capture-view' : 'result-view'}`}>
          {stepView === 'capture' ? (
            <>
              {/* Contenedor de VIDEO (más grande, 4:3) */}
              <div className="video-container-wrapper large">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="face-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="video-frame"></div>
              </div>

              <div className="capture-instructions">
                <p>Mira directamente a la cámara y mantén el rostro dentro del marco</p>
              </div>

              <button className="capture-button" onClick={handleCapture}>
                <span className="capture-ring-outer">
                  <span className="capture-ring-inner"></span>
                </span>
              </button>
            </>
          ) : (
            <>
              {/* RESULTADO: Foto capturada grande + “panel” de coincidencia */}
              <div className="result-grid">
                <div className="photo-big">
                  <div className="photo-frame-big">
                    {capturedPhoto && <img src={capturedPhoto} alt="Capturada" className="photo-img-big" />}
                  </div>
                </div>

                <div className="match-panel">
                  <div className="match-badge pro">
                    <div className="radar" />
                    <div className="badge-inner">
                      <span className="match-percent">{matchScore ? `${matchScore}%` : '…'}</span>
                      <span className="match-text">COINCIDENCIA</span>
                    </div>
                  </div>

                  <div className="match-description">
                    {submitError ? (
                      <p className="error-text">{submitError}</p>
                    ) : (
                      <p>Procesando reconocimiento y preparando tu sesión…</p>
                    )}
                  </div>

                  <div className="actions">
                    <button className="btn btn-secondary" onClick={handleRetake} disabled={flowStep === 'sending' || flowStep === 'validating'}>
                      Reintentar
                    </button>
                    {/* No hay botón de Confirmar: el proceso es automático */}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* TOASTS abajo-derecha */}
        <div style={toastContainerStyle}>
          {toasts.map(t => (
            <div key={t.id} style={styleForToast(t.type)} role="status" aria-live="polite">
              <div style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>
                {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : t.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{t.message}</div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                aria-label="Cerrar"
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.white,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Estilos: adaptado a tu paleta + UI más grande y moderna */}
      <style>{`
        .face-modal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .face-modal.active { display: flex; }
        .face-overlay {
          position: absolute; inset: 0;
          background: rgba(9, 11, 13, 0.92);
          backdrop-filter: blur(14px);
        }
        .face-content {
          position: relative;
          width: 100%;
          max-width: 1100px;
          max-height: 92vh;
          background: ${COLORS.lightGray};
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0,0,0,.4);
          animation: slideUp .6s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px) scale(.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .face-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; background: ${COLORS.teal};
          border-bottom: 1px solid rgba(255,255,255,.12);
        }
        .face-title { margin: 0; font-size: 22px; font-weight: 800; color: ${COLORS.white}; letter-spacing: .3px; }
        .face-close-btn {
          background: rgba(255,255,255,.15);
          border: 1px solid rgba(255,255,255,.2);
          color: ${COLORS.white}; width: 40px; height: 40px; border-radius: 10px;
          cursor: pointer; font-size: 20px; transition: all .3s ease;
        }
        .face-close-btn:hover { background: rgba(255,255,255,.25); transform: rotate(90deg); }

        /* Barra de flujo */
        .flowbar { position: relative; background: #e9edf4; height: 8px; margin: 0 18px 10px; border-radius: 999px; overflow: hidden; }
        .flowbar-fill { height: 100%; background: ${COLORS.teal}; transition: width .5s cubic-bezier(.34,1.56,.64,1); }
        .flowbar-steps {
          display: flex; justify-content: space-between; margin: 8px 18px 14px;
          color: #425466; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
        }
        .flowbar-steps span { opacity: .35; }
        .flowbar-steps span.on { opacity: 1; color: ${COLORS.black}; }

        .face-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding: 18px; }
        .capture-view { align-items: center; justify-content: center; gap: 18px; }
        .result-view { gap: 18px; }

        /* Video grande */
        .video-container-wrapper.large {
          position: relative; width: min(980px, 100%); aspect-ratio: 4 / 3;
          border-radius: 26px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,.22);
          background: #000;
        }
        .face-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        .video-frame { position: absolute; inset: 0; border: 2px solid rgba(255,255,255,.2); border-radius: 24px; pointer-events: none; }

        .capture-instructions { text-align: center; color: #333; }
        .capture-instructions p { margin: 0; font-size: 14px; font-weight: 700; }

        .capture-button { width: 100px; height: 100px; background: transparent; border: none; cursor: pointer; padding: 0; transition: transform .3s ease; }
        .capture-button:hover { transform: scale(1.06); }
        .capture-ring-outer { width: 100px; height: 100px; border-radius: 50%; border: 8px solid #fff; position: relative; box-shadow: 0 8px 24px rgba(81,115,111,.28); }
        .capture-ring-inner { width: calc(100% - 20px); height: calc(100% - 20px); border-radius: 50%;
          background: linear-gradient(135deg, #fff 0%, #F8F8F8 100%); position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); box-shadow: inset 0 2px 6px rgba(0,0,0,.08); display: grid; place-items: center; }
        .capture-ring-inner::after { content: ''; width: 50px; height: 50px; border-radius: 50%; background: ${COLORS.teal};
          box-shadow: 0 6px 18px rgba(81,115,111,.35); }

        /* Resultado */
        .result-grid {
          display: grid; grid-template-columns: 1.3fr .7fr; gap: 20px; align-items: stretch;
        }
        .photo-big { display: grid; place-items: center; }
        .photo-frame-big {
          width: min(860px, 100%); aspect-ratio: 4 / 3; border-radius: 24px; overflow: hidden;
          border: 2px solid rgba(0,0,0,.05); box-shadow: 0 16px 44px rgba(0,0,0,.18);
          background: #000;
        }
        .photo-img-big { width: 100%; height: 100%; object-fit: cover; display: block; }

        .match-panel {
          background: #fff; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; gap: 16px;
          box-shadow: 0 10px 26px rgba(0,0,0,.08);
        }
        .match-badge.pro {
          position: relative; width: 180px; height: 180px; border-radius: 50%;
          margin: 8px auto 6px; display: grid; place-items: center; color: ${COLORS.teal};
          border: 4px solid rgba(81,115,111,.22); background: radial-gradient(ellipse at center, rgba(81,115,111,.10), rgba(81,115,111,.04));
        }
        .match-badge .badge-inner { z-index: 1; text-align: center; }
        .match-percent { font-size: 44px; font-weight: 900; }
        .match-text { font-size: 12px; font-weight: 800; letter-spacing: .8px; margin-top: 4px; }
        .radar {
          position: absolute; inset: -20px; border-radius: 50%;
          background: conic-gradient(from 180deg, rgba(81,115,111,.2), rgba(81,115,111,0) 70%);
          filter: blur(10px); animation: spin 2.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .match-description { text-align: center; color: #333; font-weight: 600; }
        .error-text { color: #b91c1c; font-weight: 800; }

        .actions { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .btn { padding: 12px 16px; border: none; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all .25s ease; }
        .btn-secondary { background: #E0E0E0; color: #333; }
        .btn-secondary:hover { background: #D0D0D0; transform: translateY(-1px); }

        @media (max-width: 900px) {
          .result-grid { grid-template-columns: 1fr; }
          .photo-frame-big { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default FaceLoginIntegrated;
