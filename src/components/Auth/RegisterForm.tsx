import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validatePassword } from '../../utils/validation';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select'; // Importamos el componente Select
import ProcessStatus from '../UI/ProcessStatus';

interface RegisterFormProps {
  onCameraCapture: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onCameraCapture }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    nickname: '',
    password: '',
    notifications: 'email' as 'email' | 'whatsapp' | 'both'
  });
  
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (formData.password) {
      const { strength } = validatePassword(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    for (const [key, value] of Object.entries(formData)) {
      if (!value) {
        alert(`⚠️ Por favor completa el campo: ${key}`);
        return;
      }
    }
    
    if (!recaptchaVerified) {
      alert('⚠️ Por favor completa la verificación reCAPTCHA');
      return;
    }
    
    setShowStatus(true);
    setStatusTitle('Validando');
    setStatusDescription('Verificando datos...');
    setStatusProgress(20);
    
    // Simular validación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatusTitle('Procesando');
    setStatusDescription('Creando cuenta...');
    setStatusProgress(50);
    
    // En un entorno real, aquí se capturaría la foto
    const userData = {
      ...formData,
      originalPhoto: 'data:image/jpeg;base64,simulated_original_photo',
      processedPhoto: 'data:image/jpeg;base64,simulated_processed_photo'
    };
    
    const success = await register(userData);
    
    if (success) {
      setStatusTitle('Completado');
      setStatusDescription('Registro exitoso!');
      setStatusProgress(100);
      setTimeout(() => setShowStatus(false), 2000);
    } else {
      setStatusTitle('Error');
      setStatusDescription('Error al registrar usuario');
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

  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 1) return 'strength-weak';
    if (passwordStrength <= 2) return 'strength-fair';
    if (passwordStrength <= 3) return 'strength-good';
    return 'strength-strong';
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-title">
        <h2>Crear Cuenta</h2>
        <p>Únete a la próxima generación de autenticación</p>
      </div>
      
      <Input
        id="regEmail"
        type="email"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={handleChange}
        name="email"
        label="Email"
      />
      
      <Input
        id="regPhone"
        type="tel"
        placeholder="+502 0000-0000"
        value={formData.phone}
        onChange={handleChange}
        name="phone"
        label="Teléfono"
      />
  
      <Input
        id="regNickname"
        type="text"
        placeholder="Tu apodo"
        value={formData.nickname}
        onChange={handleChange}
        name="nickname"
        label="Nickname"
      />
      
      <div className="form-group">
        <label className="form-label">Contraseña</label>
        <input
          id="regPassword"
          type="password"
          className="form-input"
          placeholder="Contraseña segura"
          value={formData.password}
          onChange={handleChange}
          name="password"
        />
        <div className="password-strength">
          <div className={`password-strength-fill ${getPasswordStrengthClass()}`}></div>
        </div>
      </div>
      
      <Select
        id="regNotifications"
        value={formData.notifications}
        onChange={handleChange}
        name="notifications"
        label="Notificaciones"
      >
        <option value="email">Solo Email</option>
        <option value="whatsapp">Solo WhatsApp</option>
        <option value="both">Ambos</option>
      </Select>
      
      <Button 
        type="button"
        variant="advanced" 
        onClick={onCameraCapture}
      >
        📸 Continuar con Foto
      </Button>
      
      {/* reCAPTCHA para Registro */}
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
      
      <ProcessStatus
        show={showStatus}
        title={statusTitle}
        description={statusDescription}
        progress={statusProgress}
      />
    </form>
  );
};

export default RegisterForm;