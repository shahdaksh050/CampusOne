import React from 'react';
import { cn } from './utils';

export function Badge({ children, className = '', variant = 'default' }) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all';
  let variantClass = 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30';
  
  if (variant === 'outline') {
    variantClass = 'bg-transparent border border-[var(--border)] text-[var(--foreground)]';
  }
  if (variant === 'secondary') {
    variantClass = 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]';
  }
  if (variant === 'destructive') {
    variantClass = 'bg-[var(--destructive)]/20 text-[var(--destructive)] border border-[var(--destructive)]/30';
  }
  if (variant === 'success') {
    variantClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
  }
  
  return <span className={cn(base, variantClass, className)}>{children}</span>;
}
