import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 p-4 rounded shadow-lg border text-sm pointer-events-auto transition-all duration-300 transform translate-y-0 bg-white ${
              t.type === 'success' ? 'border-status-success text-text-primary' :
              t.type === 'error' ? 'border-status-error text-text-primary' :
              t.type === 'warning' ? 'border-status-warning text-text-primary' :
              'border-blue-300 text-text-primary'
            }`}
            role="alert"
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-status-success shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-status-error shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            
            <div className="flex-1 font-medium">{t.message}</div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
