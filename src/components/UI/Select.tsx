import React from 'react';

interface SelectProps {
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  id,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className = '',
  name,
  children
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <select
        id={id}
        className="form-input"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        name={name}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;