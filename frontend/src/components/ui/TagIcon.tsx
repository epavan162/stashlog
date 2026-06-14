import React from 'react';
import { Bug, Zap, GitPullRequest, AlertTriangle, BookOpen, Layers, Info } from 'lucide-react';

interface TagIconProps {
  tag: string;
  size?: number;
  className?: string;
  color?: string;
}

export function TagIcon({ tag, size = 14, className = '', color }: TagIconProps) {
  const t = tag.toLowerCase().trim();
  const getStyle = (defaultColor: string) => {
    return color ? { color } : { color: defaultColor };
  };

  switch (t) {
    case 'bug':
      return (
        <Bug 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--error)')}
        />
      );
    case 'feature':
      return (
        <Zap 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--accent-teal)')}
        />
      );
    case 'review':
      return (
        <GitPullRequest 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--accent-purple)')}
        />
      );
    case 'blocked':
      return (
        <AlertTriangle 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--accent-amber)')}
        />
      );
    case 'learning':
      return (
        <BookOpen 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--accent-emerald)')}
        />
      );
    case 'all':
      return (
        <Layers 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--accent)')}
        />
      );
    default:
      return (
        <Info 
          size={size} 
          strokeWidth={2.5}
          className={`flex-shrink-0 ${className}`} 
          style={getStyle('var(--fg-dim)')}
        />
      );
  }
}
