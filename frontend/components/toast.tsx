"use client"

import { X, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Toast {
  id: string
  message: string
  type?: "success" | "error" | "info"
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, 3000) // Auto-close after 3 seconds

    return () => clearTimeout(timer)
  }, [toast.id, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4 min-w-[300px] max-w-md flex items-start gap-3"
    >
      <div className="flex-shrink-0">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-900 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

