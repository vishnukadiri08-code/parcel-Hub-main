import React, { createContext, useContext, useState, useCallback } from 'react';
import { sounds } from '../utils/sound';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message = '', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);

    if (type === 'success') {
      sounds.playSuccessChime();
    } else if (type === 'error' || type === 'warning') {
      sounds.playAlertBeep();
    } else {
      sounds.playClickSound();
    }

    const newToast = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message, duration) => addToast('success', title, message, duration),
    error: (title, message, duration) => addToast('error', title, message, duration),
    warning: (title, message, duration) => addToast('warning', title, message, duration),
    info: (title, message, duration) => addToast('info', title, message, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

export function useToastState() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastState must be used within a ToastProvider');
  }
  return { toasts: context.toasts, removeToast: context.removeToast };
}
