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
  const baseStyles = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30",
    secondary: "bg-white/50 text-slate-700 hover:bg-white/80 border border-white/40 shadow-sm backdrop-blur-md",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
    ghost: "text-slate-600 hover:bg-slate-100/50"
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

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl ${className}`} {...props}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-slate-100 text-slate-700' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} border border-white/20`}>
    {children}
  </span>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-slate-600 ms-1">{label}</label>}
    <input 
      className={`px-4 py-2 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 ${className}`}
      {...props}
    />
  </div>
);