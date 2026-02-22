import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full text-start">
    {label && <label className="text-sm font-medium text-gray-700 ms-1">{label}</label>}
    <input 
      className={`
        px-3 py-2 rounded 
        bg-white 
        border border-gray-300 
        text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        placeholder:text-gray-500
        transition-colors 
        ${className}
      `}
      {...props}
    />
  </div>
);