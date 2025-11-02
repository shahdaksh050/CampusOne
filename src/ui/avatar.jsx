import React from 'react';
export function Avatar({ children, className = '' }) {
  return <div className={`avatar ${className}`}>{children}</div>;
}
export function AvatarImage({ src, alt = '' }) {
  return <img src={src} alt={alt} className="w-full h-full object-cover rounded-full" />;
}
export function AvatarFallback({ children, className = '' }) {
  return <div className={`avatar-fallback ${className}`}>{children}</div>;
}
