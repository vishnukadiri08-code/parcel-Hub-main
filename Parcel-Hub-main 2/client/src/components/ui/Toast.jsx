import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useToastState } from '../../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastState();

  const getStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-cyber-emerald/40',
          bg: 'bg-command-900/90 shadow-glow-emerald',
          icon: <CheckCircle2 className="w-5 h-5 text-cyber-emerald shrink-0" />,
          title: 'text-cyber-emerald'
        };
      case 'error':
        return {
          border: 'border-cyber-red/50',
          bg: 'bg-command-900/95 shadow-glow-red',
          icon: <AlertCircle className="w-5 h-5 text-cyber-red shrink-0" />,
          title: 'text-cyber-red'
        };
      case 'warning':
        return {
          border: 'border-cyber-amber/50',
          bg: 'bg-command-900/90 shadow-glow-amber',
          icon: <AlertTriangle className="w-5 h-5 text-cyber-amber shrink-0" />,
          title: 'text-cyber-amber'
        };
      default:
        return {
          border: 'border-cyber-cyan/40',
          bg: 'bg-command-900/90 shadow-glow-cyan',
          icon: <Info className="w-5 h-5 text-cyber-cyan shrink-0" />,
          title: 'text-cyber-cyan'
        };
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getStyle(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto rounded-xl border backdrop-blur-xl p-4 ${style.bg} ${style.border} flex items-start space-x-3 text-slate-100 shadow-2xl relative overflow-hidden`}
            >
              <div className="mt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className={`text-sm font-semibold tracking-wide uppercase font-mono ${style.title}`}>
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
