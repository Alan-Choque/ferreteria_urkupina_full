"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useState } from "react"
import { CartDrawer } from "./cart-drawer"

export function MiniCartButton() {
  const { count } = useCart()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative text-neutral-800 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded p-1.5"
        aria-label={`Carrito de compras, ${count} artículo${count !== 1 ? "s" : ""}`}
      >
        <ShoppingCart className="w-6 h-6" />
        {count > 0 && (
          <span
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            aria-live="polite"
          >
            {count}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}
