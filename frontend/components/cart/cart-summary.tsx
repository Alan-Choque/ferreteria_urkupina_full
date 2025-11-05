"use client"

import type React from "react"

import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/price-formatter"
import { useState } from "react"
import Link from "next/link"

export function CartSummary() {
  const { items, applyCoupon, appliedCoupon, discount, clear } = useCart()
  const [couponCode, setCouponCode] = useState("")
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal >= 300 || appliedCoupon === "ENVIOGRATIS" ? 0 : 50
  const total = subtotal - discount + shipping

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    const result = applyCoupon(couponCode)
    setCouponMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    })
    setCouponCode("")

    setTimeout(() => setCouponMessage(null), 5000)
  }

  return (
    <div className="space-y-4">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">Subtotal</span>
        <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
      </div>

      {/* Discount */}
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Descuento ({appliedCoupon})</span>
          <span className="font-medium">-{formatPrice(discount)}</span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">
          Envío {shipping === 0 && <span className="text-green-600 font-medium">(Gratis)</span>}
        </span>
        <span className="font-medium text-neutral-900">{formatPrice(shipping)}</span>
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-neutral-200">
        <div className="flex justify-between items-center">
          <span className="font-bold text-neutral-900">Total</span>
          <span className="text-lg font-bold text-neutral-900">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Coupon Input */}
      <form onSubmit={handleApplyCoupon} className="space-y-2 pt-4 border-t border-neutral-200">
        <label className="block text-xs font-medium text-neutral-600">¿Tienes un código de cupón?</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Ingresa el código"
            maxLength={20}
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
            aria-label="Código de cupón"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-neutral-200 text-neutral-900 text-sm font-medium rounded hover:bg-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label="Aplicar cupón"
          >
            Aplicar
          </button>
        </div>
        {couponMessage && (
          <p
            className={`text-xs font-medium ${couponMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
            role="status"
          >
            {couponMessage.text}
          </p>
        )}
      </form>

      {/* CTAs */}
      <div className="space-y-2 pt-4 border-t border-neutral-200">
        <Link
          href="/checkout"
          className="block w-full py-2.5 bg-red-600 text-white font-bold rounded text-center hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Ir a pagar
        </Link>
        <button
          onClick={clear}
          className="w-full py-2.5 text-neutral-600 font-medium text-sm hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          aria-label="Vaciar carrito"
        >
          Vaciar carrito
        </button>
      </div>
    </div>
  )
}
