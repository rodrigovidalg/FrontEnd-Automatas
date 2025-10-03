import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProcessStatus from '../UI/ProcessStatus';
import FaceRecognitionFrame from '../Camera/FaceRecognitionFrame';

interface FaceLoginModalProps {
  isActive: boolean;
  onClose: () => void;
}

const FaceLoginModal: React.FC<FaceLoginModalProps> = ({ isActive, onClose }) => {
  const { loginWithFace } = useAuth();
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceRecognized, setFaceRecognized] = useState(false);
  const [recognizedUser, setRecognizedUser] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const handleFaceRecognitionSuccess = useCallback(async () => {
    setShowStatus(true);
    setStatusTitle('Reconocido');
    setStatusDescription('Iniciando sesión...');
    setStatusProgress(50);
    
    const success = await loginWithFace();
    
    if (success) {
      setStatusTitle('Éxito');
      setStatusDescription('Login exitoso, redirigiendo...');
      setStatusProgress(100);
      
      setTimeout(() => {
        setShowStatus(false);
        onClose();
      }, 2000);
    } else {
      setStatusTitle('Error');
      setStatusDescription('No se pudo reconocer el rostro');
      setStatusProgress(0);
      
      setTimeout(() => {
        setShowStatus(false);
        setFaceRecognized(false);
        setRecognizedUser(null);
      }, 3000);
    }
  }, [loginWithFace, onClose]);

  const startFaceRecognition = useCallback(() => {
    // Simulate face detection and recognition
    const detectionInterval = setInterval(() => {
      const hasFace = Math.random() > 0.3;
      setFaceDetected(hasFace);
      
      if (hasFace && !faceRecognized) {
        // Simulate face recognition after a delay
        setTimeout(() => {
          const isRecognized = Math.random() > 0.5;
          if (isRecognized) {
            setFaceRecognized(true);
            setRecognizedUser('Usuario Ejemplo');
            handleFaceRecognitionSuccess();
          }
        }, 2000);
      }
    }, 1500);
    
    return () => clearInterval(detectionInterval);
  }, [faceRecognized, handleFaceRecognitionSuccess]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startCamera();
      const cleanup = startFaceRecognition();
      
      return () => {
        stopCamera();
        cleanup();
      };
    }
  }, [isActive, startCamera, stopCamera, startFaceRecognition]);

  return (
    <div className={`camera-modal ${isActive ? 'active' : ''}`}>
      <div className="camera-container">
        <div className="camera-header">
          <h2 className="camera-title">Reconocimiento Facial</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div className="video-container">
            <div className="video-circle">
              <video 
                id="faceLoginVideo" 
                ref={videoRef}
                autoPlay 
                muted 
                playsInline
              />
              
              <FaceRecognitionFrame />
              
              <div className={`face-status ${faceDetected ? 'active match' : 'active no-match'}`}>
                {faceRecognized 
                  ? `¡Reconocido! Bienvenido ${recognizedUser}` 
                  : faceDetected 
                    ? 'Rostro detectado' 
                    : 'Posiciónate en el centro'
                }
              </div>
            </div>
          </div>
          
          <p style={{ marginTop: '20px', color: 'var(--color-dark-gray)' }}>
            Mira directamente a la cámara para el reconocimiento facial
          </p>
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

export default FaceLoginModal;