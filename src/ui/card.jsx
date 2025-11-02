
import React from 'react';
export function Card({ children, className = '', ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}
export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}
export function CardContent({ children, className = '' }) {
  return <div className={`card-content ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = '' }) {
  return <div className={`card-title ${className}`}>{children}</div>;
}
