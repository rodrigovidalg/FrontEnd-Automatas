import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'advanced';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  style
}) => {
  const getButtonClass = () => {
    const baseClass = 'btn';
    switch (variant) {
      case 'secondary':
        return `${baseClass} btn-secondary`;
      case 'advanced':
        return `${baseClass} btn-advanced`;
      default:
        return `${baseClass} btn-primary`;
    }
  };

  return (
    <button
      type={type}
      className={`${getButtonClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;