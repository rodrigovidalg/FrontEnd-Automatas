import React from 'react';

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  className = ''
}) => {
  return (
    <div className="form-group relative mb-6">
      {label && (
        <label className="form-label absolute -top-2 left-4 bg-white/95 backdrop-blur px-3 py-1 text-gray-600 text-sm font-semibold rounded-lg border border-gray-300/30 shadow-sm transition-all duration-300">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`form-input w-full px-5 py-4 border-2 border-gray-300/60 rounded-xl bg-white text-gray-900 text-base transition-all duration-300 shadow-sm focus:outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/10 ${className}`}
      />
    </div>
  );
};