import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../UI/Button';
import Input from '../UI/Input';
import ProcessStatus from '../UI/ProcessStatus';

interface LoginFormProps {
  onFaceLogin: () => void;
  onQRLogin: () => void;
  onPasswordReset: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onFaceLogin, 
  onQRLogin, 
  onPasswordReset 
}) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !password) {
      alert('⚠️ Por favor completa todos los campos');
      return;
    }

    if (!recaptchaVerified) {
      alert('⚠️ Por favor completa la verificación reCAPTCHA');
      return;
    }
    
    setShowStatus(true);
    setStatusTitle('Validando');
    setStatusDescription('Verificando credenciales...');
    setStatusProgress(30);
    
    const success = await login(user, password);
    
    if (success) {
      setStatusTitle('Éxito');
      setStatusDescription('Login exitoso, redirigiendo...');
      setStatusProgress(100);

      navigate('/dashboard', { replace: true });
      return;
    } else {
      setStatusTitle('Error');
      setStatusDescription('Credenciales incorrectas');
      setStatusProgress(0);
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      alert('⚠️ Por favor ingresa tu email');
      return;
    }

    setShowStatus(true);
    setStatusTitle('Enviando');
    setStatusDescription('Enviando email de recuperación...');
    setStatusProgress(50);
    
    setTimeout(() => {
      setStatusTitle('Éxito');
      setStatusDescription('Email de recuperación enviado. Revisa tu bandeja de entrada.');
      setStatusProgress(100);
      
      setTimeout(() => {
        setMode('login');
        setResetEmail('');
        setShowStatus(false);
        setRecaptchaVerified(false);
      }, 2000);
    }, 1500);
  };

  const handleRecaptchaVerified = () => {
    setRecaptchaVerified(true);
    setStatusTitle('Verificado');
    setStatusDescription('reCAPTCHA completado correctamente');
    setStatusProgress(50);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 2000);
  };

  const simulateRecaptcha = () => {
    setTimeout(() => {
      handleRecaptchaVerified();
    }, 1500);
  };

  return (
    <>
      {mode === 'login' ? (
        <form onSubmit={handleSubmit}>
          {/* Logo de la Universidad */}
          <div className="university-logo-container">
            <div className="logo-wrapper">
              <div className="logo-circle">
                <img 
                  src="/assets/umg-logo.png"
                  alt="Logo de la Universidad Mariano Gálvez" 
                  className="logo-image"
                />
              </div>
              <h3 className="university-name">Universidad Mariano Gálvez</h3>
            </div>
          </div>

          <Input
            id="loginUser"
            type="text"
            placeholder="Ingrese su usuario o email"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            label="Usuario o Email"
            name="loginUser"
          />
          
          <Input
            id="loginPassword"
            type="password"
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Contraseña"
            name="loginPassword"
          />
          
          <button 
            type="button"
            className="forgot-password-link"
            onClick={() => setMode('reset')}
          >
            ¿Olvidaste tu contraseña?
          </button>

          {/* reCAPTCHA antes del botón de inicio de sesión */}
          <div className="recaptcha-container">
            <div className="recaptcha-header">🛡️ Verificación de Seguridad</div>
            <div className="recaptcha-wrapper">
              <button 
                type="button"
                className={`recaptcha-demo-btn ${recaptchaVerified ? 'verified' : ''}`}
                onClick={simulateRecaptcha}
                disabled={recaptchaVerified}
              >
                {recaptchaVerified ? '✅' : '🤖'} 
                <span>{recaptchaVerified ? 'Verificado correctamente' : 'Verificar que soy humano'}</span>
              </button>
            </div>
            {recaptchaVerified && (
              <div className="recaptcha-status verified">
                ✓ Verificación completada
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={!recaptchaVerified}
          >
            Iniciar Sesión
          </Button>
          
          <div className="divider"><span>O continuar con</span></div>
          
          <Button 
            type="button"
            variant="advanced" 
            onClick={onFaceLogin}
          >
            🤖 Reconocimiento Facial
          </Button>
          
          <Button 
            type="button"
            variant="secondary" 
            onClick={onQRLogin}
          >
            📱 Código QR
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset}>
          <div className="reset-header">
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setMode('login');
                setResetEmail('');
                setRecaptchaVerified(false);
              }}
            >
              ← Volver
            </button>
            <h2>Recuperar Contraseña</h2>
          </div>

          <p className="reset-description">
            Ingresa el email asociado a tu cuenta y te enviaremos un link para restablecer tu contraseña.
          </p>
          
          <Input
            id="resetEmail"
            type="email"
            placeholder="Ingresa tu email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            label="Email Registrado"
            name="resetEmail"
          />
          
          <Button type="submit" variant="primary">
            Enviar Email de Recuperación
          </Button>

          <button
            type="button"
            className="cancel-reset"
            onClick={() => {
              setMode('login');
              setResetEmail('');
            }}
          >
            Cancelar
          </button>
        </form>
      )}
      
      <ProcessStatus
        show={showStatus}
        title={statusTitle}
        description={statusDescription}
        progress={statusProgress}
      />
    </>
  );
};

export default LoginForm;