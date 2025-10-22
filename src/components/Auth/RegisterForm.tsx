import React, { useState, useEffect, useMemo } from 'react';

// Servicios
import { api } from '../../services/api';
import { saveFaceToDB, sendCardWithOptionalEffects } from '../../services/facialAuthService';
import { API_ROUTES, COLORS } from '../../utils/constants';
import { validatePassword } from '../../utils/validation';

// Componentes
import Button from '../UI/Button';
import Input from '../UI/Input';
import ProcessStatus from '../UI/ProcessStatus';
import Recaptcha from '../UI/Recaptcha';

interface RegisterFormProps {
  onCameraCapture: () => void;
}

type ToastType = 'success' | 'warning' | 'error';

/**
 * Formulario de registro optimizado con envío de email en background.
 * 
 * FLUJO OPTIMIZADO:
 * 1. Submit → Registro en backend (<500ms) - Email se envía automáticamente en background
 * 2. Login automático → Token obtenido
 * 3. Mostrar éxito INMEDIATAMENTE
 * 4. En background (NO bloquea):
 *    - Asociar biometría (si hay foto pendiente)
 *    - Reenvío con efectos (si corresponde) y restauración de segmentada
 *    - El email ya está siendo enviado por el backend
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onCameraCapture }) => {
  // ===== ESTADO DEL FORMULARIO =====
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    notifications: 'email' as 'email' | 'whatsapp' | 'both'
  });

  // ===== ESTADO DE VALIDACIÓN =====
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  // ===== ESTADO DE PROCESO =====
  const [showStatus, setShowStatus] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusProgress, setStatusProgress] = useState(0);

  // ===== ESTADO DE TOAST =====
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('success');
  const [toastMessage, setToastMessage] = useState('');

  // ===== REGEX DE VALIDACIÓN =====
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // ===== ESTILOS DEL TOAST (MEMOIZADOS) =====
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

  // ===== FUNCIÓN PARA MOSTRAR TOAST =====
  const showToast = (type: ToastType, message: string, ms = 6000) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(true);
    
    // Limpiar timeout anterior
    (window as any).clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastOpen(false), ms);
  };

  // ===== MANEJADORES DE CAMBIO =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al escribir
    if (name === 'email') setEmailError('');
    if (name === 'password' || name === 'confirmPassword') setPasswordError('');
    if (formError) setFormError('');
  };

  // ===== VALIDACIÓN DE FUERZA DE CONTRASEÑA (EN TIEMPO REAL) =====
  useEffect(() => {
    if (formData.password) {
      const { strength } = validatePassword(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // ===== VALIDACIÓN DE CONTRASEÑAS COINCIDENTES =====
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
    } else {
      setPasswordError('');
    }
  }, [formData.password, formData.confirmPassword]);

  // ===== VALIDACIÓN DEL FORMULARIO =====
  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    // Validar email
    if (!emailRegex.test(formData.email)) {
      setEmailError('Por favor, introduce un correo electrónico válido.');
      isValid = false;
    }

    // Validar coincidencia de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      isValid = false;
    }

    // Validar campos requeridos
    const requiredKeys: (keyof typeof formData)[] = [
      'nickname', 'email', 'fullName', 'password', 'phone'
    ];
    
    for (const key of requiredKeys) {
      if (!formData[key]) {
        const fieldNames: Record<string, string> = {
          nickname: 'usuario',
          email: 'correo electrónico',
          fullName: 'nombre completo',
          password: 'contraseña',
          phone: 'teléfono'
        };
        
        setFormError(`⚠️ Por favor completa el campo: ${fieldNames[key]}`);
        isValid = false;
        break;
      }
    }

    // Validar reCAPTCHA
    if (!recaptchaVerified) {
      setFormError('⚠️ Por favor completa la verificación reCAPTCHA');
      isValid = false;
    }

    return isValid;
  };

  // ===== SUBMIT DEL FORMULARIO (OPTIMIZADO PARA EMAIL) =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // ===== FASE 1: REGISTRO (RÁPIDO - EMAIL EN BACKGROUND) =====
      setShowStatus(true);
      setStatusTitle('Registrando');
      setStatusDescription('Creando tu cuenta...');
      setStatusProgress(30);

      const payloadRegister = {
        usuario: formData.nickname,
        email: formData.email,
        nombreCompleto: formData.fullName,
        password: formData.password,
        telefono: formData.phone
      };

      // ✅ Backend registra usuario Y envía email en background automáticamente
      const registerRes = await api(API_ROUTES.REGISTER, { 
        method: 'POST', 
        json: payloadRegister 
      });

      console.log('[REGISTER] Respuesta exitosa:', registerRes);

      // ===== FASE 2: LOGIN AUTOMÁTICO =====
      setStatusTitle('Autenticando');
      setStatusDescription('Generando sesión segura...');
      setStatusProgress(60);

      const loginRes = await api(API_ROUTES.LOGIN, {
        method: 'POST',
        json: { 
          usuarioOrEmail: formData.nickname || formData.email, 
          password: formData.password 
        }
      });

      // Guardar token (intentar múltiples nombres de campo)
      const token = loginRes.token || loginRes.Token || loginRes.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        console.log('[REGISTER] Token guardado correctamente');
      } else {
        console.warn('[REGISTER] No se encontró token en la respuesta:', loginRes);
      }

      // ===== FASE 3: OBTENER USER ID =====
      setStatusTitle('Sincronizando');
      setStatusDescription('Configurando perfil...');
      setStatusProgress(80);

      const me = await api('/api/Auth/me', { auth: true });
      const userId = me.id || me.userId || me.usuarioId || me.sub || (me.user && me.user.id);

      if (!userId) {
        throw new Error('No se pudo obtener el ID de usuario');
      }

      console.log('[REGISTER] Usuario ID obtenido:', userId);

      // ===== MOSTRAR ÉXITO INMEDIATAMENTE =====
      setStatusTitle('¡Registro Exitoso!');
      setStatusDescription('Tu cuenta está lista ✅');
      setStatusProgress(100);

      showToast(
        'success', 
        `¡Bienvenido ${formData.fullName}! 🎉\n\nTu cuenta se creó exitosamente y tu carnet con código QR está siendo enviado a ${formData.email}.\n\nRevisa tu bandeja de entrada en los próximos minutos.`,
        8000
      );

      // ===== FASE 4: TAREAS EN BACKGROUND (NO BLOQUEAN) =====
      // 4A. Asociar biometría (si hay foto pendiente)
      const pendingFace = localStorage.getItem('pendingFaceB64');
      if (pendingFace) {
        setTimeout(async () => {
          try {
            // Guardamos la segmentada en BD (ACTIVA)
            await saveFaceToDB(String(userId), pendingFace);
            console.log('[BIOMETRIA] Asociada correctamente');

            showToast('success', '📸 Biometría facial vinculada exitosamente');

            // 4B. Reenvío reforzado del carnet (con efectos si existen) y restauración de segmentada
            try {
              await sendCardWithOptionalEffects({ usuarioId: String(userId), clearAfter: true });
              console.log('[CARNET] Enviado con efectos (si había) y segmentada restaurada');
            } catch (err: any) {
              console.warn('[CARNET] Error al enviar con efectos (no crítico):', err?.message || err);
              // El backend ya envió en background; este paso solo refuerza para asegurar la foto correcta
            }
          } catch (err: any) {
            console.warn('[BIOMETRIA] Error al asociar (no crítico):', err?.message || err);

            showToast(
              'warning', 
              'Tu cuenta está lista, pero no pudimos asociar la foto automáticamente. Puedes agregarla después desde tu perfil.',
              7000
            );
          }
        }, 500);
      }

      // ===== LIMPIAR FORMULARIO =====
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
        setPasswordStrength(0);
      }, 2000);

    } catch (err: any) {
      console.error('[REGISTER] Error completo:', err);

      // ===== MANEJO DE ERRORES =====
      setStatusTitle('Error');
      
      let errorMsg = 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
      
      // Mensajes específicos según el tipo de error
      if (err?.message?.includes('HTTP 500')) {
        errorMsg = '🔧 El servidor encontró un problema. Intenta nuevamente en unos segundos.';
      } else if (err?.message?.includes('Usuario o email ya existen') || 
                 err?.message?.toLowerCase().includes('duplicado')) {
        errorMsg = '👤 Este usuario o email ya está registrado. Intenta iniciar sesión o usa otro email.';
      } else if (err?.message?.includes('NetworkError') || 
                 err?.message?.includes('Failed to fetch') ||
                 err?.message?.includes('fetch failed')) {
        errorMsg = '🌐 No pudimos conectar con el servidor. Verifica tu conexión a internet.';
      } else if (err?.message?.includes('timeout')) {
        errorMsg = '⏱️ La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      setStatusDescription(errorMsg);
      setStatusProgress(0);
      setFormError(errorMsg);
      
      showToast('error', `❌ Error al registrar:\n${errorMsg}`, 8000);
      
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  // ===== MANEJADOR DE RECAPTCHA =====
  const handleRecaptchaVerified = () => {
    setRecaptchaVerified(true);
    if (formError.includes('reCAPTCHA')) {
      setFormError('');
    }
  };

  // ===== CLASE DE FUERZA DE CONTRASEÑA =====
  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 1) return 'strength-weak';
    if (passwordStrength <= 2) return 'strength-fair';
    if (passwordStrength <= 3) return 'strength-good';
    return 'strength-strong';
  };

  // ===== RENDER =====
  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-title">
          <h2>Crear Cuenta</h2>
          <p>Únete a la próxima generación de autenticación</p>
        </div>

        {/* Banner de error general */}
        {formError && (
          <div className="form-error-banner" role="alert">
            {formError}
          </div>
        )}

        {/* Campo: Usuario */}
        <Input
          id="regNickname"
          type="text"
          placeholder="Tu apodo único"
          value={formData.nickname}
          onChange={handleChange}
          name="nickname"
          label="Usuario"
          autoComplete="username"
        />

        {/* Campo: Email */}
        <Input
          id="regEmail"
          type="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={handleChange}
          name="email"
          label="Correo Electrónico"
          autoComplete="email"
        />
        {emailError && (
          <p className="error-message" role="alert">{emailError}</p>
        )}

        {/* Campo: Nombre Completo */}
        <Input
          id="regFullName"
          type="text"
          placeholder="Tu nombre completo"
          value={formData.fullName}
          onChange={handleChange}
          name="fullName"
          label="Nombre Completo"
          autoComplete="name"
        />

        {/* Campo: Contraseña */}
        <div className="form-group">
          <label className="form-label" htmlFor="regPassword">
            Contraseña
          </label>
          <input
            id="regPassword"
            type="password"
            className="form-input"
            placeholder="Contraseña segura"
            value={formData.password}
            onChange={handleChange}
            name="password"
            autoComplete="new-password"
          />
          {/* Indicador de fuerza */}
          <div className="password-strength" aria-label="Indicador de fuerza de contraseña">
            <div className={`password-strength-fill ${getPasswordStrengthClass()}`}></div>
          </div>
        </div>

        {/* Campo: Confirmar Contraseña */}
        <div className="form-group">
          <label className="form-label" htmlFor="regConfirmPassword">
            Confirmar Contraseña
          </label>
          <input
            id="regConfirmPassword"
            type="password"
            className={`form-input ${passwordError ? 'input-error' : ''}`}
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            name="confirmPassword"
            autoComplete="new-password"
          />
        {passwordError && (
            <p className="error-message" role="alert">{passwordError}</p>
          )}
        </div>

        {/* Campo: Teléfono */}
        <Input
          id="regPhone"
          type="tel"
          placeholder="+502 0000-0000"
          value={formData.phone}
          onChange={handleChange}
          name="phone"
          label="Teléfono"
          autoComplete="tel"
        />

        {/* Botón: Registrar con Foto */}
        <div className="register-buttons" style={{ display: 'flex', gap: 12, marginTop: 10, marginBottom: 6 }}>
          <Button 
            type="button" 
            variant="advanced" 
            onClick={onCameraCapture}
          >
            📸 Tomar Foto de Registro
          </Button>
        </div>

        {/* reCAPTCHA */}
        <div style={{ margin: '6px 0 10px' }}>
          <Recaptcha 
            onVerified={handleRecaptchaVerified} 
            value={recaptchaVerified} 
          />
        </div>

        {/* Botón: Registrarse */}
        <div className="register-buttons" style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={!recaptchaVerified}
          >
            🚀 Registrarse Ahora
          </Button>
        </div>

        {/* Proceso de registro (modal overlay) */}
        <ProcessStatus
          show={showStatus}
          title={statusTitle}
          description={statusDescription}
          progress={statusProgress}
        />
      </form>

      {/* ===== DOCK INFERIOR: TOAST + ESTADO ===== */}
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
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Toast de notificaciones */}
        <div style={toastStyles} role="status">
          <div style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>
            {toastType === 'success' ? '✅' : toastType === 'warning' ? '⚠️' : '❌'}
          </div>
          <div style={{ whiteSpace: 'pre-line', flex: 1 }}>
            {toastMessage}
          </div>
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            aria-label="Cerrar notificación"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: COLORS.white,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Indicador de proceso en tiempo real */}
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
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
              Estado del proceso
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusProgress >= 100 ? COLORS.secondaryAccent : COLORS.accent
                }}
              />
              <div style={{ fontWeight: 600 }}>
                {statusTitle || 'Procesando...'}
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
              {statusDescription || 'Por favor espera...'}
            </div>
            {/* Barra de progreso */}
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
    </>
  );
};

export default RegisterForm;
