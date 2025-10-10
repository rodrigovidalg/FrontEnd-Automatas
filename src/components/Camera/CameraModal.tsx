import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PlacedEmoji {
  emoji: string;
  x: number;
  y: number;
  size: number;
}

interface CameraModalProps {
  isActive: boolean;
  onClose: () => void;
  onCapture: (photoData: string) => void;
  title: string;
  showFilters?: boolean;
  showEmojis?: boolean;
}

const CameraModal: React.FC<CameraModalProps> = ({ 
  isActive, 
  onClose, 
  onCapture, 
  title,
  showFilters = true,
  showEmojis = true 
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [appliedEmojis, setAppliedEmojis] = useState<PlacedEmoji[]>([]);
  const [currentFilter, setCurrentFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEmojiIndex, setDraggedEmojiIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'camera' | 'confirm' | 'edit'>('camera');
  const [sliderValue, setSliderValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      console.error("Error accessing camera:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && currentStep === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, currentStep, startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsLoading(false);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();
    
    const imageData = canvas.toDataURL('image/png', 1.0);
    
    setTimeout(() => {
      setIsLoading(false);
      setCapturedImage(imageData);
      setCurrentStep('confirm');
      setSliderValue(0);
      stopCamera();
    }, 300);
  }, [stopCamera]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value >= 80) {
      setCurrentStep('edit');
    }
  };

  const handleRejectPhoto = () => {
    setCapturedImage(null);
    setAppliedEmojis([]);
    setCurrentFilter('normal');
    setBrightness(100);
    setContrast(100);
    setCurrentStep('camera');
    setSliderValue(0);
    startCamera();
  };

  const redrawEditCanvas = useCallback(() => {
    const canvas = editCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !capturedImage || !canvas) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      let filterCSS = '';
      if (currentFilter !== 'normal') {
        switch (currentFilter) {
          case 'vintage': filterCSS = 'sepia(50%) hue-rotate(20deg)'; break;
          case 'bw': filterCSS = 'grayscale(100%)'; break;
          case 'sepia': filterCSS = 'sepia(100%)'; break;
          default: filterCSS = '';
        }
      }
      filterCSS += ` brightness(${brightness}%) contrast(${contrast}%)`;
      
      ctx.filter = filterCSS;
      ctx.drawImage(img, 0, 0);

      ctx.filter = 'none';
      appliedEmojis.forEach(({ emoji, x, y, size }) => {
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(emoji, x, y);
      });
    };
    img.src = capturedImage;
  }, [capturedImage, appliedEmojis, currentFilter, brightness, contrast]);

  useEffect(() => {
    if (capturedImage && currentStep === 'edit') {
      redrawEditCanvas();
    }
  }, [capturedImage, currentStep, redrawEditCanvas]);

  const handleAddEmoji = (emoji: string) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    
    const newEmoji: PlacedEmoji = {
      emoji,
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 80
    };
    setAppliedEmojis(prev => [...prev, newEmoji]);
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
    const { x, y } = getMousePosOnCanvas(e);
    
    for (let i = appliedEmojis.length - 1; i >= 0; i--) {
      const emoji = appliedEmojis[i];
      const emojiSize = emoji.size;
      const distance = Math.sqrt(Math.pow(x - emoji.x, 2) + Math.pow(y - emoji.y, 2));
      
      if (distance < emojiSize) {
        setIsDragging(true);
        setDraggedEmojiIndex(i);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || draggedEmojiIndex === null) return;
    const { x, y } = getMousePosOnCanvas(e);
    setAppliedEmojis(prev => {
      const newEmojis = [...prev];
      newEmojis[draggedEmojiIndex] = { ...newEmojis[draggedEmojiIndex], x, y };
      return newEmojis;
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedEmojiIndex(null);
  };

  const handleFilterChange = (filter: string) => setCurrentFilter(filter);
  
  const handleSaveEdit = async () => {
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    
    setIsSaving(true);
    
    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      const img = new Image();
      img.onload = () => {
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        let filterCSS = '';
        if (currentFilter !== 'normal') {
          switch (currentFilter) {
            case 'vintage': filterCSS = 'sepia(50%) hue-rotate(20deg)'; break;
            case 'bw': filterCSS = 'grayscale(100%)'; break;
            case 'sepia': filterCSS = 'sepia(100%)'; break;
          }
        }
        filterCSS += ` brightness(${brightness}%) contrast(${contrast}%)`;
        
        tempCtx.filter = filterCSS;
        tempCtx.drawImage(img, 0, 0);

        tempCtx.filter = 'none';
        appliedEmojis.forEach(({ emoji, x, y, size }) => {
          tempCtx.font = `${size}px Arial`;
          tempCtx.textAlign = 'left';
          tempCtx.textBaseline = 'top';
          tempCtx.fillText(emoji, x, y);
        });

        const finalImageData = tempCanvas.toDataURL('image/png', 1.0);
        onCapture(finalImageData);
        setIsSaving(false);
        onClose();
      };
      img.src = capturedImage!;
      
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Error al guardar la imagen');
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAppliedEmojis([]);
    setCurrentFilter('normal');
    setBrightness(100);
    setContrast(100);
    setCurrentStep('camera');
    setSliderValue(0);
    startCamera();
  };

  if (!isActive) return null;

  return (
    <div className={`cam-modal ${isActive ? 'active' : ''}`}>
      <div className="cam-overlay" onClick={onClose} />
      
      <div className="cam-content">
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

        <div className="cam-body">
          <div className="main-preview">
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
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="video-element" 
                  />
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
                      <span className="capture-inner">
                        {isLoading && <span className="loading-spinner"></span>}
                      </span>
                    </span>
                  </button>
                  <p className="capture-hint">Haz clic para capturar</p>
                </div>
              </div>
            )}

            {currentStep === 'confirm' && capturedImage && (
              <div className="confirm-view">
                <div className="confirm-background">
                  <div className="confirm-bg-gradient"></div>
                </div>
                <div className="confirm-image-container">
                  <img src={capturedImage} alt="Foto capturada" className="confirm-image" />
                  <div className="confirm-overlay">
                    <p className="confirm-text">Desliza para confirmar</p>
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
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                />
              </div>
            )}
          </div>

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
                {showFilters && (
                  <div className="edit-section">
                    <h4>Filtros</h4>
                    <div className="filter-buttons">
                      {['normal', 'vintage', 'bw', 'sepia'].map(filter => (
                        <button
                          key={filter}
                          className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
                          onClick={() => handleFilterChange(filter)}
                        >
                          {filter === 'normal' ? 'Normal' : 
                           filter === 'vintage' ? 'Vintage' :
                           filter === 'bw' ? 'B/N' : 'Sepia'}
                        </button>
                      ))}
                    </div>
                    <div className="slider-settings">
                      <label>
                        <span>Brillo: {brightness}%</span>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={brightness}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                        />
                      </label>
                      <label>
                        <span>Contraste: {contrast}%</span>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={contrast}
                          onChange={(e) => setContrast(Number(e.target.value))}
                        />
                      </label>
                    </div>
                  </div>
                )}
                
                {showEmojis && (
                  <div className="edit-section">
                    <h4>Emojis</h4>
                    <div className="emoji-buttons">
                      {['😊', '🎉', '❤️', '🌟', '🎨', '🚀'].map(emoji => (
                        <button
                          key={emoji}
                          className="emoji-btn"
                          onClick={() => handleAddEmoji(emoji)}
                          title="Haz clic para agregar"
                        >
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

      <style>{`
        .cam-modal {
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

        .cam-modal.active {
          display: flex;
        }

        .cam-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(9, 11, 13, 0.92) 0%, rgba(20, 20, 20, 0.95) 100%);
          backdrop-filter: blur(14px);
        }

        .cam-content {
          position: relative;
          width: 100%;
          max-width: 1500px;
          height: 92vh;
          max-height: 950px;
          background: linear-gradient(180deg, #51736f 0%, #E8E8E8 100%);
          border-radius: 40px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
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

        .cam-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 40px;
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon-wrapper {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .header-icon {
          color: #FFFFFF;
          animation: pulse 2.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .header-title {
          font-size: 32px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .close-button {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: rotate(90deg) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .cam-body {
          flex: 1;
          display: flex;
          gap: 32px;
          padding: 32px;
          overflow: hidden;
          background: linear-gradient(135deg, #F5F5F5 0%, #EFEFEF 100%);
        }

        .main-preview {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.5);
          background: white;
        }

        .camera-view {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          gap: 56px;
          position: relative;
        }

        .camera-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          background: linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 50%, #EFEFEF 100%);
        }

        .bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 25% 30%, rgba(81, 115, 111, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 75% 70%, rgba(81, 115, 111, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 50% 100%, rgba(81, 115, 111, 0.04) 0%, transparent 50%);
          animation: gradientShift 8s ease-in-out infinite;
          opacity: 0.9;
        }

        @keyframes gradientShift {
          0% {
            background: 
              radial-gradient(circle at 25% 30%, rgba(81, 115, 111, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 75% 70%, rgba(81, 115, 111, 0.06) 0%, transparent 40%),
              radial-gradient(circle at 50% 100%, rgba(81, 115, 111, 0.04) 0%, transparent 50%);
          }
          50% {
            background: 
              radial-gradient(circle at 30% 25%, rgba(81, 115, 111, 0.09) 0%, transparent 42%),
              radial-gradient(circle at 70% 75%, rgba(81, 115, 111, 0.07) 0%, transparent 42%),
              radial-gradient(circle at 55% 95%, rgba(81, 115, 111, 0.05) 0%, transparent 52%);
          }
          100% {
            background: 
              radial-gradient(circle at 25% 30%, rgba(81, 115, 111, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 75% 70%, rgba(81, 115, 111, 0.06) 0%, transparent 40%),
              radial-gradient(circle at 50% 100%, rgba(81, 115, 111, 0.04) 0%, transparent 50%);
          }
        }

        .bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(81, 115, 111, 0.05) 0%, transparent 35%),
            radial-gradient(circle at 85% 20%, rgba(81, 115, 111, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 10% 85%, rgba(81, 115, 111, 0.04) 0%, transparent 33%),
            radial-gradient(circle at 90% 90%, rgba(81, 115, 111, 0.03) 0%, transparent 35%);
          animation: floatPattern 20s ease-in-out infinite;
          z-index: 0;
        }

        @keyframes floatPattern {
          0%, 100% {
            transform: translate(0px, 0px);
          }
          25% {
            transform: translate(15px, -20px);
          }
          50% {
            transform: translate(-10px, 15px);
          }
          75% {
            transform: translate(20px, 10px);
          }
        }

        .camera-view::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse 800px 600px at 20% 40%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 600px 800px at 80% 60%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
          animation: glowMove 15s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glowMove {
          0%, 100% {
            opacity: 0.5;
            transform: translate(0, 0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(20px, -15px) scale(1.1);
          }
        }

        .video-container {
          position: relative;
          width: 100%;
          max-width: 680px;
          aspect-ratio: 4/3;
          border-radius: 36px;
          overflow: hidden;
          z-index: 1;
          box-shadow: 0 40px 100px rgba(81, 115, 111, 0.2),
                      0 20px 50px rgba(0, 0, 0, 0.15),
                      0 0 0 1px rgba(255, 255, 255, 0.2);
          animation: slideDown 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(81, 115, 111, 0.1);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .video-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 32px;
          pointer-events: none;
          box-shadow: inset 0 0 30px rgba(81, 115, 111, 0.1);
        }

        .error-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
          color: white;
          padding: 36px 44px;
          border-radius: 24px;
          text-align: center;
          max-width: 90%;
          z-index: 10;
          box-shadow: 0 16px 48px rgba(239, 68, 68, 0.4);
          backdrop-filter: blur(10px);
        }

        .error-message svg {
          margin-bottom: 16px;
          opacity: 0.9;
        }

        .error-message p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.6;
        }

        .capture-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          z-index: 1;
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .capture-btn {
          width: 110px;
          height: 110px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .capture-btn:hover:not(:disabled) {
          transform: scale(1.08);
        }

        .capture-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .capture-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .capture-ring {
          display: block;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 8px solid white;
          padding: 12px;
          background: transparent;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 16px 44px rgba(81, 115, 111, 0.25),
                      0 8px 24px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
          position: relative;
        }

        .capture-ring::before {
          content: '';
          position: absolute;
          top: -14px;
          left: -14px;
          right: -14px;
          bottom: -14px;
          border-radius: 50%;
          border: 2px solid rgba(81, 115, 111, 0.1);
          animation: pulse-ring 2s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        .capture-btn:hover:not(:disabled) .capture-ring {
          border-color: #51736F;
          box-shadow: 0 0 50px rgba(81, 115, 111, 0.6),
                      0 20px 50px rgba(81, 115, 111, 0.3),
                      0 8px 24px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .capture-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, white 0%, #F8F8F8 100%);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08),
                      inset 0 -2px 6px rgba(255, 255, 255, 0.8);
          position: relative;
        }

        .capture-inner::after {
          content: '';
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(81, 115, 111, 0.3);
        }

        .capture-btn:hover:not(:disabled) .capture-inner::after {
          background: linear-gradient(135deg, #3F5A56 0%, #2D4138 100%);
          box-shadow: 0 6px 24px rgba(81, 115, 111, 0.5);
        }

        .capture-btn.loading .capture-inner::after {
          background: #51736F;
          animation: scale-pulse 0.6s ease-in-out infinite;
        }

        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.9);
          }
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255, 255, 255, 0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          position: relative;
          z-index: 10;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .capture-hint {
          color: #333;
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        /* Confirm View */
        .confirm-view {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          gap: 36px;
        }

        .confirm-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .confirm-bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%);
        }

        .confirm-image-container {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          max-width: 600px;
          max-height: 500px;
          z-index: 1;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15),
                      0 0 1px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.5s ease-out;
        }

        .confirm-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .confirm-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.35) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 28px;
        }

        .confirm-text {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          letter-spacing: 0.3px;
        }

        /* Slider */
        .slider-container {
          width: 100%;
          max-width: 520px;
          z-index: 1;
          animation: slideUp 0.6s ease-out 0.1s both;
        }

        .slider-track {
          position: relative;
          width: 100%;
          height: 64px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .slider-fill {
          position: absolute;
          height: 100%;
          background: linear-gradient(90deg, #51736F 0%, #3F5A56 100%);
          left: 0;
          top: 0;
          transition: width 0.08s ease;
          box-shadow: 0 0 24px rgba(81, 115, 111, 0.4);
        }

        .slider-input {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          margin: 0;
          padding: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          z-index: 5;
          color: #51736F;
          transition: all 0.2s ease;
          pointer-events: none;
          border: 2px solid rgba(81, 115, 111, 0.1);
        }

        .slider-input:active ~ .slider-thumb {
          box-shadow: 0 8px 28px rgba(81, 115, 111, 0.4);
          transform: translate(-50%, -50%) scale(1.05);
        }

        .slider-label {
          text-align: center;
          color: #333;
          font-size: 13px;
          font-weight: 600;
          margin-top: 14px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .reject-btn {
          background: linear-gradient(135deg, #F2F2F2 0%, #EFEFEF 100%);
          color: #333;
          border: 2px solid rgba(0, 0, 0, 0.08);
          padding: 14px 36px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
          letter-spacing: 0.3px;
          animation: slideUp 0.6s ease-out 0.2s both;
        }

        .reject-btn:hover {
          background: linear-gradient(135deg, #EFEFEF 0%, #E8E8E8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.12);
        }

        .reject-btn svg {
          opacity: 0.8;
        }

        /* Edit View */
        .edit-view {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          background: white;
        }

        .edit-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .edit-bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
        }

        .edit-canvas {
          max-width: 100%;
          max-height: 100%;
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12),
                      0 0 1px rgba(0, 0, 0, 0.1);
          cursor: grab;
          z-index: 1;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.3s ease;
        }

        .edit-canvas:active {
          cursor: grabbing;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18),
                      0 0 1px rgba(0, 0, 0, 0.1);
        }

        .edit-panel {
          width: 420px;
          background: linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%);
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.05);
          animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .panel-header {
          padding: 28px;
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header svg {
          color: white;
          opacity: 0.95;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.2px;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
        }

        .panel-content::-webkit-scrollbar {
          width: 8px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 4px;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #C0C0C0 0%, #A0A0A0 100%);
          border-radius: 4px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #A0A0A0 0%, #808080 100%);
        }

        .edit-section {
          margin-bottom: 32px;
        }

        .edit-section:last-child {
          margin-bottom: 0;
        }

        .edit-section h4 {
          margin: 0 0 18px 0;
          font-size: 12px;
          font-weight: 800;
          color: #666973;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .filter-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .filter-btn {
          padding: 12px 16px;
          background: white;
          border: 2px solid #E0E0E0;
          border-radius: 10px;
          font-weight: 700;
          color: #666973;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        .filter-btn:hover {
          border-color: #51736F;
          color: #51736F;
          background: rgba(81, 115, 111, 0.03);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          color: white;
          border-color: #51736F;
          box-shadow: 0 4px 12px rgba(81, 115, 111, 0.25);
          font-weight: 800;
        }

        .slider-settings {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .slider-settings label {
          font-size: 12px;
          font-weight: 700;
          color: #333;
          display: flex;
          flex-direction: column;
          gap: 10px;
          letter-spacing: 0.3px;
        }

        .slider-settings span {
          text-transform: uppercase;
          color: #666973;
        }

        .slider-settings input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, #E0E0E0 0%, #D0D0D0 100%);
          outline: none;
          -webkit-appearance: none;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .slider-settings input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(81, 115, 111, 0.3);
          border: 1px solid rgba(81, 115, 111, 0.2);
          transition: all 0.2s ease;
        }

        .slider-settings input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 10px rgba(81, 115, 111, 0.4);
        }

        .emoji-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .emoji-btn {
          padding: 18px;
          background: white;
          border: 2px solid #E8E8E8;
          border-radius: 14px;
          font-size: 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .emoji-btn:hover {
          border-color: #51736F;
          transform: scale(1.12) translateY(-2px);
          box-shadow: 0 6px 16px rgba(81, 115, 111, 0.2);
          background: rgba(81, 115, 111, 0.02);
        }

        .emoji-hint {
          font-size: 11px;
          color: #999;
          margin-top: 12px;
          text-align: center;
          letter-spacing: 0.2px;
          font-weight: 500;
        }

        .panel-actions {
          padding: 24px 28px;
          background: linear-gradient(135deg, #f8f8f8 0%, #F0F0F0 100%);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          gap: 14px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .action-btn {
          flex: 1;
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: linear-gradient(135deg, #E0E0E0 0%, #D0D0D0 100%);
          color: #333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .btn-secondary:hover:not(:disabled) {
          background: linear-gradient(135deg, #D0D0D0 0%, #C0C0C0 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .btn-primary {
          background: linear-gradient(135deg, #51736F 0%, #3F5A56 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(81, 115, 111, 0.25);
          border: 1px solid rgba(81, 115, 111, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #3F5A56 0%, #2D4138 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(81, 115, 111, 0.35);
        }

        .action-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @media (max-width: 1200px) {
          .cam-body {
            flex-direction: column;
          }

          .edit-panel {
            width: 100%;
            max-height: 380px;
          }
        }

        @media (max-width: 768px) {
          .cam-content {
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }

          .cam-header {
            padding: 24px;
          }

          .header-title {
            font-size: 28px;
          }

          .header-icon-wrapper {
            width: 48px;
            height: 48px;
          }

          .cam-body {
            padding: 24px;
            gap: 24px;
          }

          .camera-view {
            gap: 40px;
          }

          .video-container {
            max-width: 85%;
          }

          .capture-btn {
            width: 95px;
            height: 95px;
          }

          .capture-ring {
            width: 95px;
            height: 95px;
            border-width: 7px;
          }

          .confirm-image-container {
            max-width: 90%;
            max-height: 380px;
          }

          .slider-container {
            max-width: 90%;
          }

          .edit-panel {
            max-height: 340px;
          }

          .action-btn {
            padding: 14px 18px;
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .cam-modal {
            padding: 0;
          }

          .cam-header {
            padding: 20px;
          }

          .header-title {
            font-size: 20px;
          }

          .header-icon-wrapper {
            width: 44px;
            height: 44px;
          }

          .header-icon {
            width: 28px;
            height: 28px;
          }

          .cam-body {
            padding: 20px;
            gap: 20px;
          }

          .camera-view {
            padding: 32px 20px;
            gap: 36px;
          }

          .video-container {
            max-width: 100%;
            border-radius: 24px;
          }

          .capture-btn {
            width: 85px;
            height: 85px;
          }

          .capture-ring {
            width: 85px;
            height: 85px;
            border-width: 6px;
            padding: 10px;
          }

          .capture-hint {
            font-size: 14px;
          }

          .slider-thumb {
            width: 52px;
            height: 52px;
          }

          .action-btn {
            padding: 12px 16px;
            font-size: 12px;
          }

          .action-btn svg {
            width: 18px;
            height: 18px;
          }

          .emoji-btn {
            padding: 14px;
            font-size: 26px;
          }

          .panel-header {
            padding: 20px;
          }

          .panel-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default CameraModal;