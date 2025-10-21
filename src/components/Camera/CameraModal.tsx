// src/components/Camera/CameraModal.tsx
// ============================================================================
// MODAL DE CÁMARA + EDICIÓN
// - Captura de cámara y segmentación (backend).
// - Edición: filtros (brillo/contraste/B&N/sepia/vintage), emojis (opcional),
//   y AHORA stickers PNG desde /public/stickers con limpieza de fondo,
//   auto-colocación y escalado por defecto + ajuste manual.
// - Guardado parcial: localStorage.pendingFaceB64 (segmentado crudo) y opción
//   de exportar versión editada para el carnet (PNG).
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { segmentFace } from '../../services/facialAuthService';
import { dataUrlToBase64 } from '../../hooks/useCamera';
import { loadStickerWithoutBG } from '../../utils/stripBackground';

// ----------------------------------
// Tipos locales (no rompemos contratos)
// ----------------------------------
interface PlacedEmoji {
  emoji: string;
  x: number;
  y: number;
  size: number;
}

type Step = 'camera' | 'confirm' | 'edit';

type StickerId = 'bunny-ears' | 'cat-whiskers' | 'dog-nose';

interface StickerSpec {
  id: StickerId;
  name: string;
  src: string; // /stickers/*.png
  // heurística de colocación por defecto (proporciones del canvas)
  anchor:
    | 'forehead' // arriba-centro (orejas)
    | 'nose' // centro/ligeramente abajo
    | 'cheeks'; // centro horizontal (bigotes)
  baseScale: number; // escala base respecto al ancho del canvas
  yOffset: number; // desplazamiento vertical relativo al alto del canvas
  xOffset?: number; // desplazamiento horizontal relativo al ancho del canvas
  maxWidthRatio?: number; // límite de ancho relativo
}

// catálogo minimal (usa tus archivos en /public/stickers)
const STICKERS: readonly StickerSpec[] = [
  {
    id: 'bunny-ears',
    name: 'Orejas de conejo',
    src: '/stickers/bunny-ears.png',
    anchor: 'forehead',
    baseScale: 0.9, // ancho ~90% del ancho del rostro/canvas
    yOffset: -0.22, // sube un poco
    maxWidthRatio: 1.2,
  },
  {
    id: 'cat-whiskers',
    name: 'Bigotes de gato',
    src: '/stickers/cat-whiskers.png',
    anchor: 'cheeks',
    baseScale: 0.65,
    yOffset: 0.02,
    maxWidthRatio: 3.2,
  },
  {
    id: 'dog-nose',
    name: 'Nariz de perro',
    src: '/stickers/dog-nose.png',
    anchor: 'nose',
    baseScale: 0.33,
    yOffset: 0.06,
    maxWidthRatio: 2.6,
  },
];

interface CameraModalProps {
  isActive: boolean;
  onClose: () => void;
  onCapture: (photoData: string) => void; // se mantiene para compatibilidad
  title: string;
  showFilters?: boolean;
  showEmojis?: boolean;
  // NUEVO: además de pendingFaceB64 (segmentado), puedes guardar
  // una versión con efectos para carnet (PNG): pendingCardFaceB64
  useEffectsInCardDefault?: boolean;
}

// Estado del sticker actual en el canvas
interface StickerState {
  spec: StickerSpec;
  // ancho/alto calculados en píxeles del canvas (derivado de scaleFactor)
  w: number;
  h: number;
  // posición del rectángulo que se dibuja (superior-izquierda)
  x: number;
  y: number;
  // multiplicador relativo al baseScale (1 = base)
  scaleFactor: number;
}

const CameraModal: React.FC<CameraModalProps> = ({
  isActive,
  onClose,
  onCapture,
  title,
  showFilters = true,
  showEmojis = true,
  useEffectsInCardDefault = true,
}) => {
  // -------------------------------
  // STATE: UI/Imagen/Edición
  // -------------------------------
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // dataURL actual visible (segmentada)
  const [segmentedB64, setSegmentedB64] = useState<string | null>(null); // base64 segmentado crudo (sin prefijo)
  const [appliedEmojis, setAppliedEmojis] = useState<PlacedEmoji[]>([]);
  const [currentFilter, setCurrentFilter] = useState<'normal' | 'vintage' | 'bw' | 'sepia'>('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [useEffectsInCard, setUseEffectsInCard] = useState(useEffectsInCardDefault);

  // Stickers
  const [selectedSticker, setSelectedSticker] = useState<StickerState | null>(null);
  const stickerCacheRef = useRef<Record<string, HTMLCanvasElement>>({}); // src → canvas “curado”
  const [draggingSticker, setDraggingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  // -------------------------------
  // STATE: Proceso/Errores/Flujo
  // -------------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [segMsg, setSegMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingEmoji, setIsDraggingEmoji] = useState(false);
  const [draggedEmojiIndex, setDraggedEmojiIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('camera');
  const [sliderValue, setSliderValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // -------------------------------
  // REFS: cámara/canvas/stream
  // -------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // captura desde video
  const editCanvasRef = useRef<HTMLCanvasElement>(null); // edición con filtros/emojis/stickers
  const streamRef = useRef<MediaStream | null>(null);

  // ============================================================
  // CÁMARA: start/stop
  // ============================================================
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      console.error('Error accessing camera:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (isActive && currentStep === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isActive, currentStep, startCamera, stopCamera]);

  // ============================================================
  // CAPTURA: de video → canvas → segmentación backend
  // ============================================================
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setSegMsg('Segmentando rostro…');
    setSegmentedB64(null);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsLoading(false);
      setSegMsg(null);
      setError('No se pudo acceder al contexto del canvas');
      return;
    }

    // espejo horizontal (coincide con preview)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    try {
      const raw = dataUrlToBase64(imageDataUrl);
      const seg = await segmentFace(raw); // base64 sin prefijo
      setSegmentedB64(seg);

      const segDataUrl = `data:image/jpeg;base64,${seg}`;
      setCapturedImage(segDataUrl);
      setCurrentStep('confirm');
      setSliderValue(0);
      setSegMsg('Segmentación OK.');
      stopCamera();
    } catch (e: any) {
      console.error('Error segmentando:', e);
      setError(e?.message || 'Error al segmentar el rostro');
      setSegMsg(null);
    } finally {
      setIsLoading(false);
    }
  }, [stopCamera]);

  // ============================================================
  // Slider confirmación → paso a edición
  // ============================================================
  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value >= 80) setCurrentStep('edit');
  };

  // ============================================================
  // Reset/Retake
  // ============================================================
  const baseReset = () => {
    setCapturedImage(null);
    setSegmentedB64(null);
    setAppliedEmojis([]);
    setCurrentFilter('normal');
    setBrightness(100);
    setContrast(100);
    setSliderValue(0);
    setSegMsg(null);
    setError(null);
    setSelectedSticker(null);
  };

  const handleRejectPhoto = () => {
    baseReset();
    setCurrentStep('camera');
    startCamera();
  };
  const handleRetake = () => {
    baseReset();
    setCurrentStep('camera');
    startCamera();
  };

  // ============================================================
  // Stickers: carga sin fondo + auto colocación/tamaño
  // ============================================================
  async function ensureStickerReady(src: string) {
    if (!stickerCacheRef.current[src]) {
      // limpia checkerboard si lo hubiera y preserva colores
      stickerCacheRef.current[src] = await loadStickerWithoutBG(src, 26);
    }
  }

  // Heurística simple de “rostro” basada en la imagen segmentada:
  // usamos el canvas completo, que suele ser rostro centrado.
  function computeStickerRect(
    spec: StickerSpec,
    canvasW: number,
    canvasH: number,
    scaleFactor: number,
  ) {
    const maxW = (spec.maxWidthRatio ?? 1) * canvasW;
    const targetW = Math.min(canvasW * (spec.baseScale * scaleFactor), maxW);
    // mantener proporción original de la imagen del sticker
    const stickerCanvas = stickerCacheRef.current[spec.src];
    const ratio = stickerCanvas ? stickerCanvas.height / stickerCanvas.width : 1;
    const targetH = targetW * ratio;

    let cx = canvasW / 2 + (spec.xOffset ?? 0) * canvasW;
    let cy = canvasH / 2 + spec.yOffset * canvasH;

    if (spec.anchor === 'forehead') cy = canvasH * (0.28 + spec.yOffset); // un poco más arriba
    if (spec.anchor === 'nose') cy = canvasH * (0.52 + spec.yOffset);
    if (spec.anchor === 'cheeks') cy = canvasH * (0.50 + spec.yOffset);

    const x = cx - targetW / 2;
    const y = cy - targetH / 2;

    return { x, y, w: targetW, h: targetH };
  }

  async function handleSelectSticker(spec: StickerSpec) {
    await ensureStickerReady(spec.src);
    // escala inicial más “grande” por defecto (user request)
    const initialScale = 1.25; // 25% más grande que base
    const canvas = editCanvasRef.current;
    if (!canvas) {
      setSelectedSticker({
        spec,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        scaleFactor: initialScale,
      });
      return;
    }
    const rect = computeStickerRect(spec, canvas.width, canvas.height, initialScale);
    setSelectedSticker({
      spec,
      ...rect,
      scaleFactor: initialScale,
    });
    // redibuja
    redrawEditCanvas();
  }

  function adjustStickerScale(delta: number) {
    if (!selectedSticker || !editCanvasRef.current) return;
    const nextScale = Math.max(0.4, Math.min(3, selectedSticker.scaleFactor + delta));
    const rect = computeStickerRect(
      selectedSticker.spec,
      editCanvasRef.current.width,
      editCanvasRef.current.height,
      nextScale,
    );
    setSelectedSticker({
      spec: selectedSticker.spec,
      scaleFactor: nextScale,
      ...rect,
    });
  }

  function removeSticker() {
    setSelectedSticker(null);
    redrawEditCanvas();
  }

  // Drag del sticker
  const onStickerMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedSticker || !editCanvasRef.current) return;
    const pt = getMousePosOnCanvas(e);
    const inside =
      pt.x >= selectedSticker.x &&
      pt.x <= selectedSticker.x + selectedSticker.w &&
      pt.y >= selectedSticker.y &&
      pt.y <= selectedSticker.y + selectedSticker.h;
    if (inside) {
      setDraggingSticker(true);
      setDragOffset({ dx: pt.x - selectedSticker.x, dy: pt.y - selectedSticker.y });
    }
  };
  const onStickerMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingSticker || !selectedSticker || !editCanvasRef.current || !dragOffset) return;
    const pt = getMousePosOnCanvas(e);
    const x = pt.x - dragOffset.dx;
    const y = pt.y - dragOffset.dy;
    setSelectedSticker({ ...selectedSticker, x, y });
  };
  const onStickerMouseUp = () => {
    setDraggingSticker(false);
    setDragOffset(null);
  };

  // ============================================================
  // RENDER EDICIÓN: redibujo en editCanvas con filtros/emojis/sticker
  // ============================================================
  const redrawEditCanvas = useCallback(() => {
    const canvas = editCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !capturedImage || !canvas) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Filtros
      let filterCSS = '';
      if (currentFilter !== 'normal') {
        switch (currentFilter) {
          case 'vintage':
            filterCSS = 'sepia(50%) hue-rotate(20deg)';
            break;
          case 'bw':
            filterCSS = 'grayscale(100%)';
            break;
          case 'sepia':
            filterCSS = 'sepia(100%)';
            break;
          default:
            filterCSS = '';
        }
      }
      filterCSS += ` brightness(${brightness}%) contrast(${contrast}%)`;

      // Pintar imagen base con filtros
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = filterCSS;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0);

      // Emojis (si los usas)
      ctx.filter = 'none';
      appliedEmojis.forEach(({ emoji, x, y, size }) => {
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(emoji, x, y);
      });

      // Sticker PNG (sin fondo)
      if (selectedSticker) {
        const stickerCanvas = stickerCacheRef.current[selectedSticker.spec.src];
        if (stickerCanvas) {
          // Si cambió el tamaño del canvas (por primera vez), recalcula
          if (
            selectedSticker.w === 0 ||
            selectedSticker.h === 0 ||
            selectedSticker.w > canvas.width * 3 // sanity check
          ) {
            const rect = computeStickerRect(
              selectedSticker.spec,
              canvas.width,
              canvas.height,
              selectedSticker.scaleFactor,
            );
            setSelectedSticker({ ...selectedSticker, ...rect });
            ctx.drawImage(stickerCanvas, rect.x, rect.y, rect.w, rect.h);
          } else {
            ctx.drawImage(stickerCanvas, selectedSticker.x, selectedSticker.y, selectedSticker.w, selectedSticker.h);
          }
        }
      }
    };
    img.src = capturedImage;
  }, [capturedImage, appliedEmojis, currentFilter, brightness, contrast, selectedSticker]);

  useEffect(() => {
    if (capturedImage && currentStep === 'edit') redrawEditCanvas();
  }, [capturedImage, currentStep, redrawEditCanvas]);

  // ============================================================
  // EMOJIS (opcional)
  // ============================================================
  const handleAddEmoji = (emoji: string) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    const newEmoji: PlacedEmoji = {
      emoji,
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 80,
    };
    setAppliedEmojis((prev) => [...prev, newEmoji]);
  };

  const getMousePosOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // prioridad al sticker si se clicó dentro de él
    onStickerMouseDown(e);
    if (draggingSticker) return;

    const { x, y } = getMousePosOnCanvas(e);
    for (let i = appliedEmojis.length - 1; i >= 0; i--) {
      const emoji = appliedEmojis[i];
      const distance = Math.hypot(x - emoji.x, y - emoji.y);
      if (distance < emoji.size) {
        setIsDraggingEmoji(true);
        setDraggedEmojiIndex(i);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingSticker) {
      onStickerMouseMove(e);
      redrawEditCanvas();
      return;
    }
    if (!isDraggingEmoji || draggedEmojiIndex === null) return;
    const { x, y } = getMousePosOnCanvas(e);
    setAppliedEmojis((prev) => {
      const next = [...prev];
      next[draggedEmojiIndex] = { ...next[draggedEmojiIndex], x, y };
      return next;
    });
  };

  const handleCanvasMouseUp = () => {
    if (draggingSticker) onStickerMouseUp();
    setIsDraggingEmoji(false);
    setDraggedEmojiIndex(null);
  };

  const handleFilterChange = (filter: 'normal' | 'vintage' | 'bw' | 'sepia') => setCurrentFilter(filter);

  // ============================================================
  // EXPORT y GUARDADO
  // ============================================================
  const exportWithEffectsDataUrl = (): string | null => {
    const c = editCanvasRef.current;
    if (!c || !capturedImage) return null;
    // PNG para preservar alfa
    return c.toDataURL('image/png');
  };

  const handleSaveEdit = async () => {
    if (!segmentedB64) {
      setError('Primero captura para segmentar el rostro.');
      return;
    }
    setIsSaving(true);
    try {
      // 1) segmentado crudo (para BD):
      localStorage.setItem('pendingFaceB64', segmentedB64);

      // 2) versión editada (opcional) para carnet:
      if (useEffectsInCard) {
        const withFx = exportWithEffectsDataUrl();
        if (withFx) {
          const withFxB64 = dataUrlToBase64(withFx);
          localStorage.setItem('pendingCardFaceB64', withFxB64);
        } else {
          localStorage.removeItem('pendingCardFaceB64');
        }
      } else {
        localStorage.removeItem('pendingCardFaceB64');
      }

      // 3) notifica imagen visible
      if (capturedImage) onCapture(capturedImage);

      onClose();
    } catch (err) {
      console.error('Error al guardar parcial:', err);
      setError('Error al guardar la imagen localmente');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!isActive) return null;

  return (
    <div className={`cam-modal ${isActive ? 'active' : ''}`}>
      <div className="cam-overlay" onClick={onClose} />

      <div className="cam-content">
        {/* Header */}
        <div className="cam-header">
          <div className="header-left">
            <div className="header-icon-wrapper">
              <svg className="header-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <h2 className="header-title">
              {currentStep === 'camera' && title}
              {currentStep === 'confirm' && 'Confirmar Foto'}
              {currentStep === 'edit' && 'Editar Foto'}
            </h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cam-body">
          {/* Vista principal */}
          <div className="main-preview">
            {/* CAMERA */}
            {currentStep === 'camera' && (
              <div className="camera-view">
                <div className="camera-background">
                  <div className="bg-gradient"></div>
                  <div className="bg-pattern"></div>
                </div>

                <div className="video-container">
                  {error && (
                    <div className="error-message">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <p>{error}</p>
                    </div>
                  )}
                  <video ref={videoRef} autoPlay muted playsInline className="video-element" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="video-border"></div>
                </div>

                <div className="capture-controls">
                  <button
                    className={`capture-btn ${isLoading ? 'loading' : ''}`}
                    onClick={handleCapture}
                    disabled={isLoading || !!error}
                    aria-label="Capturar foto"
                  >
                    <span className="capture-ring">
                      <span className="capture-inner">{isLoading && <span className="loading-spinner"></span>}</span>
                    </span>
                  </button>
                  <p className="capture-hint">Haz clic para capturar</p>
                  {segMsg && (
                    <p className="capture-hint" style={{ opacity: 0.85 }}>
                      {segMsg}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* CONFIRM */}
            {currentStep === 'confirm' && capturedImage && (
              <div className="confirm-view">
                <div className="confirm-background">
                  <div className="confirm-bg-gradient"></div>
                </div>
                <div className="confirm-image-container">
                  <img src={capturedImage} alt="Foto segmentada" className="confirm-image" />
                  <div className="confirm-overlay">
                    <p className="confirm-text">Desliza para continuar</p>
                  </div>
                </div>

                <div className="slider-container">
                  <div className="slider-track">
                    <div className="slider-fill" style={{ width: `${sliderValue}%` }}></div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValue}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="slider-input"
                      aria-label="Deslizar para confirmar"
                    />
                    <div className="slider-thumb" style={{ left: `${sliderValue}%` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 18h6v-2H9v2zm3-5l6-6H6l6 6zm0-8C6.48 5 4 7.48 4 10s2.48 5 5 5 5-2.48 5-5-2.48-5-5-5z"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="slider-label">Arrastra hasta el final para continuar</p>
                </div>

                <button className="reject-btn" onClick={handleRejectPhoto}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  Retomar
                </button>
              </div>
            )}

            {/* EDIT */}
            {currentStep === 'edit' && (
              <div className="edit-view">
                <div className="edit-background">
                  <div className="edit-bg-gradient"></div>
                </div>
                <canvas
                  ref={editCanvasRef}
                  className="edit-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{ cursor: draggingSticker || isDraggingEmoji ? 'grabbing' : 'grab' }}
                />
              </div>
            )}
          </div>

          {/* Panel lateral de edición */}
          {currentStep === 'edit' && (
            <div className="edit-panel">
              <div className="panel-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m6-9h-6m-6 0h6"></path>
                </svg>
                <h3>Herramientas de Edición</h3>
              </div>

              <div className="panel-content">
                {/* Salida */}
                <div className="edit-section">
                  <h4>Salida</h4>
                  <label className="toggle-row">
                    <input type="checkbox" checked={useEffectsInCard} onChange={(e) => setUseEffectsInCard(e.target.checked)} />
                    <span>Usar efectos en el carnet (además del segmentado en BD)</span>
                  </label>
                  <p className="toggle-help">
                    Si está activo, al guardar también se generará <b>pendingCardFaceB64</b> con la imagen editada (PNG).
                  </p>
                </div>

                {/* Stickers */}
                <div className="edit-section">
                  <h4>Efectos</h4>
                  <div className="filter-buttons">
                    {STICKERS.map((s) => (
                      <button
                        key={s.id}
                        className={`filter-btn ${selectedSticker?.spec.id === s.id ? 'active' : ''}`}
                        onClick={() => handleSelectSticker(s)}
                        title={s.name}
                      >
                        <img src={s.src} alt={s.name} style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle' }} />{' '}
                        <span style={{ marginLeft: 8 }}>{s.name}</span>
                      </button>
                    ))}
                  </div>

                  {selectedSticker && (
                    <>
                      <p style={{ margin: '6px 0 12px', color: '#666973', fontSize: 12 }}>
                        El efecto se coloca y ajusta automáticamente al rostro. Puedes arrastrarlo para afinar.
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="filter-btn" onClick={() => adjustStickerScale(+0.1)}>
                          + Más grande
                        </button>
                        <button className="filter-btn" onClick={() => adjustStickerScale(-0.1)}>
                          – Más pequeño
                        </button>
                        <button className="filter-btn" onClick={removeSticker} style={{ color: '#b91c1c', borderColor: '#fca5a5' }}>
                          Quitar efecto
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Filtros */}
                {showFilters && (
                  <div className="edit-section">
                    <h4>Filtros</h4>
                    <div className="filter-buttons">
                      {(['normal', 'vintage', 'bw', 'sepia'] as const).map((filter) => (
                        <button
                          key={filter}
                          className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
                          onClick={() => handleFilterChange(filter)}
                        >
                          {filter === 'normal' ? 'Normal' : filter === 'vintage' ? 'Vintage' : filter === 'bw' ? 'B/N' : 'Sepia'}
                        </button>
                      ))}
                    </div>
                    <div className="slider-settings">
                      <label>
                        <span>Brillo: {brightness}%</span>
                        <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
                      </label>
                      <label>
                        <span>Contraste: {contrast}%</span>
                        <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
                      </label>
                    </div>
                  </div>
                )}

                {/* Emojis (opcional) */}
                {showEmojis && (
                  <div className="edit-section">
                    <h4>Emojis</h4>
                    <div className="emoji-buttons">
                      {['🐰', '🐱', '🐶', '😎', '✨', '🎀'].map((emoji) => (
                        <button key={emoji} className="emoji-btn" onClick={() => handleAddEmoji(emoji)} title="Haz clic para agregar">
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <p className="emoji-hint">Haz clic en un emoji y arrástralo en la imagen</p>
                  </div>
                )}
              </div>

              <div className="panel-actions">
                <button className="action-btn btn-secondary" onClick={handleRetake}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                  Retomar
                </button>
                <button className="action-btn btn-primary" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <span className="mini-spinner"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          ESTILOS (mantenemos tu UI + añadimos mínimos para stickers)
          ========================================================= */}
      <style>{`
        .toggle-row { display:flex; align-items:center; gap:10px; font-size:13px; font-weight:700; color:#333; padding:8px 0; }
        .toggle-help { margin-top:6px; font-size:12px; color:#666973; }

        .cam-modal { position:fixed; inset:0; z-index:9999; display:none; align-items:center; justify-content:center; padding:20px; }
        .cam-modal.active { display:flex; }
        .cam-overlay { position:absolute; inset:0; background:linear-gradient(135deg, rgba(9,11,13,.92) 0%, rgba(20,20,20,.95) 100%); backdrop-filter: blur(14px); }

        .cam-content { position:relative; width:100%; max-width:1500px; height:92vh; max-height:950px; background:linear-gradient(180deg,#51736f 0%,#E8E8E8 100%); border-radius:40px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 30px 90px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.2),inset 0 1px 0 rgba(255,255,255,.3); animation: slideUp .6s cubic-bezier(.34,1.56,.64,1); }
        @keyframes slideUp { from{opacity:0; transform: translateY(50px) scale(.9)} to{opacity:1; transform: translateY(0) scale(1)} }

        .cam-header { display:flex; align-items:center; justify-content:space-between; padding:32px 40px; background:linear-gradient(135deg,#51736F 0%,#3F5A56 100%); border-bottom:1px solid rgba(255,255,255,.08); box-shadow:0 2px 8px rgba(0,0,0,.15); }
        .header-left{ display:flex; align-items:center; gap:20px;}
        .header-icon-wrapper{ width:52px; height:52px; background:linear-gradient(135deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.05) 100%); border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.1); backdrop-filter: blur(10px); }
        .header-icon{ color:white; animation:pulse 2.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .header-title{ font-size:32px; font-weight:700; color:#fff; margin:0; letter-spacing:-.5px; text-shadow:0 2px 4px rgba(0,0,0,.1); }
        .close-button{ width:50px; height:50px; border-radius:14px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .3s cubic-bezier(.4,0,.2,1); backdrop-filter: blur(10px); }
        .close-button:hover{ background:rgba(255,255,255,.15); transform: rotate(90deg) scale(1.05); box-shadow:0 4px 12px rgba(0,0,0,.15); }

        .cam-body{ flex:1; display:flex; gap:32px; padding:32px; overflow:hidden; background:linear-gradient(135deg,#F5F5F5 0%, #EFEFEF 100%); }
        .main-preview{ flex:1; display:flex; flex-direction:column; border-radius:28px; overflow:hidden; position:relative; box-shadow:0 12px 40px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.5); background:white; }

        .camera-view{ width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px; gap:56px; position:relative; }
        .camera-background{ position:absolute; inset:0; overflow:hidden; background:linear-gradient(180deg,#FAFAFA 0%,#F5F5F5 50%,#EFEFEF 100%); }
        .bg-gradient{ position:absolute; inset:0; background: radial-gradient(circle at 25% 30%, rgba(81,115,111,.08) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(81,115,111,.06) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(81,115,111,.04) 0%, transparent 50%); animation: gradientShift 8s ease-in-out infinite; opacity:.9;}
        @keyframes gradientShift{ 0%{transform:translate(0,0)} 50%{transform:translate(3px, -3px)} 100%{transform:translate(0,0)} }
        .bg-pattern{ position:absolute; inset:0; background-image: radial-gradient(circle at 15% 15%, rgba(81,115,111,.05) 0%, transparent 35%), radial-gradient(circle at 85% 20%, rgba(81,115,111,.03) 0%, transparent 30%), radial-gradient(circle at 10% 85%, rgba(81,115,111,.04) 0%, transparent 33%), radial-gradient(circle at 90% 90%, rgba(81,115,111,.03) 0%, transparent 35%); animation: floatPattern 20s ease-in-out infinite; }
        @keyframes floatPattern{ 0%,100%{transform: translate(0,0)} 50%{transform: translate(10px, 8px)} }

        .video-container{ position:relative; width:100%; max-width:680px; aspect-ratio:4/3; border-radius:36px; overflow:hidden; z-index:1; box-shadow:0 40px 100px rgba(81,115,111,.2), 0 20px 50px rgba(0,0,0,.15), 0 0 0 1px rgba(255,255,255,.2); border:1px solid rgba(81,115,111,.1); }
        .video-element{ width:100%; height:100%; object-fit:cover; transform: scaleX(-1); }
        .video-border{ position:absolute; inset:0; border:2px solid rgba(255,255,255,.15); border-radius:32px; pointer-events:none; box-shadow: inset 0 0 30px rgba(81,115,111,.1); }

        .error-message{ position:absolute; top:50%; left:50%; transform: translate(-50%,-50%); background:linear-gradient(135deg, rgba(239,68,68,.95) 0%, rgba(220,38,38,.95) 100%); color:white; padding:36px 44px; border-radius:24px; text-align:center; max-width:90%; z-index:10; box-shadow:0 16px 48px rgba(239,68,68,.4); backdrop-filter: blur(10px); }
        .error-message svg{ margin-bottom:16px; opacity:.9; } .error-message p{ margin:0; font-size:16px; font-weight:500; line-height:1.6; }

        .capture-controls{ display:flex; flex-direction:column; align-items:center; gap:28px; z-index:1; }
        .capture-btn{ width:110px; height:110px; background:transparent; border:none; cursor:pointer; padding:0; transition: transform .3s cubic-bezier(.34,1.56,.64,1); position:relative; }
        .capture-btn:hover:not(:disabled){ transform: scale(1.08); } .capture-btn:active:not(:disabled){ transform: scale(.95); } .capture-btn:disabled{ opacity:.55; cursor:not-allowed; }
        .capture-ring{ display:block; width:110px; height:110px; border-radius:50%; border:8px solid white; padding:12px; background:transparent; transition:all .4s cubic-bezier(.34,1.56,.64,1); box-shadow:0 16px 44px rgba(81,115,111,.25), 0 8px 24px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.4); position:relative; }
        .capture-inner{ display:flex; align-items:center; justify-content:center; width:100%; height:100%; border-radius:50%; background: linear-gradient(135deg, white 0%, #F8F8F8 100%); transition: all .4s cubic-bezier(.34,1.56,.64,1); position:relative; box-shadow: inset 0 2px 6px rgba(0,0,0,.08), inset 0 -2px 6px rgba(255,255,255,.8); }
        .capture-btn.loading .capture-inner::after{ background:#51736F; animation: scale-pulse .6s ease-in-out infinite; }
        .loading-spinner{ width:28px; height:28px; border:3px solid rgba(255,255,255,.25); border-top-color:white; border-radius:50%; animation: spin .8s linear infinite; }
        @keyframes spin{ to{ transform: rotate(360deg) } }

        .capture-hint{ color:#333; font-size:16px; font-weight:700; margin:0; text-shadow:0 1px 2px rgba(255,255,255,.5); letter-spacing:.4px; text-transform:uppercase; }

        /* Confirm */
        .confirm-view{ width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; position:relative; gap:36px; }
        .confirm-image-container{ position:relative; border-radius:24px; overflow:hidden; max-width:600px; max-height:500px; z-index:1; box-shadow:0 24px 64px rgba(0,0,0,.15), 0 0 1px rgba(0,0,0,.1); }
        .confirm-image{ width:100%; height:100%; object-fit:cover; display:block; }
        .confirm-overlay{ position:absolute; inset:0; background:linear-gradient(180deg, transparent 0%, rgba(0,0,0,.35) 100%); display:flex; align-items:flex-end; justify-content:center; padding:28px; }
        .confirm-text{ color:white; font-size:18px; font-weight:700; margin:0; text-shadow:0 2px 8px rgba(0,0,0,.4); letter-spacing:.3px; }
        .slider-container{ width:100%; max-width:520px; z-index:1; }
        .slider-track{ position:relative; width:100%; height:64px; background:rgba(0,0,0,.08); border-radius:32px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.5); border:1px solid rgba(0,0,0,.06); }
        .slider-fill{ position:absolute; height:100%; background: linear-gradient(90deg, #51736F 0%, #3F5A56 100%); left:0; top:0; transition:width .08s ease; box-shadow:0 0 24px rgba(81,115,111,.4); }
        .slider-input{ position:absolute; width:100%; height:100%; top:0; left:0; margin:0; padding:0; opacity:0; cursor:pointer; z-index:10; }
        .slider-thumb{ position:absolute; top:50%; transform: translate(-50%, -50%); width:60px; height:60px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 20px rgba(0,0,0,.2); z-index:5; color:#51736F; transition:all .2s ease; pointer-events:none; border:2px solid rgba(81,115,111,.1); }
        .slider-label{ text-align:center; color:#333; font-size:13px; font-weight:600; margin-top:14px; letter-spacing:.3px; text-transform:uppercase; }

        /* Edit */
        .edit-view{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:24px; position:relative; background:white; }
        .edit-canvas{ max-width:100%; max-height:100%; border-radius:20px; box-shadow:0 16px 48px rgba(0,0,0,.12), 0 0 1px rgba(0,0,0,.1); cursor:grab; z-index:1; border:1px solid rgba(0,0,0,.05); transition: box-shadow .3s ease; }

        .edit-panel{ width:420px; background: linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%); border-radius:28px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6); border:1px solid rgba(0,0,0,.05); }
        .panel-header{ padding:28px; background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%); display:flex; align-items:center; gap:14px; border-bottom:1px solid rgba(255,255,255,.1); }
        .panel-header h3{ margin:0; font-size:18px; font-weight:700; color:white; }
        .panel-content{ flex:1; overflow-y:auto; padding:28px; }
        .edit-section{ margin-bottom:32px; }
        .filter-buttons{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px; }
        .filter-btn{ padding:12px 16px; background:white; border:2px solid #E0E0E0; border-radius:10px; font-weight:700; color:#666973; cursor:pointer; transition:all .3s ease; font-size:13px; letter-spacing:.3px; display:flex; align-items:center; justify-content:center; }
        .filter-btn:hover{ border-color:#51736F; color:#51736F; background: rgba(81,115,111,.03); }
        .filter-btn.active{ background:linear-gradient(135deg, #51736F 0%, #3F5A56 100%); color:white; border-color:#51736F; box-shadow:0 4px 12px rgba(81,115,111,.25); font-weight:800; }

        .slider-settings{ display:flex; flex-direction:column; gap:18px; }
        .slider-settings label{ font-size:12px; font-weight:700; color:#333; display:flex; flex-direction:column; gap:10px; letter-spacing:.3px; }
        .slider-settings span{ text-transform:uppercase; color:#666973; }

        .emoji-buttons{ display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
        .emoji-btn{ padding:18px; background:white; border:2px solid #E8E8E8; border-radius:14px; font-size:32px; cursor:pointer; transition:all .3s ease; display:flex; align-items:center; justify-content:center; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,.04); }
        .emoji-hint{ font-size:11px; color:#999; margin-top:12px; text-align:center; letter-spacing:.2px; font-weight:500; }

        .panel-actions{ padding:24px 28px; background: linear-gradient(135deg, #f8f8f8 0%, #F0F0F0 100%); border-top:1px solid rgba(0,0,0,.05); display:flex; gap:14px; }
        .action-btn{ flex:1; padding:16px 24px; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition: all .3s cubic-bezier(.4,0,.2,1); text-transform:uppercase; letter-spacing:.5px; }
        .btn-secondary{ background: linear-gradient(135deg, #E0E0E0 0%, #D0D0D0 100%); color:#333; box-shadow:0 2px 8px rgba(0,0,0,.08); border:1px solid rgba(0,0,0,.06); }
        .btn-primary{ background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%); color:white; box-shadow:0 4px 12px rgba(81,115,111,.25); border:1px solid rgba(81,115,111,.2); }

        @media (max-width:1200px){ .cam-body{ flex-direction:column; } .edit-panel{ width:100%; max-height:380px; } }
        @media (max-width:768px){ .cam-content{ height:100vh; max-height:100vh; border-radius:0; } .cam-body{ padding:24px; gap:24px; } .edit-panel{ max-height:340px; } }
        @media (max-width:480px){ .cam-modal{ padding:0; } .cam-body{ padding:20px; gap:20px; } .edit-panel{ max-height:340px; } }
      `}</style>
    </div>
  );
};

export default CameraModal;
