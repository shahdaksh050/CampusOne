import React from 'react';
export function Input({ className = '', ...props }) {
  return <input className={`form-input ${className}`} {...props} />;
}
