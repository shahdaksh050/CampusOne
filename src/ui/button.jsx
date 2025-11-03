import React from 'react';
import { cn } from './utils';

export function Button({ children, className = '', variant = 'default', size, ...rest }) {
  const base = 'inline-flex items-center gap-2 rounded-md transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed';
  let variantClass = 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-md hover:shadow-lg';
  if (variant === 'ghost') variantClass = 'bg-transparent hover:bg-[var(--secondary)]';
  if (variant === 'outline') variantClass = 'bg-transparent border border-[var(--border)] hover:bg-[var(--secondary)]';
  if (variant === 'default') variantClass = 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-md hover:shadow-lg';
  if (variant === 'destructive') variantClass = 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 shadow-md';

  const sizeClass = size === 'icon' ? 'p-2' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';

  return (
    <button className={cn(base, variantClass, sizeClass, className)} {...rest}>
      {children}
    </button>
  );
}
