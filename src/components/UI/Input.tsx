import React from 'react';

interface InputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  autoComplete?: string; // ✅ AGREGADO: Soporte para autoComplete
}

const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className = '',
  name,
  autoComplete // ✅ AGREGADO: Destructurar autoComplete
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        name={name}
        autoComplete={autoComplete} // ✅ AGREGADO: Pasar autoComplete al input
      />
    </div>
  );
};

export default Input;