import React, { useState, useRef, useCallback } from 'react';

interface FaceLoginIntegratedProps {
  isActive: boolean;
  onClose: () => void;
  onSuccess?: (userData: { photo: string; name: string }) => void;
}

const FaceLoginIntegrated: React.FC<FaceLoginIntegratedProps> = ({
  isActive,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'capture' | 'comparison'>('capture');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const recognizedUser = 'Usuario Ejemplo';
  const comparisonMetrics = {
    facialRecognition: 98,
    expressionMatch: 95,
    lightingQuality: 92,
    faceAlignment: 97
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = resolve;
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (isActive && step === 'capture') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, step, startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    const imageData = canvas.toDataURL('image/png', 1.0);
    setCapturedPhoto(imageData);
    stopCamera();
    setStep('comparison');
  }, [stopCamera]);

  const handleRetake = () => {
    setCapturedPhoto(null);
    setStep('capture');
    startCamera();
  };

  const handleConfirm = () => {
    if (onSuccess && capturedPhoto) {
      onSuccess({
        photo: capturedPhoto,
        name: recognizedUser
      });
    }
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className={`face-modal ${isActive ? 'active' : ''}`}>
      <div className="face-overlay" onClick={onClose} />

      <div className="face-content">
        {/* PASO 1: CAPTURA */}
        {step === 'capture' && (
          <>
            <div className="face-header">
              <h2 className="face-title">Reconocimiento Facial</h2>
              <button className="face-close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="face-body capture-view">
              <div className="video-container-wrapper">
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
                <p>Mira directamente a la cámara para el reconocimiento facial</p>
              </div>

              <button className="capture-button" onClick={handleCapture}>
                <span className="capture-ring-outer">
                  <span className="capture-ring-inner"></span>
                </span>
              </button>
            </div>
          </>
        )}

        {/* PASO 2: COMPARATIVA */}
        {step === 'comparison' && capturedPhoto && (
          <>
            <div className="face-header">
              <h2 className="face-title">Comparativa de Reconocimiento</h2>
              <button className="face-close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="face-body comparison-view">
              {/* Fotos */}
              <div className="comparison-photos">
                <div className="photo-side">
                  <span className="photo-label">Foto Guardada</span>
                  <div className="photo-frame">
                    <img src={capturedPhoto} alt="Guardada" className="comparison-img" />
                  </div>
                </div>

                <div className="comparison-match">
                  <div className="match-badge">
                    <span className="match-percent">98%</span>
                    <span className="match-text">COINCIDENCIA</span>
                  </div>
                  <div className="match-arrow">→</div>
                </div>

                <div className="photo-side">
                  <span className="photo-label new-label">Foto Nueva</span>
                  <div className="photo-frame">
                    <img src={capturedPhoto} alt="Nueva" className="comparison-img" />
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="metrics-container">
                <h3 className="metrics-title">Análisis de Calidad</h3>
                <div className="metrics-list">
                  {[
                    { label: 'Reconocimiento Facial', value: comparisonMetrics.facialRecognition },
                    { label: 'Coincidencia de Expresión', value: comparisonMetrics.expressionMatch },
                    { label: 'Calidad de Iluminación', value: comparisonMetrics.lightingQuality },
                    { label: 'Alineación del Rostro', value: comparisonMetrics.faceAlignment }
                  ].map((metric, idx) => (
                    <div key={idx} className="metric-row">
                      <span className="metric-label">{metric.label}</span>
                      <div className="metric-bar-wrapper">
                        <div className="metric-bar">
                          <div 
                            className="metric-fill" 
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                        <span className="metric-percent">{metric.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuario */}
              <div className="user-section">
                <div className="user-icon">✓</div>
                <div className="user-info">
                  <p className="user-name">{recognizedUser}</p>
                  <p className="user-status">Rostro reconocido exitosamente</p>
                </div>
              </div>

              {/* Botones */}
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={handleRetake}>
                  Retomar Foto
                </button>
                <button className="btn btn-primary" onClick={handleConfirm}>
                  Confirmar Acceso
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .face-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .face-modal.active {
          display: flex;
        }

        .face-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(9, 11, 13, 0.92);
          backdrop-filter: blur(14px);
        }

        .face-content {
          position: relative;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          background: #CCD0D9;
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.4);
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.90);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .face-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 40px;
          background: #51736F;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .face-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        .face-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .face-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(90deg);
        }

        .face-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        /* CAPTURE VIEW */
        .capture-view {
          align-items: center;
          justify-content: center;
          padding: 48px;
          gap: 32px;
          background: linear-gradient(135deg, #CCD0D9 0%, #E8E8E8 100%);
        }

        .video-container-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
          aspect-ratio: 4/3;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
        }

        .face-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .video-frame {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          pointer-events: none;
        }

        .capture-instructions {
          text-align: center;
          color: #333;
        }

        .capture-instructions p {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .capture-button {
          width: 100px;
          height: 100px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.3s ease;
        }

        .capture-button:hover {
          transform: scale(1.08);
        }

        .capture-button:active {
          transform: scale(0.95);
        }

        .capture-ring-outer {
          display: block;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 8px solid white;
          box-shadow: 0 8px 24px rgba(81, 115, 111, 0.3);
          position: relative;
        }

        .capture-ring-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: calc(100% - 20px);
          height: calc(100% - 20px);
          border-radius: 50%;
          background: linear-gradient(135deg, white 0%, #F8F8F8 100%);
          margin: auto;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .capture-ring-inner::after {
          content: '';
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #51736F 0%, #51736F 100%);
          box-shadow: 0 4px 16px rgba(81, 115, 111, 0.3);
        }

        /* COMPARISON VIEW */
        .comparison-view {
          padding: 40px;
          gap: 32px;
          background: white;
          align-items: stretch;
        }

        .comparison-photos {
          display: grid;
          grid-template-columns: 1fr 0.8fr 1fr;
          gap: 24px;
          align-items: center;
        }

        .photo-side {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .photo-label {
          font-size: 12px;
          font-weight: 700;
          color: white;
          background: #51736F;
          padding: 6px 14px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .photo-label.new-label {
          background: #51736F;
        }

        .photo-frame {
          width: 100%;
          max-width: 220px;
          aspect-ratio: 3/4;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .comparison-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .comparison-match {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .match-badge {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(81, 115, 111, 0.1) 0%, rgba(81, 115, 111, 0.1) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px solid rgba(81, 115, 111, 0.2);
          color: #51736F;
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .match-percent {
          font-size: 32px;
          font-weight: 800;
        }

        .match-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
          margin-top: 4px;
        }

        .metrics-container {
          background: #F8F8F8;
          padding: 28px;
          border-radius: 16px;
        }

        .metrics-title {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }

        .metrics-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .metric-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-label {
          font-size: 12px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .metric-bar-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .metric-bar {
          flex: 1;
          height: 6px;
          background: #E0E0E0;
          border-radius: 3px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          background: #51736F;
          border-radius: 3px;
          transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .metric-percent {
          font-size: 12px;
          font-weight: 700;
          color: #51736F;
          min-width: 35px;
          text-align: right;
        }

        .user-section {
          background: linear-gradient(135deg, rgba(81, 115, 111, 0.08) 0%, rgba(81, 115, 111, 0.05) 100%);
          padding: 24px;
          border-radius: 16px;
          border: 2px solid rgba(81, 115, 111, 0.15);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-icon {
          width: 48px;
          height: 48px;
          background: #51736F;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .user-status {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #51736F;
          font-weight: 600;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: auto;
        }

        .btn {
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-secondary {
          background: #E0E0E0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #D0D0D0;
          transform: translateY(-2px);
        }

        .btn-primary {
          background: #51736F;
          color: white;
          box-shadow: 0 4px 12px rgba(81, 115, 111, 0.25);
        }

        .btn-primary:hover {
          background: #3F5A56;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(81, 115, 111, 0.35);
        }

        @media (max-width: 768px) {
          .comparison-photos {
            grid-template-columns: 1fr;
          }

          .face-header {
            padding: 20px;
          }

          .face-title {
            font-size: 20px;
          }

          .face-body {
            padding: 24px;
          }

          .metrics-list {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceLoginIntegrated;