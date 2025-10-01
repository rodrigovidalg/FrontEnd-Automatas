import React, { useState } from 'react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onFacialLogin: () => void;
  onQRLogin: () => void;
  onResetPassword: () => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onFacialLogin,
  onQRLogin,
  onResetPassword,
  isLoading
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container active">
      <Input
        type="text"
        value={email}
        onChange={setEmail}
        placeholder="Ingrese su usuario o email"
        label="Usuario o Email"
      />
      
      <Input
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Ingrese su contraseña"
        label="Contraseña"
      />
      
      <Button 
        type="submit" 
        variant="primary" 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
      </Button>

      <div className="recaptcha-container my-6 flex flex-col items-center gap-4">
        <div className="recaptcha-header text-gray-600 text-sm font-semibold opacity-80">
          🛡️ Verificación de Seguridad
        </div>
        <div className="recaptcha-wrapper bg-white/95 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-300/30 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
          <div className="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"></div>
        </div>
        <div className="recaptcha-status verified hidden bg-green-50 text-green-700 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-400 backdrop-blur border-2 border-green-300/30 items-center gap-2">
          Verificación humana completada
        </div>
      </div>

      <div className="divider flex items-center my-6 text-gray-600 text-sm">
        <span className="px-4">O continuar con</span>
      </div>

      <Button 
        variant="advanced" 
        onClick={onFacialLogin}
        className="mb-3"
      >
        🤖 Reconocimiento Facial
      </Button>
      
      <Button 
        variant="secondary" 
        onClick={onQRLogin}
        className="mb-3"
      >
        📱 Código QR
      </Button>
      
      <Button 
        variant="secondary" 
        onClick={onResetPassword}
      >
        🔄 Recuperar Contraseña
      </Button>
    </form>
  );
};