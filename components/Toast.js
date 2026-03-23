import { useState, useEffect, useRef, useCallback } from 'react'

const TOAST_TIMEOUTS = {
  success: 4000,
  error: 6000,
  warning: 4000,
  info: 4000,
}

const TOAST_COLORS = {
  success: '#00FF41',
  error: '#FF2D55',
  warning: '#FFB800',
  info: '#00D4FF',
}

const TOAST_SYMBOLS = {
  success: '[+]',
  error: '[!]',
  warning: '[~]',
  info: '[i]',
}

let toastId = 0
const toasts = []
const listeners = []

function emitChange() {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i]()
  }
}

export const toast = {
  subscribe(listener) {
    listeners.push(listener)
    return function unsubscribe() {
      const index = listeners.indexOf(listener)
      listeners.splice(index, 1)
    }
  },
  getSnapshot() {
    return toasts
  },
  _add(message, type) {
    const id = ++toastId
    toasts.push({ id, message, type, timer: null })
    emitChange()
    const timeout = TOAST_TIMEOUTS[type]
    if (timeout) {
      const timer = setTimeout(() => this.dismiss(id), timeout)
      const index = toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        toasts[index].timer = timer
      }
    }
    return id
  },
  success(message) { return this._add(message, 'success') },
  error(message) { return this._add(message, 'error') },
  warning(message) { return this._add(message, 'warning') },
  info(message) { return this._add(message, 'info') },
  dismiss(id) {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      clearTimeout(toasts[index].timer)
      toasts.splice(index, 1)
      emitChange()
    }
  }
}

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState(toasts)

  useEffect(() => {
    return toast.subscribe(() => {
      setActiveToasts(toast.getSnapshot())
    })
  }, [])

  return (
    <div style={containerStyles}>
      {activeToasts.map((t, i) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => toast.dismiss(t.id)} index={i} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss, index }) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setIsVisible(true)
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    // Allow fade-out animation before removing from DOM
    setTimeout(onDismiss, 300)
  }, [onDismiss])

  const typeColor = TOAST_COLORS[toast.type] || '#00FF41'
  const typeSymbol = TOAST_SYMBOLS[toast.type] || '[i]'

  return (
    <div style={{
      ...toastItemStyles,
      borderColor: typeColor,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      zIndex: 1000 - index, // Stack toasts correctly
    }}>
      <span style={toastSymbolStyles}>{typeSymbol}</span>
      <span style={toastTextStyles}>{toast.message}</span>
      <button onClick={handleDismiss} style={closeButtonStyles}>×</button>
    </div>
  )
}

const containerStyles = {
  position: 'fixed',
  bottom: 32,
  right: 32,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  zIndex: 9999,
  // Basic mobile responsiveness: bottom-center on smaller screens
  '@media (max-width: 768px)': {
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
  }
}

const toastItemStyles = {
  background: '#0d1117',
  border: '1px solid',
  borderRadius: 4,
  padding: '12px 20px',
  minWidth: 280,
  maxWidth: 400,
  fontFamily: 'JetBrains Mono',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
}

const toastSymbolStyles = {
  flexShrink: 0,
  fontWeight: 'bold',
  color: 'rgba(255,255,255,0.7)',
}

const toastTextStyles = {
  flexGrow: 1,
  color: '#fff',
}

const closeButtonStyles = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 18,
  cursor: 'pointer',
  padding: '0 0 2px 0',
  lineHeight: 1,
  flexShrink: 0,
  transition: 'color 0.2s',
  ':hover': {
    color: '#fff',
  }
}
