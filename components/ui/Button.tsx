import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Primary: Traditional blue
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700",
    
    // Secondary: Traditional gray
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    
    // Danger: Traditional red
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-700",
    
    // Ghost: Simple link style
    ghost: "text-blue-600 hover:text-blue-800 hover:underline"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};