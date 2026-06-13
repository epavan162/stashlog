import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--fg-dim)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-11 px-4 rounded-input text-sm font-sans
            border outline-none transition-smooth
            placeholder:text-fg-faint
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-error focus:border-error focus:ring-1 focus:ring-error/20'
              : 'border-line-strong focus:border-accent focus:ring-1 focus:ring-accent/20'
            }
            ${className}
          `}
          style={{
            backgroundColor: 'var(--bg-elev)',
            color: 'var(--fg)',
          }}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs" style={{ color: 'var(--fg-faint)' }}>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
