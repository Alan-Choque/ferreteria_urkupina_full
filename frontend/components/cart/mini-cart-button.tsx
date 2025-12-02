"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CartDrawer } from "./cart-drawer"

export function MiniCartButton() {
  const { count } = useCart()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (count > 0) {
      setJustAdded(true)
      const timer = setTimeout(() => setJustAdded(false), 600)
      return () => clearTimeout(timer)
    }
  }, [count])

  return (
    <>
      <motion.button
        onClick={() => setIsDrawerOpen(true)}
        className="relative text-neutral-800 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded p-1.5"
        aria-label={`Carrito de compras, ${count} artículo${count !== 1 ? "s" : ""}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={justAdded ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={justAdded ? { 
          type: "keyframes", 
          times: [0, 0.5, 1],
          duration: 0.6 
        } : { type: "spring", stiffness: 400, damping: 17 }}
      >
        <ShoppingCart className="w-6 h-6" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              aria-live="polite"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}
