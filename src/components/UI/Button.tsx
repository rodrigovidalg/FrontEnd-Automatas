import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'advanced';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const baseClasses = "btn w-full px-6 py-4 border-none rounded-xl font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: "btn-primary bg-gradient-135 from-teal-500 to-teal-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
    secondary: "btn-secondary bg-white/90 backdrop-blur text-gray-700 border border-gray-300/50 hover:bg-teal-50 hover:border-teal-500",
    advanced: "btn-advanced bg-gradient-135 from-teal-500 to-gray-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};