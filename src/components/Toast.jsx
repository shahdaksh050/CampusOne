import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext();

// Bridge to allow module-level toast calls like toast.success(...) from any file
let toastBridge = { push: (message, type = 'info') => console.warn('Toast not mounted:', { message, type }) };

export const toast = {
  info: (message) => toastBridge.push(message, 'info'),
  success: (message) => toastBridge.push(message, 'success'),
  warning: (message) => toastBridge.push(message, 'warning'),
  error: (message) => toastBridge.push(message, 'error'),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  };

  // Wire the module-level toast bridge to the provider instance
  useEffect(() => {
    toastBridge.push = push;
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div id="toast-root" className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map(t => <Toast key={t.id} {...t} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function IconForType({ type }) {
  if (type === 'success') return <CheckCircle />;
  if (type === 'warning' || type === 'error') return <AlertTriangle />;
  return <Info />;
}

function Toast({ message, type }) {
  // Determine colors based on type
  let bgColor = 'bg-[var(--card)]';
  let borderColor = 'border-[var(--border)]';
  let iconColor = 'text-[var(--foreground)]';
  
  if (type === 'success') {
    bgColor = 'bg-green-500/95';
    borderColor = 'border-green-400';
    iconColor = 'text-white';
  } else if (type === 'error') {
    bgColor = 'bg-[var(--destructive)]/95';
    borderColor = 'border-[var(--destructive)]';
    iconColor = 'text-white';
  } else if (type === 'warning') {
    bgColor = 'bg-orange-500/95';
    borderColor = 'border-orange-400';
    iconColor = 'text-white';
  } else if (type === 'info') {
    bgColor = 'bg-blue-500/95';
    borderColor = 'border-blue-400';
    iconColor = 'text-white';
  }
  
  return (
    <div className={`toast-notification p-4 ${bgColor} border-2 ${borderColor} ${iconColor} rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] backdrop-blur-sm animate-slideIn`}>
      <div className="w-6 h-6 flex-shrink-0"><IconForType type={type} /></div>
      <div className="flex-1 font-medium">{message}</div>
    </div>
  );
}

// helper to render toast provider UI in App (works around hooks inside root)
// usage: place <useToastRenderer /> somewhere in the tree. Implemented below.
export function useToastRenderer() {
  // noop placeholder so we can import name from App; kept for parity
  return null;
}
