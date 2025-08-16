import React from 'react';
import { cn } from './utils';

export function Button({ children, className = '', variant = 'default', size, ...rest }) {
  const base = 'inline-flex items-center gap-2 rounded-md transition';
  let variantClass = 'bg-primary text-primary-foreground';
  if (variant === 'ghost') variantClass = 'bg-transparent';
  if (variant === 'outline') variantClass = 'bg-transparent border border-border';
  if (variant === 'default') variantClass = 'bg-primary text-primary-foreground';
  if (variant === 'destructive') variantClass = 'text-destructive';

  const sizeClass = size === 'icon' ? 'p-2' : size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2';

  return (
    <button className={cn(base, variantClass, sizeClass, className)} {...rest}>
      {children}
    </button>
  );
}
