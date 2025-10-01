import React from 'react';
import { User } from '../../types/user.types';

interface UserCredentialProps {
  user: User;
  onBack: () => void;
}

export const UserCredential: React.FC<UserCredentialProps> = ({ user, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-135 from-teal-500/5 via-gray-400/10 to-teal-500/5 bg-size-400 bg-pos-0-50 animate-gradient-shift p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-teal-600">
          🆔 Tu Credencial Digital
        </h1>
        
        <div className="id-card">
          <div className="id-card-header">
            <div className="id-card-logo">AuthVision</div>
            <div className="id-card-title">CREDENCIAL DE IDENTIFICACIÓN</div>
          </div>
          
          <div className="id-card-photo">
            <img 
              src={user.processedPhoto || user.originalPhoto || '/default-avatar.png'} 
              alt="Foto de perfil" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjJGMkYyIi8+CjxwYXRoIGQ9Ik02MCA2MEM2Ni42Mjg0IDYwIDcyIDU0LjYyODQgNzIgNDhDNzIgNDEuMzcxNiA2Ni42Mjg0IDM2IDYwIDM2QzUzLjM3MTYgMzYgNDggNDEuMzcxNiA0OCA0OEM0OCA1NC42Mjg0IDUzLjM3MTYgNjAgNjAgNjBaIiBmaWxsPSIjNTE3MzZGIi8+CjxwYXRoIGQ9Ik02MCA2NEMzOS4wODg1IDY0IDIyIDc3Ljg0MjIgMjIgOTVWOThIOThWOTVDOTggNzcuODQyMiA4MC45MTE1IDY0IDYwIDY0WiIgZmlsbD0iIzUxNzM2RiIvPgo8L3N2Zz4K';
              }}
            />
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
              <div className="text-xs text-center text-gray-500">
                QR Code
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <button 
            className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
            onClick={onBack}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};