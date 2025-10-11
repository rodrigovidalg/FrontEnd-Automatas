// src/components/Auth/RegisterForm.tsx
import React, { useState, useEffect } from 'react';

// Si no usas alias "@", cambia estos imports a rutas relativas:
import { api } from '../../services/api';
import { saveFaceToDB } from '../../services/facialAuthService';
import { API_ROUTES } from '../../utils/constants';

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

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailError('');
    if (name === 'password' || name === 'confirmPassword') setPasswordError('');
    if (formError) setFormError('');
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

    const requiredKeys: (keyof typeof formData)[] = ['nickname', 'email', 'fullName', 'password', 'phone'];
    for (const key of requiredKeys) {
      if (!formData[key]) {
        setFormError(`⚠️ Por favor completa el campo: ${key === 'fullName' ? 'nombre completo' : key}`);
        isValid = false;
        break;
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

    if (!validateForm()) return;

    try {
      setShowStatus(true);
      setStatusTitle('Validando');
      setStatusDescription('Verificando datos...');
      setStatusProgress(20);
      await new Promise(r => setTimeout(r, 400));

      setStatusTitle('Registrando');
      setStatusDescription('Creando cuenta en el servidor...');
      setStatusProgress(40);

      // 1) Registro
      const payloadRegister = {
        usuario: formData.nickname,
        email: formData.email,
        nombreCompleto: formData.fullName,
        password: formData.password,
        telefono: formData.phone
      };
      await api(API_ROUTES.REGISTER, { method: 'POST', json: payloadRegister });

      setStatusTitle('Autenticando');
      setStatusDescription('Generando sesión...');
      setStatusProgress(60);

      // 2) Login para token
      const loginRes = await api(API_ROUTES.LOGIN, {
        method: 'POST',
        json: { usuarioOrEmail: formData.nickname || formData.email, password: formData.password }
      });
      const token = loginRes.token || loginRes.Token || loginRes.accessToken;
      if (token) localStorage.setItem('token', token);

      setStatusTitle('Sincronizando');
      setStatusDescription('Consultando tu perfil...');
      setStatusProgress(75);

      // 3) /me para userId  (SIN API_ROUTES.ME)
      const me = await api('/api/Auth/me', { auth: true });
      const userId =
        me.id || me.userId || me.usuarioId || me.sub || (me.user && me.user.id);
      if (!userId) throw new Error('No se pudo obtener userId');

      setStatusTitle('Guardando biometría');
      setStatusDescription('Asociando tu rostro a la cuenta...');
      setStatusProgress(85);

      // 4) Si hay rostro parcial => guardar en DB
      const pending = localStorage.getItem('pendingFaceB64');
      if (pending) {
        await saveFaceToDB(String(userId), pending);
        localStorage.removeItem('pendingFaceB64');
      }

      setStatusTitle('Completado');
      setStatusDescription('Registro exitoso ✅');
      setStatusProgress(100);

      setTimeout(() => {
        setShowStatus(false);
        setFormData({
          nickname: '',
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          phone: '',
          notifications: 'email'
        });
        setRecaptchaVerified(false);
        alert('Registro completado');
      }, 800);
    } catch (err: any) {
      console.error(err);
      setStatusTitle('Error');
      setStatusDescription('No se pudo completar el registro.');
      setStatusProgress(0);
      setFormError(err?.message || 'Ocurrió un error en el servidor. Inténtalo más tarde.');
      setTimeout(() => setShowStatus(false), 2000);
    }
  };

  const handleRecaptchaVerified = () => {
    setRecaptchaVerified(true);
    if (formError.includes('reCAPTCHA')) setFormError('');
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

      <Recaptcha onVerified={handleRecaptchaVerified} value={recaptchaVerified} />

      <div className="register-buttons">
        <Button type="submit" variant="primary">
          🚀 Registrarse Ahora
        </Button>

        <Button type="button" variant="advanced" onClick={onCameraCapture}>
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
