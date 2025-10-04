import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // ⬅️ NUEVO
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
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();                // ⬅️ NUEVO

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

      // ⬅️ REDIRECCIÓN AL DASHBOARD SOLO SI EL LOGIN FUE EXITOSO
      // Si quieres ver el estado unos ms antes de salir, descomenta el setTimeout:
      // setTimeout(() => navigate('/dashboard', { replace: true }), 300);
      navigate('/dashboard', { replace: true });
      return;
    } else {
      setStatusTitle('Error');
      setStatusDescription('Credenciales incorrectas');
      setStatusProgress(0);
      setTimeout(() => setShowStatus(false), 3000);
    }
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
    <form onSubmit={handleSubmit}>
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
      
      <Button type="submit" variant="primary">
        Iniciar Sesión
      </Button>
      
      {/* reCAPTCHA para Login */}
      <div className="recaptcha-container">
        <div className="recaptcha-header">🛡️ Verificación de Seguridad</div>
        <div className="recaptcha-wrapper">
          {/* En un entorno real, usaría el reCAPTCHA real */}
          <button 
            type="button"
            className="recaptcha-demo-btn" 
            onClick={simulateRecaptcha}
          >
            🤖 <span>Verificar que soy humano</span>
          </button>
        </div>
        <div className={`recaptcha-status ${recaptchaVerified ? 'verified' : ''}`}>
          Verificación humana completada
        </div>
      </div>
      
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
      
      <Button 
        type="button"
        variant="secondary" 
        onClick={onPasswordReset}
      >
        🔄 Recuperar Contraseña
      </Button>
      
      <ProcessStatus
        show={showStatus}
        title={statusTitle}
        description={statusDescription}
        progress={statusProgress}
      />
    </form>
  );
};

export default LoginForm;
