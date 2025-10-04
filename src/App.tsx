// src/App.tsx
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabNavigation from './components/Auth/TabNavigation';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import CameraModal from './components/Camera/CameraModal';
import FaceLoginModal from './components/Modals/FaceLoginModal';
import QRScannerModal from './components/Modals/QRScannerModal';
import FloatingElements from './components/UI/FloatingElements';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';

import DashboardPage from './components/Dashboard/DashboardPage'; // ⬅️ nuevo
import './styles/global.css';
import './styles/animations.css';

/** ---------- RUTA PROTEGIDA ---------- */
type ProtectedRouteProps = { children: React.ReactNode };

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};
/** ------------------------------------ */

/** ---------- CONTENIDO DE LA VISTA LOGIN/LANDING ---------- */
const AppContent: React.FC = () => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showFaceLoginModal, setShowFaceLoginModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const navigate = useNavigate();

  // 🔁 Si el login fue exitoso, envía al Dashboard


  const handleTabChange = (tab: string) => setActiveTab(tab);
  const handleCameraCapture = () => setShowCameraModal(true);
  const handlePhotoCapture = (photoData: string) => console.log('Photo captured:', photoData);
  const handleFaceLogin = () => setShowFaceLoginModal(true);
  const handleQRLogin = () => setShowQRModal(true);

  const handlePasswordReset = () => {
    const email = prompt('🔄 Ingresa tu email para recuperar la contraseña:');
    if (email) alert(`Se ha enviado un enlace de recuperación a ${email}`);
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

        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Login */}
        <div id="login-form" className={`form-container ${activeTab === 'login' ? 'active' : ''}`}>
          <LoginForm
            onFaceLogin={handleFaceLogin}
            onQRLogin={handleQRLogin}
            onPasswordReset={handlePasswordReset}
          />
        </div>

        {/* Registro */}
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
              <p className="feature-description">Reconocimiento facial con precisión del 99.7%.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Ultra Rápido</h3>
              <p className="feature-description">Procesamiento en tiempo real.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Máxima Seguridad</h3>
              <p className="feature-description">Encriptación de nivel empresarial.</p>
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
      <FaceLoginModal isActive={showFaceLoginModal} onClose={() => setShowFaceLoginModal(false)} />
      <QRScannerModal isActive={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
};
/** ----------------------------------------------------------------------- */

/** ---------- ÁRbol DE RUTAS ---------- */
const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<AppContent />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
/** ----------------------------------- */

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
