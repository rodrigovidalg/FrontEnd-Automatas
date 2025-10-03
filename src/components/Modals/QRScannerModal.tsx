import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProcessStatus from '../UI/ProcessStatus';

interface QRScannerModalProps {
  isActive: boolean;
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isActive, onClose }) => {
  const { loginWithQR } = useAuth();
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera for QR scanning
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

  // Separar la lógica de éxito del reinicio del escaneo
  const handleQRScanningSuccess = useCallback(async () => {
    const success = await loginWithQR();
    
    if (success) {
      setStatusTitle('Válido');
      setStatusDescription('Acceso concedido');
      setStatusProgress(100);
      
      setTimeout(() => {
        setShowStatus(false);
        onClose();
      }, 2000);
    } else {
      setStatusTitle('Inválido');
      setStatusDescription('Código QR no reconocido');
      setStatusProgress(0);
      
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    }
  }, [loginWithQR, onClose]);

  // Función para iniciar el escaneo QR
  const startQRScanning = useCallback(() => {
    // Clear any existing timeout
    if (scanningTimeoutRef.current) {
      clearTimeout(scanningTimeoutRef.current);
    }
    
    // Simulate QR scanning
    scanningTimeoutRef.current = setTimeout(() => {
      setShowStatus(true);
      setStatusTitle('QR Detectado');
      setStatusDescription('Validando código...');
      setStatusProgress(70);
      
      handleQRScanningSuccess();
    }, 3000);
  }, [handleQRScanningSuccess]);

  // Manejar el reinicio del escaneo por separado
  useEffect(() => {
    if (!showStatus || statusTitle !== 'Inválido') return;
    
    const restartTimeout = setTimeout(() => {
      startQRScanning();
    }, 3000);

    return () => clearTimeout(restartTimeout);
  }, [showStatus, statusTitle, startQRScanning]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      startCamera();
      startQRScanning();
      
      return () => {
        stopCamera();
        if (scanningTimeoutRef.current) {
          clearTimeout(scanningTimeoutRef.current);
        }
      };
    }
  }, [isActive, startCamera, stopCamera, startQRScanning]);

  return (
    <div className={`camera-modal ${isActive ? 'active' : ''}`}>
      <div className="camera-container">
        <div className="camera-header">
          <h2 className="camera-title">Escáner QR</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div className="qr-scanner">
            <video 
              id="qrVideo" 
              ref={videoRef}
              className="qr-video"
              autoPlay 
              muted 
              playsInline
            />
            <div className="qr-overlay"></div>
          </div>
          
          <p style={{ marginTop: '20px', color: 'var(--color-dark-gray)' }}>
            Posiciona tu código QR dentro del marco para escanear
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

export default QRScannerModal;