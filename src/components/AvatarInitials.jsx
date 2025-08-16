import React from 'react';

export default function AvatarInitials({ firstName = '', lastName = '', fallback = '', size = 36, className = '' }) {
  const text = (firstName || lastName)
    ? `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()
    : (fallback || 'U').split(/[@\s]+/).filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('');
  const style = {
    width: size,
    height: size,
    background: 'linear-gradient(135deg, var(--chart-1), var(--chart-2))',
  };
  return (
    <div className={`rounded-full flex items-center justify-center text-black font-bold ${className}`} style={style}>
      {text}
    </div>
  );
}
