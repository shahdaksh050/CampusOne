import React from 'react';
export function Progress({ value = 0, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`w-full bg-muted rounded ${className}`} style={{ height: 8 }}>
      <div className="bg-primary h-full rounded" style={{ width: `${pct}%` }} />
    </div>
  );
}
