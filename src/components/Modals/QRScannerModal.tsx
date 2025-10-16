import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '../../context/AuthContext';

const QRScannerModal = ({ isActive, onClose }: { isActive: boolean; onClose: () => void }) => {
  const { loginWithQR } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<number | null>(null);

  const [scanStatus, setScanStatus] = useState<'ready' | 'scanning' | 'success' | 'error'>('ready');
  const [statusMessage, setStatusMessage] = useState('');
  const [torch, setTorch] = useState(false);

  const colors = {
    primary: '#51736F',
    dark: '#090B0D',
    light: '#CCD0D9',
    gray: '#666973',
    bg: '#F5F5F5'
  };

  // -------- Cámara: iniciar / detener ----------
  const startCamera = useCallback(async () => {
    try {
      setScanStatus('ready');
      setStatusMessage('Preparando cámara...');

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' } as const
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;

      // Espera a que el <video> tenga metadata (dimensiones reales)
      await new Promise<void>((resolve) => {
        const v = videoRef.current!;
        if (v.readyState >= 1) {
          resolve();
        } else {
          const onLoaded = () => {
            v.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          v.addEventListener('loadedmetadata', onLoaded, { once: true });
        }
      });

      // Ajusta el canvas al tamaño real del video
      if (canvasRef.current && videoRef.current) {
        const w = videoRef.current.videoWidth || 640;
        const h = videoRef.current.videoHeight || 480;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }

      // Intenta reproducir el video
      await videoRef.current.play();

      // Arranca el escaneo inmediatamente
      setScanStatus('scanning');
      setStatusMessage('Escaneando...');
      startScanning();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanStatus('error');
      setStatusMessage('No se pudo acceder a la cámara');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scanningRef.current) {
      cancelAnimationFrame(scanningRef.current);
      scanningRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // -------- Bucle de escaneo ----------
  const startScanning = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const scan = () => {
      if (!videoRef.current || !canvasRef.current) {
        scanningRef.current = requestAnimationFrame(scan);
        return;
      }

      // Asegura que el video ya tenga frames
      if (video.readyState < 2) {
        scanningRef.current = requestAnimationFrame(scan);
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const code = jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          { inversionAttempts: 'dontInvert' }
        );

        if (code && code.data) {
          // 1) Detener escaneo/cámara
          if (scanningRef.current) cancelAnimationFrame(scanningRef.current);
          scanningRef.current = null;

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }

          setScanStatus('success');
          setStatusMessage('Código detectado, iniciando sesión...');

          // 2) Intentar login (sin await para no convertir el loop en async)
          loginWithQR(code.data)
            .then((ok) => {
              if (ok) {
                setStatusMessage('¡Login exitoso! Redirigiendo...');
                setTimeout(() => onClose(), 500);
              } else {
                setScanStatus('error');
                setStatusMessage('El QR no fue válido para iniciar sesión.');
              }
            })
            .catch((e) => {
              console.error('Error en login QR:', e);
              setScanStatus('error');
              setStatusMessage('Ocurrió un error al iniciar sesión con QR.');
            });

          return; // salir del bucle tras detectar código
        }
      } catch (e) {
        console.error('Error decodificando QR:', e);
      }

      // Continuar escaneando
      scanningRef.current = requestAnimationFrame(scan);
    };

    // Primer tick
    if (scanningRef.current) cancelAnimationFrame(scanningRef.current);
    scanningRef.current = requestAnimationFrame(scan);
  }, [loginWithQR, onClose]);

  // -------- Linterna ----------
  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;

      const constraints = { advanced: [{ torch: !torch } as any] };
      await (track.applyConstraints as any)(constraints);
      setTorch(!torch);
    } catch (error) {
      console.error('Torch not supported:', error);
    }
  };

  // -------- Reintentar ----------
  const handleRetry = useCallback(() => {
    stopCamera();
    startCamera();
  }, [startCamera, stopCamera]);

  // -------- Ciclo de vida del modal ----------
  useEffect(() => {
    if (isActive) {
      startCamera();
      return () => stopCamera();
    }
  }, [isActive, startCamera, stopCamera]);

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
        @keyframes scanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        backgroundColor: colors.bg,
        borderRadius: '20px',
        overflow: 'hidden',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        animation: 'fadeIn 0.4s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: `1px solid ${colors.light}`,
          backgroundColor: '#fff'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: colors.dark,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            Escanear QR
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', color: colors.gray, transition: 'all .3s ease',
              fontSize: '24px'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.dark; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.gray; }}
          >
            ✕
          </button>
        </div>

        {/* Camera Container */}
        <div style={{ position: 'relative', backgroundColor: colors.dark, aspectRatio: '1', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* QR Frame Overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              position: 'relative',
              width: '250px',
              height: '250px',
              border: `3px solid ${colors.primary}`,
              borderRadius: '12px',
              boxShadow: 'inset 0 0 0 5000px rgba(0,0,0,.3)',
              background: 'transparent'
            }}>
              {[0, 1, 2, 3].map((i) => {
                const corner = [
                  { top: '-3px', left: '-3px', borderWidth: '3px 0 0 3px' },
                  { top: '-3px', right: '-3px', borderWidth: '3px 3px 0 0' },
                  { bottom: '-3px', left: '-3px', borderWidth: '0 0 3px 3px' },
                  { bottom: '-3px', right: '-3px', borderWidth: '0 3px 3px 0' }
                ][i];
                return (
                  <div key={i} style={{
                    position: 'absolute', width: '30px', height: '30px',
                    borderColor: colors.primary, borderStyle: 'solid', ...(corner as React.CSSProperties)
                  }} />
                );
              })}

              {scanStatus === 'scanning' && (
                <div style={{
                  position: 'absolute', width: '100%', height: '2px',
                  backgroundColor: colors.primary, left: 0,
                  animation: 'scanLine 2s infinite', boxShadow: `0 0 10px ${colors.primary}`, opacity: .8
                }} />
              )}
            </div>
          </div>

          {/* Torch Button */}
          {streamRef.current && (
            <button
              onClick={toggleTorch}
              style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: torch ? colors.primary : 'rgba(255,255,255,.2)',
                border: 'none', color: '#fff', padding: '12px 16px',
                borderRadius: '50%', cursor: 'pointer', transition: 'all .3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}
            >
              💡
            </button>
          )}
        </div>

        {/* Status Section */}
        <div style={{ padding: '24px', backgroundColor: '#fff', textAlign: 'center' }}>
          {scanStatus === 'scanning' && (
            <div style={{ animation: 'pulse 2s infinite' }}>
              <div style={{ margin: '0 auto 12px', fontSize: '40px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⊙</div>
              <p style={{ margin: 0, color: colors.gray, fontSize: '14px' }}>
                Posiciona tu código QR dentro del marco
              </p>
            </div>
          )}

          {scanStatus === 'success' && (
            <div>
              <div style={{ margin: '0 auto 12px', fontSize: '48px' }}>✓</div>
              <p style={{ margin: 0, color: colors.primary, fontSize: '16px', fontWeight: 600 }}>
                {statusMessage}
              </p>
              <p style={{ margin: '8px 0 0', color: colors.gray, fontSize: '13px' }}>
                Redirigiendo...
              </p>
            </div>
          )}

          {scanStatus === 'error' && (
            <div>
              <div style={{ margin: '0 auto 12px', fontSize: '48px' }}>⚠</div>
              <p style={{ margin: 0, color: '#e74c3c', fontSize: '16px', fontWeight: 600 }}>
                {statusMessage}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: '16px', padding: '10px 24px',
                  backgroundColor: colors.primary, color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600, transition: 'all .3s ease'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gray; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.primary; }}
              >
                Reintentar
              </button>
            </div>
          )}

          {scanStatus === 'ready' && (
            <p style={{ margin: 0, color: colors.gray, fontSize: '14px' }}>
              {statusMessage || 'Preparando cámara...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
