import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FloatingElements } from './components/UI/FloatingElements';
import { ProcessStatus } from './components/UI/ProcessStatus';
import { TabNavigation } from './components/Auth/TabNavigation';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { CameraModal } from './components/Camera/CameraModal';
import { FaceLoginModal } from './components/Modals/FaceLoginModal';
import { QRScannerModal } from './components/Modals/QRScannerModal';
import { Dashboard } from './components/Dashboard/Dashboard';
import { UserCredential } from './components/Dashboard/UserCredential';
import { useCamera } from './hooks/useCamera';
import { ProcessStatus as ProcessStatusType } from './types/user.types';
import { hashPassword } from './utils/crypto';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFaceLoginOpen, setIsFaceLoginOpen] = useState(false);
  const [isQRLoginOpen, setIsQRLoginOpen] = useState(false);
  const [showCredential, setShowCredential] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('normal');
  const [processStatus, setProcessStatus] = useState<ProcessStatusType>({
    isVisible: false,
    title: '',
    description: '',
    progress: 0,
    icon: '🚀'
  });

  const { login, register, isLoading, currentUser } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { videoRef, stopCamera, switchCamera, capturePhoto } = useCamera();

  const showStatus = (title: string, description: string, progress: number, icon: string = '🚀') => {
    setProcessStatus({
      isVisible: true,
      title,
      description,
      progress,
      icon
    });
  };

  const hideStatus = () => {
    setProcessStatus(prev => ({ ...prev, isVisible: false }));
  };

  const handleLogin = async (email: string, password: string) => {
    showStatus('Validando', 'Verificando credenciales...', 30);
    const success = await login(email, password);
    
    if (success) {
      showStatus('Éxito', 'Login exitoso!', 100, '✅');
      setTimeout(hideStatus, 2000);
    } else {
      showStatus('Error', 'Credenciales incorrectas', 0, '❌');
      setTimeout(hideStatus, 3000);
    }
  };

  const handleRegister = async (userData: any) => {
    showStatus('Registrando', 'Creando tu cuenta...', 30);
    
    const userToRegister = {
      email: userData.email,
      phone: userData.phone,
      birthdate: userData.birthdate,
      nickname: userData.nickname,
      passwordHash: hashPassword(userData.password),
      notifications: userData.notifications
    };

    const success = await register(userToRegister);
    
    if (success) {
      showStatus('Éxito', 'Cuenta creada exitosamente!', 100, '✅');
      setTimeout(hideStatus, 2000);
    } else {
      showStatus('Error', 'Error al crear la cuenta', 0, '❌');
      setTimeout(hideStatus, 3000);
    }
  };

  const handleCameraCapture = async () => {
    if (!videoRef.current) return;
    
    showStatus('Procesando', 'Aplicando efectos...', 60);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const photo = capturePhoto(videoRef.current);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    showStatus('Completado', 'Registro exitoso!', 100, '✅');
    setTimeout(() => {
      setIsCameraOpen(false);
      hideStatus();
    }, 2000);
  };

  const handleFacialLogin = () => {
    setIsFaceLoginOpen(true);
  };

  const handleQRLogin = () => {
    setIsQRLoginOpen(true);
  };

  const handleResetPassword = () => {
    const email = prompt('🔄 Ingresa tu email para recuperar la contraseña:');
    if (email) {
      showStatus('Enviando', 'Procesando solicitud...', 50);
      setTimeout(() => {
        showStatus('Completado', 'Email enviado correctamente', 100, '✅');
        setTimeout(hideStatus, 2000);
      }, 2000);
    }
  };

  // Mostrar Dashboard si el usuario está autenticado
  if (currentUser) {
    if (showCredential) {
      return <UserCredential user={currentUser} onBack={() => setShowCredential(false)} />;
    }
    return <Dashboard onShowCredential={() => setShowCredential(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-135 from-teal-500/5 via-gray-400/10 to-teal-500/5 bg-size-400 bg-pos-0-50 animate-gradient-shift overflow-x-hidden relative">
      <FloatingElements />
      <ProcessStatus status={processStatus} />
      
      <div className="main-container">
        {/* Panel Lateral */}
        <div className="side-panel">
          <div className="logo">
            <h1>Analizador<span className="logo-accent">Pro</span></h1>
            <div className="logo-subtitle">Sistema Avanzado</div>
          </div>
          
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          {activeTab === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              onFacialLogin={handleFacialLogin}
              onQRLogin={handleQRLogin}
              onResetPassword={handleResetPassword}
              isLoading={isLoading}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onCameraCapture={() => setIsCameraOpen(true)}
            />
          )}
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
                <p className="feature-description">
                  Reconocimiento facial con precisión del 99.7% utilizando algoritmos de última generación.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3 className="feature-title">Ultra Rápido</h3>
                <p className="feature-description">
                  Procesamiento en tiempo real para una experiencia de usuario fluida y sin interrupciones.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">Máxima Seguridad</h3>
                <p className="feature-description">
                  Encriptación de nivel empresarial para proteger tus datos e identidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          stopCamera();
        }}
        videoRef={videoRef as React.RefObject<HTMLVideoElement>}
        onCapture={handleCameraCapture}
        onSwitchCamera={switchCamera}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        onEmojiAdd={(emoji) => console.log('Add emoji:', emoji)}
      />

      <FaceLoginModal
        isOpen={isFaceLoginOpen}
        onClose={() => setIsFaceLoginOpen(false)}
        onSuccess={() => {
          setIsFaceLoginOpen(false);
          hideStatus();
        }}
        onShowStatus={showStatus}
        onHideStatus={hideStatus}
      />

      <QRScannerModal
        isOpen={isQRLoginOpen}
        onClose={() => setIsQRLoginOpen(false)}
        onShowStatus={showStatus}
        onHideStatus={hideStatus}
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