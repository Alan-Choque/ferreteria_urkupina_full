"use client"

import { createContext, type ReactNode, useCallback, useEffect, useState } from "react"
import type { ID } from "@/lib/contracts"

export interface CartItem {
  id: number
  sku: string
  slug: string
  name: string
  price: number
  image?: string
  variantId: ID
  variantSku: string
  variantName: string
  variantPrice: number
  variantImage?: string
  qty: number
}

export interface CartState {
  items: CartItem[]
  count: number
  add: (item: Omit<CartItem, "qty">, qty?: number) => void
  remove: (variantId: ID) => void
  updateQty: (variantId: ID, qty: number) => void
  clear: () => void
  applyCoupon: (code: string) => { success: boolean; message: string; discount: number }
  appliedCoupon: string | null
  discount: number
}

export const CartContext = createContext<CartState | undefined>(undefined)

const STORAGE_KEY = "ferreteria-cart"
const COUPON_RULES: Record<string, { discount: number; type: "percentage" | "shipping" }> = {
  BIENVENIDO10: { discount: 10, type: "percentage" },
  ENVIOGRATIS: { discount: 0, type: "shipping" },
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { items: savedItems, coupon } = JSON.parse(saved)
        setItems(savedItems)
        setAppliedCoupon(coupon)
      } catch {
        console.error("Failed to restore cart from localStorage")
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, coupon: appliedCoupon }))
    }
  }, [items, appliedCoupon, mounted])

  const count = items.reduce((sum, item) => sum + item.qty, 0)

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId)
      if (existing) {
        return prev.map((i) => (i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { ...item, qty }]
    })
  }, [])

  const remove = useCallback((variantId: ID) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }, [])

  const updateQty = useCallback(
    (variantId: ID, qty: number) => {
      if (qty <= 0) {
        remove(variantId)
        return
      }
      setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i)))
    },
    [remove],
  )

  const clear = useCallback(() => {
    setItems([])
    setAppliedCoupon(null)
    setDiscount(0)
  }, [])

  const applyCoupon = useCallback(
    (code: string) => {
      const rule = COUPON_RULES[code.toUpperCase()]
      if (!rule) {
        return { success: false, message: "Código de cupón inválido", discount: 0 }
      }

      setAppliedCoupon(code.toUpperCase())

      if (rule.type === "percentage") {
        const subtotal = items.reduce((sum, item) => sum + item.variantPrice * item.qty, 0)
        const discountAmount = (subtotal * rule.discount) / 100
        setDiscount(discountAmount)
        return {
          success: true,
          message: `Cupón aplicado: ${rule.discount}% de descuento`,
          discount: discountAmount,
        }
      } else {
        setDiscount(0)
        return {
          success: true,
          message: "Cupón aplicado: Envío gratis",
          discount: 0,
        }
      }
    },
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        add,
        remove,
        updateQty,
        clear,
        applyCoupon,
        appliedCoupon,
        discount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
