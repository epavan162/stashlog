import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-pill transition-smooth focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-accent text-white hover:brightness-110 active:brightness-95',
    secondary: 'border border-line-strong text-fg hover:bg-bg-elev active:bg-line',
    ghost: 'text-fg-dim hover:bg-bg-elev hover:text-fg active:bg-line',
    danger: 'bg-error text-white hover:brightness-110 active:brightness-95',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm gap-1.5 relative after:absolute after:content-[""] after:-top-1 after:-bottom-1 after:left-0 after:right-0',
    md: 'h-11 px-6 text-sm gap-2',
    lg: 'h-12 px-8 text-base gap-2.5',
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { y: -2 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
