import React, { useEffect, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/user.types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowStatus: (title: string, description: string, progress: number) => void;
  onHideStatus: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onShowStatus,
  onHideStatus
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startCamera, stopCamera } = useCamera();
  const { registeredUsers, quickLogin } = useAuth();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startCamera(videoRef.current).catch(error => {
        console.error('Error starting camera:', error);
      });
      
      // Simular escaneo QR
      setTimeout(() => {
        onShowStatus('QR Detectado', 'Validando código...', 70);
        setTimeout(() => {
          if (registeredUsers.length > 0) {
            const matchedUser = registeredUsers[Math.floor(Math.random() * registeredUsers.length)] as User;
            quickLogin(matchedUser);
            onShowStatus('Válido', `Acceso concedido para ${matchedUser.nickname}`, 100);
            setTimeout(() => {
              onHideStatus();
              onClose();
            }, 2000);
          }
        }, 1500);
      }, 3000);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, registeredUsers, quickLogin, onShowStatus, onHideStatus, onClose]);

  if (!isOpen) return null;

  return (
    <div className="camera-modal fixed top-0 left-0 w-full h-full bg-white/95 backdrop-blur-xl z-50 flex justify-center items-center animate-fadeIn p-5">
      <div className="camera-container bg-white/98 backdrop-blur-xl rounded-3xl p-10 max-w-95vw max-h-95vh shadow-2xl relative border border-gray-300/30 w-full max-w-2xl">
        <div className="camera-header flex justify-between items-center mb-8 pb-6 border-b border-gray-300/30">
          <h2 className="camera-title text-2xl font-bold text-gray-900 bg-gradient-45 from-teal-500 to-gray-600 bg-clip-text text-transparent">
            Escáner QR
          </h2>
          <button 
            className="close-btn w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center text-lg transition-all duration-300 hover:bg-red-100 hover:scale-110"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <div className="qr-scanner relative w-80 h-80 border-2 border-teal-500 rounded-2xl overflow-hidden shadow-lg mx-auto bg-gradient-45 from-teal-500/5 to-gray-400/5">
            <video 
              ref={videoRef}
              className="qr-video w-full h-full object-cover"
              autoPlay 
              muted 
              playsInline
            />
            <div className="qr-overlay absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-teal-500 rounded-xl animate-pulse"></div>
          </div>
          
          <p className="mt-8 text-gray-600">
            Posiciona tu código QR dentro del marco para escanear
          </p>
        </div>
      </div>
    </div>
  );
};