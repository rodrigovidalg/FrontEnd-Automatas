import React, { useEffect, useRef, useState, useCallback } from 'react';

const QRScannerModal = ({ isActive, onClose }: { isActive: boolean; onClose: () => void }) => {
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

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' as const
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>(resolve => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanStatus('error');
      setStatusMessage('No se pudo acceder a la cámara');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scanningRef.current) {
      cancelAnimationFrame(scanningRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    setScanStatus('scanning');

    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !context) return;

      context.drawImage(videoRef.current, 0, 0);
      
      const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const data = imageData.data;
      
      let darkPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 100) darkPixels++;
      }

      const qrLikelihood = darkPixels / (data.length / 4);
      if (qrLikelihood > 0.15 && qrLikelihood < 0.45) {
        setScanStatus('success');
        setStatusMessage('✓ Código QR válido');
        stopCamera();
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      scanningRef.current = requestAnimationFrame(scan);
    };

    scanningRef.current = requestAnimationFrame(scan);
  }, [stopCamera, onClose]);

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

  const handleRetry = useCallback(() => {
    setScanStatus('ready');
    setStatusMessage('');
    if (videoRef.current && videoRef.current.readyState === 2) {
      startScanning();
    }
  }, [startScanning]);

  useEffect(() => {
    if (isActive) {
      startCamera();
      return () => stopCamera();
    }
  }, [isActive, startCamera, stopCamera]);

  useEffect(() => {
    if (scanStatus === 'scanning' && videoRef.current?.readyState === 2) {
      startScanning();
    }
  }, [scanStatus, startScanning]);

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        backgroundColor: colors.bg,
        borderRadius: '20px',
        overflow: 'hidden',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
            fontWeight: '600',
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: colors.gray,
              transition: 'all 0.3s ease',
              fontSize: '24px'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              target.style.color = colors.dark;
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              target.style.color = colors.gray;
            }}
          >
            ✕
          </button>
        </div>

        {/* Camera Container */}
        <div style={{
          position: 'relative',
          backgroundColor: colors.dark,
          aspectRatio: '1',
          overflow: 'hidden'
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* QR Frame Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'relative',
              width: '250px',
              height: '250px',
              border: `3px solid ${colors.primary}`,
              borderRadius: '12px',
              boxShadow: `inset 0 0 0 5000px rgba(0, 0, 0, 0.3)`,
              background: 'transparent'
            }}>
              {/* Corners */}
              {[0, 1, 2, 3].map((i) => {
                const cornerStyles = [
                  { top: '-3px', left: '-3px', borderWidth: '3px 0 0 3px' },
                  { top: '-3px', right: '-3px', borderWidth: '3px 3px 0 0' },
                  { bottom: '-3px', left: '-3px', borderWidth: '0 0 3px 3px' },
                  { bottom: '-3px', right: '-3px', borderWidth: '0 3px 3px 0' }
                ];

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '30px',
                      height: '30px',
                      borderColor: colors.primary,
                      borderStyle: 'solid',
                      ...cornerStyles[i]
                    } as React.CSSProperties}
                  />
                );
              })}

              {/* Scan Line */}
              {scanStatus === 'scanning' && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '2px',
                  backgroundColor: colors.primary,
                  left: 0,
                  animation: 'scanLine 2s infinite',
                  boxShadow: `0 0 10px ${colors.primary}`,
                  opacity: 0.8
                }} />
              )}
            </div>
          </div>

          {/* Torch Button */}
          {streamRef.current && (
            <button
              onClick={toggleTorch}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: torch ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              💡
            </button>
          )}
        </div>

        {/* Status Section */}
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          textAlign: 'center'
        }}>
          {scanStatus === 'scanning' && (
            <div style={{ animation: 'pulse 2s infinite' }}>
              <div style={{
                margin: '0 auto 12px',
                fontSize: '40px',
                animation: 'spin 2s linear infinite',
                display: 'inline-block'
              }}>
                ⊙
              </div>
              <p style={{ margin: 0, color: colors.gray, fontSize: '14px' }}>
                Posiciona tu código QR dentro del marco
              </p>
            </div>
          )}

          {scanStatus === 'success' && (
            <div>
              <div style={{ margin: '0 auto 12px', fontSize: '48px' }}>
                ✓
              </div>
              <p style={{
                margin: 0,
                color: colors.primary,
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {statusMessage}
              </p>
              <p style={{ margin: '8px 0 0', color: colors.gray, fontSize: '13px' }}>
                Redirigiendo...
              </p>
            </div>
          )}

          {scanStatus === 'error' && (
            <div>
              <div style={{ margin: '0 auto 12px', fontSize: '48px' }}>
                ⚠
              </div>
              <p style={{
                margin: 0,
                color: '#e74c3c',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {statusMessage}
              </p>
              <button
                onClick={handleRetry}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.backgroundColor = colors.gray;
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.backgroundColor = colors.primary;
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {scanStatus === 'ready' && (
            <p style={{ margin: 0, color: colors.gray, fontSize: '14px' }}>
              Preparando cámara...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;