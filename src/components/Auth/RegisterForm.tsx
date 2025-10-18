import React, { useState, useEffect, useMemo } from 'react';

// Si no usas alias "@", cambia estos imports a rutas relativas:
import { api } from '../../services/api';
import { saveFaceToDB } from '../../services/facialAuthService';
import { API_ROUTES, COLORS } from '../../utils/constants';

import { validatePassword } from '../../utils/validation';
import Button from '../UI/Button';
import Input from '../UI/Input';
import ProcessStatus from '../UI/ProcessStatus';
import Recaptcha from '../UI/Recaptcha';

interface RegisterFormProps {
  onCameraCapture: () => void;
}

type ToastType = 'success' | 'warning' | 'error';

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

  // --- Toast state (inline, sin crear archivo nuevo) ---
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('success');
  const [toastMessage, setToastMessage] = useState('');

  // estilos del toast en línea (adaptado a tu paleta) — lo movemos al dock inferior
  const toastStyles = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      width: '100%',
      borderRadius: 12,
      padding: '12px 14px',
      boxShadow: '0 8px 22px rgba(0,0,0,.20)',
      color: COLORS.white,
      display: toastOpen ? 'flex' : 'none',
      alignItems: 'start',
      gap: 10,
      lineHeight: 1.35,
      fontSize: 14,
      border: '1px solid rgba(0,0,0,.06)',
    };
    const bg =
      toastType === 'success' ? COLORS.secondaryAccent :
      toastType === 'warning' ? COLORS.accent :
      '#333';
    return { ...base, background: bg };
  }, [toastOpen, toastType]);

  const showToast = (type: ToastType, message: string, ms = 6000) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(true);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastOpen(false), ms);
  };

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
    } else {
      setPasswordStrength(0);
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

      // 1) Registro (el backend dispara el PDF/QR después del commit)
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

      // 3) /me para userId
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

      // 5) Confirmar/forzar envío del PDF con reintento controlado
      setStatusTitle('Enviando credenciales');
      setStatusDescription('Generando y enviando tu PDF con QR al correo…');
      setStatusProgress(95);

      try {
        await api(API_ROUTES.SEND_CARD_NOW, {
          method: 'POST',
          // Si luego pones [Authorize] en el endpoint, añade: auth: true
          json: { usuarioId: Number(userId) }
        });
        showToast('success', `¡Listo! Enviamos tu carnet a ${formData.email}.`);
      } catch (sendErr: any) {
        console.warn('[SEND_CARD_NOW] WARN:', sendErr?.message || sendErr);
        showToast(
          'warning',
          'Tu cuenta se creó con éxito. No pudimos confirmar el envío automático del correo.\n' +
          'Revisa tu bandeja de entrada/spam o intenta reenviarlo desde tu perfil.'
        );
      }

      setStatusTitle('Completado');
      setStatusDescription('Registro exitoso ✅ Revisa tu correo.');
      setStatusProgress(100);

      // Reset suave
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
      }, 800);
    } catch (err: any) {
      console.error(err);
      setStatusTitle('Error');
      const msg =
        err?.message?.includes('HTTP 500') ? 'El servidor encontró un problema al registrar. Inténtalo nuevamente.' :
        err?.message?.includes('NetworkError') ? 'No pudimos comunicarnos con el servidor. Verifica tu conexión.' :
        err?.message || 'Ocurrió un error inesperado. Inténtalo más tarde.';
      setStatusDescription(msg);
      setStatusProgress(0);
      setFormError(msg);
      showToast('error', `No se pudo completar el registro.\nDetalle: ${msg}`);
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

      {/* === ORDEN NUEVO AL FINAL === */}
      {/* 1) Botón "Registrarse con Foto" */}
      <div className="register-buttons" style={{ display: 'flex', gap: 12, marginTop: 10, marginBottom: 6 }}>
        <Button type="button" variant="advanced" onClick={onCameraCapture}>
          📸 Registrarse con Foto
        </Button>
      </div>

      {/* 2) reCAPTCHA */}
      <div style={{ margin: '6px 0 10px' }}>
        <Recaptcha onVerified={handleRecaptchaVerified} value={recaptchaVerified} />
      </div>

      {/* 3) Botón "Registrarse Ahora" (al final) */}
      <div className="register-buttons" style={{ display: 'flex', gap: 12, marginTop: 6 }}>
        <Button type="submit" variant="primary">
          🚀 Registrarse Ahora
        </Button>
      </div>

      {/* Puedes mantener ProcessStatus si ya lo usabas en otras pantallas */}
      <ProcessStatus
        show={showStatus}
        title={statusTitle}
        description={statusDescription}
        progress={statusProgress}
      />

      {/* === DOCK INFERIOR: Toast + Tarjeta de Estado (Depuración/Progreso) === */}
      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 420,
          maxWidth: '92vw'
        }}
      >
        {/* Toast flotante (usando estilos ya definidos) */}
        <div style={toastStyles} role="status" aria-live="polite">
          <div style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>
            {toastType === 'success' ? '✅' : toastType === 'warning' ? '⚠️' : '❌'}
          </div>
          <div style={{ whiteSpace: 'pre-line' }}>{toastMessage}</div>
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            aria-label="Cerrar"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: COLORS.white,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Tarjeta de estado compacta (profesional y visual) */}
        {showStatus && (
          <div
            style={{
              background: COLORS.black,
              color: COLORS.white,
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 8px 22px rgba(0,0,0,.25)',
              border: `1px solid ${COLORS.darkGray}`,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>Estado del proceso</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: statusProgress >= 100 ? COLORS.secondaryAccent : COLORS.accent
                }}
              />
              <div style={{ fontWeight: 600 }}>{statusTitle || '...'}</div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
              {statusDescription || 'Procesando…'}
            </div>
            <div
              style={{
                height: 6,
                background: COLORS.darkGray,
                borderRadius: 999,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${Math.min(Math.max(statusProgress, 0), 100)}%`,
                  height: '100%',
                  background: COLORS.secondaryAccent,
                  transition: 'width .35s ease'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default RegisterForm;
