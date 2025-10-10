import React, { useState, useEffect } from 'react';
import './Recaptcha.css';

interface RecaptchaProps {
  onVerified: () => void;
  value: boolean;
}

const Recaptcha: React.FC<RecaptchaProps> = ({ onVerified, value }) => {
  const [isVerified, setIsVerified] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsVerified(value);
  }, [value]);

  const handleClick = () => {
    if (isVerified || isLoading) return;

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
      onVerified();
    }, 2500); // Un poco más de tiempo para la animación
  };

  return (
    <div className={`recaptcha-innovator ${isVerified ? 'is-verified' : ''} ${isLoading ? 'is-loading' : ''}`}>
      <div className="recaptcha-scanner" onClick={handleClick}>
        {isLoading && <div className="scanner-ring"></div>}
        {isVerified && <span className="checkmark">✓</span>}
      </div>
      
      <div className="recaptcha-info">
        <div className="recaptcha-logo">
          <span className="recaptcha-icon">Recaptcha</span>
        </div>
        <p className="recaptcha-status-text">
          {isLoading ? 'Escaneando...' : isVerified ? 'Verificado' : 'Iniciar Verificación'}
        </p>
      </div>
    </div>
  );
};

export default Recaptcha;