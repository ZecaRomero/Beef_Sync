import React, { useState, useEffect } from 'react'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Componente de Navegação entre Animais
export function AnimalNavigation({ currentIndex, totalAnimals, onNavigate, animalIds }) {
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < totalAnimals - 1

  const handlePrevious = () => {
    if (hasPrevious && animalIds[currentIndex - 1]) {
      onNavigate(animalIds[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (hasNext && animalIds[currentIndex + 1]) {
      onNavigate(animalIds[currentIndex + 1])
    }
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious()
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, hasPrevious, hasNext])

  return (
    <div className="animal-navigation">
      <button 
        className="nav-btn nav-btn-prev" 
        onClick={handlePrevious}
        disabled={!hasPrevious}
        title="Animal anterior (←)"
      >
        <ChevronLeftIcon />
        <span>Anterior</span>
      </button>

      <div className="animal-counter">
        {currentIndex + 1} de {totalAnimals}
      </div>

      <button 
        className="nav-btn nav-btn-next" 
        onClick={handleNext}
        disabled={!hasNext}
        title="Próximo animal (→)"
      >
        <span>Próximo</span>
        <ChevronRightIcon />
      </button>
    </div>
  )
}

// Componente de Campo Editável
export function EditableField({ 
  value, 
  onSave, 
  type = 'text', 
  placeholder = 'Clique para editar',
  className = ''
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditValue(value || '')
  }, [value])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="editable-field-container">
        {type === 'textarea' ? (
          <textarea
            className="edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            rows={3}
          />
        ) : (
          <input
            type={type}
            className="edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        )}
        <div className="edit-actions">
          <button 
            className="edit-btn-save" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <CheckIcon className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button 
            className="edit-btn-cancel" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            <XMarkIcon className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`editable-field ${className}`}
      onClick={() => setIsEditing(true)}
      title="Clique para editar"
    >
      {value || placeholder}
    </div>
  )
}

// Componente de Toast Notification
export function ToastNotification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: (
      <svg className="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#ef4444' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#f59e0b' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3b82f6' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className={`toast-notification toast-${type}`}>
      {icons[type]}
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <XMarkIcon />
      </button>
    </div>
  )
}

// Componente de Accordion
export function Accordion({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`accordion-item ${isOpen ? 'active' : ''}`}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <svg 
          className="accordion-icon" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="accordion-content">
        <div className="accordion-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Componente de Progress Bar
export function ProgressBar({ value, max = 100, label = '', showPercentage = true }) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="progress-bar-wrapper">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-purple-600">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Componente de Chip/Tag
export function Chip({ label, icon, onClick, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 hover:bg-purple-600 hover:text-white',
    success: 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white',
    warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-600 hover:text-white',
    danger: 'bg-red-100 text-red-700 hover:bg-red-600 hover:text-white',
    info: 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
  }

  return (
    <div 
      className={`chip ${variants[variant]}`}
      onClick={onClick}
    >
      {icon && <span className="chip-icon">{icon}</span>}
      <span>{label}</span>
    </div>
  )
}

// Componente de Loading Skeleton
export function SkeletonLoader({ width = '100%', height = '20px', className = '' }) {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ width, height }}
    />
  )
}

// Componente de Card com Flip
export function FlipCard({ front, back }) {
  return (
    <div className="flip-card">
      <div className="flip-card-inner">
        <div className="flip-card-front">
          {front}
        </div>
        <div className="flip-card-back">
          {back}
        </div>
      </div>
    </div>
  )
}

// Componente de Tooltip
export function Tooltip({ children, text, position = 'top' }) {
  return (
    <div className="tooltip-enhanced" data-tooltip={text}>
      {children}
    </div>
  )
}

// Hook personalizado para gerenciar toasts
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, ToastContainer }
}

// Componente de Estatística Animada
export function AnimatedStat({ value, label, icon, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1500 // 1.5 segundos
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="stat-card hover-lift">
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <div className="stat-value">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default {
  AnimalNavigation,
  EditableField,
  ToastNotification,
  Accordion,
  ProgressBar,
  Chip,
  SkeletonLoader,
  FlipCard,
  Tooltip,
  useToast,
  AnimatedStat
}
