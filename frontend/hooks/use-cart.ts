"use client"

import { useContext } from "react"
import { CartContext, type CartState } from "@/lib/contexts/cart-context"

export function useCart(): CartState {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
