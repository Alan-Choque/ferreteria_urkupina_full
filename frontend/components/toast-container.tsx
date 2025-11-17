"use client"

import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/lib/contexts/toast-context"
import { motion, AnimatePresence } from "framer-motion"

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4 min-w-[300px] max-w-md flex items-start gap-3"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
            </div>

            {/* Message */}
            <p className="flex-1 text-sm text-neutral-900 font-medium">{toast.message}</p>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-900 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

