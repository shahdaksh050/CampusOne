import React from 'react';
import { cn } from './utils';

export function Input({ className = '', ...props }) {
  return (
    <input 
      className={cn(
        'form-input bg-[var(--input-background)] text-[var(--foreground)] border-[var(--border)] rounded-md px-3 py-2',
        'focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent',
        'placeholder:text-[var(--muted-foreground)]',
        'transition-all duration-200',
        className
      )} 
      {...props} 
    />
  );
}
