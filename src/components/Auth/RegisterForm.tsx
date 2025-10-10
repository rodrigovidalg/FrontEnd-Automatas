import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validatePassword } from '../../utils/validation';
import Button from '../UI/Button';
import Input from '../UI/Input';
import ProcessStatus from '../UI/ProcessStatus';
import Recaptcha from '../UI/Recaptcha';

interface RegisterFormProps {
  onCameraCapture: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onCameraCapture }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    notifications: 'email' as 'email' | 'whatsapp' | 'both'
  });
  
  // --- Estados de Errores y Validación ---
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // NUEVO: Estado para errores generales del formulario
  const [formError, setFormError] = useState('');

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);
  
  const { register } = useAuth();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar errores al escribir
    if (name === 'email') setEmailError('');
    if (name === 'password' || name === 'confirmPassword') setPasswordError('');
    if (formError) setFormError(''); // Limpiar error general al interactuar
  };

  useEffect(() => {
    if (formData.password) {
      const { strength } = validatePassword(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password]);

  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
    } else {
      setPasswordError('');
    }
  }, [formData.password, formData.confirmPassword]);

  // --- MEJORA: Función de validación centralizada ---
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!emailRegex.test(formData.email)) {
      setEmailError('Por favor, introduce un correo electrónico válido.');
      isValid = false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      isValid = false;
    }

    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'confirmPassword' && !value) {
        setFormError(`⚠️ Por favor completa el campo: ${key === 'fullName' ? 'nombre completo' : key}`);
        isValid = false;
      }
    }
    
    if (!recaptchaVerified) {
      setFormError('⚠️ Por favor completa la verificación reCAPTCHA');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return; // Si la validación falla, detener aquí
    }
    
    setShowStatus(true);
    setStatusTitle('Validando');
    setStatusDescription('Verificando datos...');
    setStatusProgress(20);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatusTitle('Procesando');
    setStatusDescription('Creando cuenta...');
    setStatusProgress(50);
    
    const userData = {
      ...formData,
      confirmPassword: undefined, 
      originalPhoto: 'data:image/jpeg;base64,simulated_original_photo',
      processedPhoto: 'data:image/jpeg;base64,simulated_processed_photo'
    };
    
    const success = await register(userData);
    
    if (success) {
      setStatusTitle('Completado');
      setStatusDescription('Registro exitoso!');
      setStatusProgress(100);
      // Limpiar formulario después de un registro exitoso
      setTimeout(() => {
        setFormData({
          nickname: '', email: '', fullName: '', password: '', confirmPassword: '', phone: '', notifications: 'email'
        });
        setRecaptchaVerified(false);
      }, 1500);
    } else {
      setStatusTitle('Error');
      setStatusDescription('No se pudo completar el registro. Inténtalo de nuevo.');
      setStatusProgress(0);
      setFormError('Ocurrió un error en el servidor. Por favor, inténtalo más tarde.');
    }
    
    setTimeout(() => setShowStatus(false), 3000);
  };

  const handleRecaptchaVerified = () => {
    setRecaptchaVerified(true);
    // Limpiar cualquier error de reCAPTCHA previo
    if (formError.includes('reCAPTCHA')) {
      setFormError('');
    }
  };

  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 1) return 'strength-weak';
    if (passwordStrength <= 2) return 'strength-fair';
    if (passwordStrength <= 3) return 'strength-good';
    return 'strength-strong';
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-title">
        <h2>Crear Cuenta</h2>
        <p>Únete a la próxima generación de autenticación</p>
      </div>

      {/* NUEVO: Banner para errores generales del formulario */}
      {formError && <div className="form-error-banner">{formError}</div>}
      
      <Input
        id="regNickname"
        type="text"
        placeholder="Tu apodo"
        value={formData.nickname}
        onChange={handleChange}
        name="nickname"
        label="Usuario"
      />
      
      <Input
        id="regEmail"
        type="email"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={handleChange}
        name="email"
        label="Correo"
      />
      {/* El mensaje de error se muestra aquí */}
      {emailError && <p className="error-message">{emailError}</p>}
      
      <Input
        id="regFullName"
        type="text"
        placeholder="Tu nombre completo"
        value={formData.fullName}
        onChange={handleChange}
        name="fullName"
        label="Nombre Completo"
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

      <div className="form-group">
        <label className="form-label">Confirmar Contraseña</label>
        <input
          id="regConfirmPassword"
          type="password"
          className={`form-input ${passwordError ? 'input-error' : ''}`}
          placeholder="Repite tu contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          name="confirmPassword"
        />
        {passwordError && <p className="error-message">{passwordError}</p>}
      </div>
      
      <Input
        id="regPhone"
        type="tel"
        placeholder="+502 0000-0000"
        value={formData.phone}
        onChange={handleChange}
        name="phone"
        label="Teléfono"
      />

      <Recaptcha 
        onVerified={handleRecaptchaVerified} 
        value={recaptchaVerified} 
      />
      
      <div className="register-buttons">
        <Button 
          type="submit"
          variant="primary"
        >
          🚀 Registrarse Ahora
        </Button>
        
        <Button 
          type="button"
          variant="advanced" 
          onClick={onCameraCapture}
        >
          📸 Registrarse con Foto
        </Button>
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