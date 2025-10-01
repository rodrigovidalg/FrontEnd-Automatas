import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface DashboardProps {
  onShowCredential: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onShowCredential }) => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <div>No user logged in</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h1 className="dashboard-title">
          ¡Bienvenido, {currentUser.nickname}! 🎉
        </h1>
        <div className="dashboard-card">
          <h2>Dashboard - AuthVision Pro</h2>
          <p className="text-gray-600 mb-8">
            Has ingresado exitosamente al sistema de autenticación avanzada.
          </p>
          
          <div className="dashboard-grid">
            <div className="dashboard-item">
              <h3>👤 Perfil</h3>
              <p>Email: {currentUser.email}</p>
              <p>Rol: {currentUser.role}</p>
            </div>
            
            <div className="dashboard-item">
              <h3>⚡ Estado</h3>
              <p className="text-green-600">✅ Sesión Activa</p>
              <p className="text-green-600">🔒 Verificado</p>
            </div>
            
            <div className="dashboard-item">
              <h3>📊 Estadísticas</h3>
              <p>Login: Exitoso</p>
              <p>Tiempo: &lt;15s</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center mt-8">
            <button 
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              onClick={onShowCredential}
            >
              Ver Credencial
            </button>
            <button 
              className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};