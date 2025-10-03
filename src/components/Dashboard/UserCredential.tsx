import React, { useEffect, useRef } from 'react';
import { User } from '../../types/user.types';
import Button from '../UI/Button';
import { generateCredentialPDF } from '../../services/pdfService';

interface UserCredentialProps {
  user: User;
  onClose: () => void;
}

const UserCredential: React.FC<UserCredentialProps> = ({ user, onClose }) => {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCanvasRef.current) {
      // Generate QR code
      try {
        // En un entorno real, usaría una librería QR adecuada
        // Por ahora, solo dibujamos un placeholder
        const canvas = qrCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, 80, 80);
          
          // Draw a simple pattern to simulate QR
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
              if ((i + j) % 2 === 0) {
                ctx.fillRect(i * 10, j * 10, 10, 10);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    }
  }, [user]);

  const handleDownloadPDF = () => {
    generateCredentialPDF(user);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, ' +
        'rgba(81, 115, 111, 0.05) 0%, ' +
        'rgba(204, 208, 217, 0.1) 25%,' +
        'rgba(102, 105, 115, 0.08) 50%,' +
        'rgba(81, 115, 111, 0.03) 75%,' +
        'rgba(242, 242, 242, 0.1) 100%)',
      minHeight: '100vh',
      padding: '40px',
      color: 'var(--color-black)',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2em',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #51736F, #666973)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🆔 Tu Credencial Digital
        </h1>
        
        <div className="id-card">
          <div className="id-card-header">
            <div className="id-card-logo">AuthVision</div>
            <div className="id-card-title">CREDENCIAL DE IDENTIFICACIÓN</div>
          </div>
          
          <div className="id-card-photo">
            <img src={user.processedPhoto || user.originalPhoto} alt="Foto de perfil" />
          </div>
          
          <div className="id-card-info">
            <div className="info-item">
              <div className="info-label">Nombre:</div>
              <div className="info-value">{user.nickname}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Email:</div>
              <div className="info-value">{user.email}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Teléfono:</div>
              <div className="info-value">{user.phone}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Rol:</div>
              <div className="info-value">{user.role}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">ID:</div>
              <div className="info-value">{user.id}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Fecha:</div>
              <div className="info-value">
                {new Date(user.registrationDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="id-card-footer">
            <div className="verification-badge">VERIFICADO</div>
            <div className="qr-code-container">
              <canvas 
                ref={qrCanvasRef}
                id="credentialQR" 
                width="80" 
                height="80"
              />
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <Button 
            variant="primary"
            onClick={handleDownloadPDF}
            style={{ marginRight: '15px' }}
          >
            Descargar PDF
          </Button>
          
          <Button 
            variant="secondary"
            onClick={onClose}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserCredential;