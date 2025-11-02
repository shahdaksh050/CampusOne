import React from 'react';
export function Badge({ children, className = '', variant = 'default' }) {
  let v = 'inline-flex items-center px-2 py-1 rounded';
  if (variant === 'outline') v += ' bg-transparent border border-border';
  if (variant === 'secondary') v += ' bg-secondary text-secondary-foreground';
  if (variant === 'destructive') v += ' text-destructive';
  return <span className={`${v} ${className}`}>{children}</span>;
}
