import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';
import { validatePasswordStrength } from '../../utils/validation';

interface RegisterFormProps {
  onRegister: (userData: any) => void;
  onCameraCapture: () => void;
}

interface PasswordStrength {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onCameraCapture }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    birthdate: '',
    nickname: '',
    password: '',
    notifications: 'email' as 'email' | 'whatsapp' | 'both'
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ 
    strength: 'weak', 
    score: 0 
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      const strengthResult = validatePasswordStrength(value);
      setPasswordStrength(strengthResult);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.email || !formData.phone || !formData.nickname || !formData.password) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    // Llamar al callback de registro
    onRegister(formData);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'strength-weak';
      case 'fair': return 'strength-fair';
      case 'good': return 'strength-good';
      case 'strong': return 'strength-strong';
      default: return 'strength-weak';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container active">
      <div className="form-title">
        <h2>Crear Cuenta</h2>
        <p>Únete a la próxima generación de autenticación</p>
      </div>

      <Input
        type="email"
        value={formData.email}
        onChange={(value) => handleInputChange('email', value)}
        placeholder="tu@email.com"
        label="Email"
      />

      <Input
        type="tel"
        value={formData.phone}
        onChange={(value) => handleInputChange('phone', value)}
        placeholder="+502 0000-0000"
        label="Teléfono"
      />

      <Input
        type="date"
        value={formData.birthdate}
        onChange={(value) => handleInputChange('birthdate', value)}
        label="Fecha de Nacimiento"
      />

      <Input
        type="text"
        value={formData.nickname}
        onChange={(value) => handleInputChange('nickname', value)}
        placeholder="Tu apodo"
        label="Nickname"
      />

      <div className="form-group">
        <label className="form-label">Contraseña</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="Contraseña segura"
          className="form-input"
        />
        <div className="password-strength">
          <div className={`password-strength-fill ${getStrengthColor(passwordStrength.strength)}`}></div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notificaciones</label>
        <select 
          value={formData.notifications}
          onChange={(e) => handleInputChange('notifications', e.target.value)}
          className="form-input"
        >
          <option value="email">Solo Email</option>
          <option value="whatsapp">Solo WhatsApp</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      <Button type="submit" variant="advanced" className="mb-6">
        📸 Continuar con Foto
      </Button>

      <div className="recaptcha-container">
        <div className="recaptcha-header">🛡️ Verificación de Seguridad</div>
        <div className="recaptcha-wrapper">
          <button 
            type="button"
            className="recaptcha-demo-btn"
            onClick={() => {
              const statusEl = document.getElementById('recaptchaRegisterStatus');
              if (statusEl) {
                statusEl.classList.add('verified');
              }
            }}
          >
            🤖 <span>Verificar que soy humano</span>
          </button>
        </div>
        <div className="recaptcha-status" id="recaptchaRegisterStatus">
          Verificación humana completada
        </div>
      </div>
    </form>
  );
};