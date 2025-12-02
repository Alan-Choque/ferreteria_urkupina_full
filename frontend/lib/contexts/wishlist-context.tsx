"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import type { ProductListItem } from "@/lib/services/products-service"

interface WishlistItem extends ProductListItem {
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addToWishlist: (product: ProductListItem) => void
  removeFromWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = "ferreteria_urkupina_wishlist"

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])

  // Cargar wishlist desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setItems(parsed)
      }
    } catch (err) {
      console.error("Error loading wishlist from localStorage:", err)
    }
  }, [])

  // Guardar wishlist en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error("Error saving wishlist to localStorage:", err)
    }
  }, [items])

  const addToWishlist = useCallback((product: ProductListItem) => {
    setItems((prev) => {
      // Verificar si ya está en la lista
      if (prev.some((item) => item.id === product.id)) {
        return prev
      }
      return [
        ...prev,
        {
          ...product,
          addedAt: new Date().toISOString(),
        },
      ]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const isInWishlist = useCallback(
    (productId: number) => {
      return items.some((item) => item.id === productId)
    },
    [items]
  )

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }
  return context
}

