import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const Component = hover || onClick ? motion.div : 'div';

  const motionProps = hover || onClick
    ? {
        whileHover: { y: -2, borderColor: 'var(--line-strong)' },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={`
        rounded-card p-6 border transition-smooth
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--line)',
      }}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
}
