import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/user.types';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowStatus: (title: string, description: string, progress: number) => void;
  onHideStatus: () => void;
}

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowStatus,
  onHideStatus
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startCamera, stopCamera } = useCamera();
  const { registeredUsers, quickLogin } = useAuth();
  const [faceDetected, setFaceDetected] = useState(false);
  const [status, setStatus] = useState('Buscando rostro...');

  const simulateFaceRecognition = useCallback(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        clearInterval(interval);
        return;
      }

      const hasFace = Math.random() > 0.4;
      if (hasFace) {
        setFaceDetected(true);
        setStatus('Rostro detectado ✓');
        
        setTimeout(() => {
          if (registeredUsers.length > 0) {
            const matchedUser = registeredUsers[Math.floor(Math.random() * registeredUsers.length)] as User;
            quickLogin(matchedUser);
            setStatus(`¡Reconocido! Bienvenido ${matchedUser.nickname}`);
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        }, 2000);
        
        clearInterval(interval);
      } else {
        setStatus('Posiciónate en el centro');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, registeredUsers, quickLogin, onSuccess]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startCamera(videoRef.current).catch(error => {
        console.error('Error starting camera:', error);
      });
      simulateFaceRecognition();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, simulateFaceRecognition]);

  if (!isOpen) return null;

  return (
    <div className="camera-modal fixed top-0 left-0 w-full h-full bg-white/95 backdrop-blur-xl z-50 flex justify-center items-center animate-fadeIn p-5">
      <div className="camera-container bg-white/98 backdrop-blur-xl rounded-3xl p-10 max-w-95vw max-h-95vh shadow-2xl relative border border-gray-300/30 w-full max-w-2xl">
        <div className="camera-header flex justify-between items-center mb-8 pb-6 border-b border-gray-300/30">
          <h2 className="camera-title text-2xl font-bold text-gray-900 bg-gradient-45 from-teal-500 to-gray-600 bg-clip-text text-transparent">
            Reconocimiento Facial
          </h2>
          <button 
            className="close-btn w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-lg transition-all duration-300 hover:bg-red-100 hover:scale-110"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <div className="video-container relative w-80 h-80 mx-auto">
            <div className="video-circle w-full h-full rounded-full overflow-hidden relative bg-gradient-45 from-teal-500/10 to-gray-400/10">
              <video 
                ref={videoRef}
                autoPlay 
                muted 
                playsInline
                className="w-full h-full object-cover scale-x--1 rounded-full"
              />
              <div className="face-recognition-frame absolute w-full h-full top-0 left-0 z-10 pointer-events-none">
                <div className="hex-scanner absolute w-4/5 h-4/5 top-1/10 left-1/10 bg-transparent border-2 border-teal-500/80 animate-pulse rounded-full"></div>
              </div>
              <div className={`face-status absolute bottom--12 left-1/2 transform -translate-x-1/2 px-5 py-2 bg-teal-500/90 text-white rounded-full text-sm font-semibold backdrop-blur transition-all duration-500 ${
                faceDetected ? 'bg-green-500/90' : 'bg-teal-500/90'
              }`}>
                {status}
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-gray-600">
            Mira directamente a la cámara para el reconocimiento facial
          </p>
        </div>
      </div>
    </div>
  );
};