import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../../hooks/useCamera';
import ProcessStatus from '../UI/ProcessStatus';
import FaceRecognitionFrame from './FaceRecognitionFrame';
import FilterControls from './FilterControls';
import EmojiEffects from './EmojiEffects';

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
  const { startCamera, stopCamera, switchCamera } = useCamera();
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startFaceDetection = useCallback(() => {
    // Simulate face detection
    const interval = setInterval(() => {
      const hasFace = Math.random() > 0.3;
      setFaceDetected(hasFace);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startCamera(videoRef.current.id);
      startFaceDetection();
    }
    
    return () => {
      if (isActive) {
        stopCamera();
      }
    };
  }, [isActive, startCamera, stopCamera, startFaceDetection]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setShowStatus(true);
    setStatusTitle('Capturando');
    setStatusDescription('Tomando foto...');
    setStatusProgress(30);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Apply filters
    context.filter = video.style.filter || 'none';
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    setStatusTitle('Procesando');
    setStatusDescription('Aplicando efectos...');
    setStatusProgress(60);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    setStatusTitle('Completado');
    setStatusDescription('Foto capturada exitosamente');
    setStatusProgress(100);
    
    setTimeout(() => {
      setShowStatus(false);
      onCapture(imageData);
      onClose();
    }, 1500);
  };

  const handleFilterChange = (filter: string) => {
    if (videoRef.current) {
      let filterCSS = '';
      
      switch (filter) {
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
      
      videoRef.current.style.filter = filterCSS;
    }
  };

  const handleFilterSettingsChange = (brightness: number, contrast: number) => {
    if (videoRef.current) {
      const currentFilter = videoRef.current.style.filter || '';
      const filterParts = currentFilter.split(' ');
      
      // Remove existing brightness and contrast
      const filteredParts = filterParts.filter(part => 
        !part.includes('brightness') && !part.includes('contrast')
      );
      
      // Add new brightness and contrast
      filteredParts.push(`brightness(${brightness}%)`);
      filteredParts.push(`contrast(${contrast}%)`);
      
      videoRef.current.style.filter = filteredParts.join(' ');
    }
  };

  const handleEmojiAdd = (emoji: string) => {
    if (!videoRef.current) return;
    
    const videoContainer = videoRef.current.parentElement;
    if (!videoContainer) return;
    
    const emojiEl = document.createElement('div');
    emojiEl.className = 'emoji-overlay';
    emojiEl.textContent = emoji;
    emojiEl.style.left = `${Math.random() * 80 + 10}%`;
    emojiEl.style.top = `${Math.random() * 80 + 10}%`;
    
    videoContainer.appendChild(emojiEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (emojiEl.parentNode) {
        emojiEl.parentNode.removeChild(emojiEl);
      }
    }, 3000);
  };

  return (
    <div className={`camera-modal ${isActive ? 'active' : ''}`}>
      <div className="camera-container">
        <div className="camera-header">
          <h2 className="camera-title">{title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="camera-workspace">
          <div className="video-section">
            <div className="video-container">
              <div className="video-circle">
                <video 
                  id="cameraVideo" 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                />
                <canvas ref={canvasRef} className="processing-canvas" />
                
                <FaceRecognitionFrame />
                
                <div className={`face-status ${faceDetected ? 'active match' : 'active no-match'}`}>
                  {faceDetected ? 'Rostro detectado ✓' : 'Posiciónate en el centro'}
                </div>
              </div>
              
              {showEmojis && (
                <EmojiEffects onEmojiAdd={handleEmojiAdd} />
              )}
            </div>
            
            <div className="camera-controls">
              <button 
                className="control-btn capture-btn"
                onClick={handleCapture}
              >
                📸 Capturar Foto
              </button>
              
              <button 
                className="control-btn switch-camera-btn"
                onClick={switchCamera}
              >
                🔄 Cambiar Cámara
              </button>
            </div>
          </div>
          
          {showFilters && (
            <FilterControls 
              onFilterChange={handleFilterChange}
              onFilterSettingsChange={handleFilterSettingsChange}
            />
          )}
        </div>
      </div>
      
      <ProcessStatus
        show={showStatus}
        title={statusTitle}
        description={statusDescription}
        progress={statusProgress}
      />
    </div>
  );
};

export default CameraModal;