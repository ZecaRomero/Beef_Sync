/**
 * Sistema unificado de notificações Toast
 * Centraliza todas as notificações do sistema em um único Context
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

/**
 * Hook para acessar o sistema de toast
 * @returns {Object} Objeto com métodos de toast (success, error, warning, info)
 * @throws {Error} Se usado fora do ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}

/**
 * Provider do sistema de Toast
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    // Verificação de segurança para evitar erros
    if (!message || typeof message !== 'string') {
      console.warn('ToastContext: message is invalid', message);
      return null;
    }

    const id = Date.now() + Math.random();
    const toast = { 
      id, 
      message: String(message), 
      type: type || 'info', 
      duration: duration || 5000 
    };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, duration = 5000) => {
      console.log('🟢 Toast Success:', message);
      return addToast(message, 'success', duration);
    },
    error: (message, duration = 5000) => {
      console.log('🔴 Toast Error:', message);
      return addToast(message, 'error', duration);
    },
    warning: (message, duration = 5000) => {
      console.log('🟡 Toast Warning:', message);
      return addToast(message, 'warning', duration);
    },
    info: (message, duration = 5000) => {
      console.log('🔵 Toast Info:', message);
      return addToast(message, 'info', duration);
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Container que renderiza os toasts usando Portal
 */
function ToastContainer({ toasts, removeToast }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const toastElement = (
    <div 
      id="toast-container"
      style={{ 
        position: 'fixed',
        top: '70px', 
        right: '24px', 
        zIndex: 2147483647, // Máximo z-index possível
        maxWidth: '384px',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((toast, index) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(toastElement, document.body);
}

/**
 * Item individual de toast
 */
function ToastItem({ toast, onClose, index }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  // Verificação de segurança para evitar erros com propriedades undefined
  if (!toast || typeof toast !== 'object') {
    console.warn('ToastItem: toast prop is invalid', toast);
    return null;
  }

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100 + (index * 50));
    return () => clearTimeout(timer);
  }, [index]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }, 300);
  };

  const getIcon = () => {
    const type = toast?.type || 'info';
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    const type = toast?.type || 'info';
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-700 shadow-green-100 dark:shadow-green-900/20';
      case 'error':
        return 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-700 shadow-red-100 dark:shadow-red-900/20';
      case 'warning':
        return 'bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-700 shadow-yellow-100 dark:shadow-yellow-900/20';
      default:
        return 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-blue-100 dark:shadow-blue-900/20';
    }
  };

  const baseStyles = {
    position: 'relative',
    zIndex: 2147483647,
    minWidth: '320px',
    maxWidth: '384px',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(4px)',
    transform: isEntering ? 'translateX(100%) scale(0.95)' : 
               isLeaving ? 'translateX(100%) scale(0.95)' : 
               'translateX(0) scale(1)',
    opacity: isEntering || isLeaving ? 0 : 1,
    transition: 'all 0.3s ease-out'
  };

  const getStyles = () => {
    const type = toast?.type || 'info';
    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          borderColor: '#10b981',
          color: '#065f46'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          borderColor: '#ef4444',
          color: '#7f1d1d'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          borderColor: '#f59e0b',
          color: '#78350f'
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: 'white',
          borderColor: '#3b82f6',
          color: '#1e3a8a'
        };
    }
  };

  return (
    <div style={getStyles()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0 }}>
            {getIcon()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'inherit',
              lineHeight: '1.4',
              margin: 0
            }}>
              {toast?.message || 'Mensagem não disponível'}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          style={{
            flexShrink: 0,
            marginLeft: '12px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            padding: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
            e.target.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#6b7280';
          }}
        >
          <XMarkIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}
