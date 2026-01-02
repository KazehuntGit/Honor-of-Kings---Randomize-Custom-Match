
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disableSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disableSound = false,
  onClick,
  ...props 
}) => {
  const baseStyles = "relative font-cinzel font-bold transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale uppercase tracking-widest clip-corner-sm flex items-center justify-center";
  
  const sizeStyles = {
    sm: "px-4 py-1 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  const variants = {
    primary: `
      bg-gradient-to-r from-[#8a6d3b] to-[#dcb06b] 
      text-[#05090f] 
      hover:brightness-110 
      hover:shadow-[0_0_15px_rgba(220,176,107,0.4)]
    `,
    secondary: `
      bg-[#0a1a2f] 
      text-[#dcb06b] 
      border border-[#dcb06b]/30 
      hover:bg-[#112440] 
      hover:border-[#dcb06b]
    `,
    outline: `
      bg-transparent 
      text-[#dcb06b] 
      border border-[#dcb06b] 
      hover:bg-[#dcb06b]/10
    `,
    danger: `
      bg-gradient-to-r from-red-900 to-red-700 
      text-white 
      hover:shadow-[0_0_15px_rgba(220,50,50,0.4)]
    `,
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`} 
      onClick={handleClick}
      {...props}
    >
      {/* Internal shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Corner accents */}
      {variant !== 'danger' && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40 pointer-events-none"></div>
        </>
      )}
    </button>
  );
};
