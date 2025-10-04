import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabNavigation from './components/Auth/TabNavigation';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import CameraModal from './components/Camera/CameraModal';
import FaceLoginModal from './components/Modals/FaceLoginModal';
import QRScannerModal from './components/Modals/QRScannerModal';
import FloatingElements from './components/UI/FloatingElements';
import './styles/global.css';
import './styles/animations.css';

const AppContent: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showFaceLoginModal, setShowFaceLoginModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleCameraCapture = () => {
    setShowCameraModal(true);
  };

  const handlePhotoCapture = (photoData: string) => {
    // En un entorno real, esto se procesaría y guardaría con el registro del usuario
    console.log('Photo captured:', photoData);
  };

  const handleFaceLogin = () => {
    setShowFaceLoginModal(true);
  };

  const handleQRLogin = () => {
    setShowQRModal(true);
  };

  const handlePasswordReset = () => {
    const email = prompt('🔄 Ingresa tu email para recuperar la contraseña:');
    if (email) {
      // En un entorno real, esto llamaría a la API de restablecimiento de contraseña
      alert(`Se ha enviado un enlace de recuperación a ${email}`);
    }
  };

  return (
    <div className="main-container">
      <FloatingElements />
      
      {/* Panel Lateral */}
      <div className="side-panel">
        <div className="logo">
          <h1>Analizador<span className="logo-accent">Pro</span></h1>
          <div className="logo-subtitle">Sistema Avanzado</div>
        </div>
        
        {/* Navegación Avanzada */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {/* Formulario de Login */}
        <div id="login-form" className={`form-container ${activeTab === 'login' ? 'active' : ''}`}>
          <LoginForm
            onFaceLogin={handleFaceLogin}
            onQRLogin={handleQRLogin}
            onPasswordReset={handlePasswordReset}
          />
        </div>
        
        {/* Formulario de Registro */}
        <div id="register-form" className={`form-container ${activeTab === 'register' ? 'active' : ''}`}>
          <RegisterForm onCameraCapture={handleCameraCapture} />
        </div>
      </div>
      
      {/* Panel Principal */}
      <div className="main-panel">
        <div className="hero-content">
          <h1 className="hero-title">Autenticación del Futuro, Hoy</h1>
          <p className="hero-subtitle">
            Experimenta la próxima generación en seguridad con nuestro sistema de autenticación avanzado. 
            Combina reconocimiento facial, códigos QR y contraseñas seguras en una interfaz elegante y fácil de usar.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">Reconocimiento Facial</h3>
              <p className="feature-description">Reconocimiento facial con precisión del 99.7% utilizando algoritmos de última generación.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Ultra Rápido</h3>
              <p className="feature-description">Procesamiento en tiempo real para una experiencia de usuario fluida y sin interrupciones.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Máxima Seguridad</h3>
              <p className="feature-description">Encriptación de nivel empresarial para proteger tus datos e identidad.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <CameraModal
        isActive={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handlePhotoCapture}
        title="Captura de Foto"
        showFilters={true}
        showEmojis={true}
      />
      
      <FaceLoginModal
        isActive={showFaceLoginModal}
        onClose={() => setShowFaceLoginModal(false)}
      />
      
      <QRScannerModal
        isActive={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;