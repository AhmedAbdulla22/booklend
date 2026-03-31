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
  const baseStyles = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Primary: Emerald Green
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 border border-transparent",
    
    // Secondary: Light Gray Glass (Light) / Dark Gray Glass (Dark)
    secondary: "bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-md",
    
    // Danger: Red
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 border border-transparent",
    
    // Ghost: Transparent hover effect
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
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