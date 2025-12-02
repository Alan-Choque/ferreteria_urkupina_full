"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface Toast {
  id: string
  message: string
  type?: "success" | "error" | "info"
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: Toast["type"], duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: Toast["type"] = "success", duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    const toast: Toast = { id, message, type, duration }
    
    setToasts((prev) => [...prev, toast])
    
    if (duration > 0) {
      // Agregar tiempo extra para la animación de salida (500ms)
      setTimeout(() => {
        removeToast(id)
      }, duration + 500)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

