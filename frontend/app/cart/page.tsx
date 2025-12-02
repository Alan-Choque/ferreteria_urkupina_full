"use client"

import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { CartItemRow } from "@/components/cart/cart-item-row"
import { CartSummary } from "@/components/cart/cart-summary"

export default function CartPage() {
  const { items } = useCart()

  return (
    <main className="min-h-screen bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Carrito de Compras</h1>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 mb-4">Tu carrito está vacío</p>
              <Link
                href="/categorias/herramientas-construccion"
                className="inline-block px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              {/* Items */}
              <div className="col-span-2 space-y-4 bg-neutral-50 rounded-lg p-6">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>

              {/* Summary */}
              <div className="col-span-1 h-fit sticky top-24">
                <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h2 className="font-bold text-lg text-neutral-900 mb-4">Resumen</h2>
                  <CartSummary />
                </div>
              </div>
            </div>
          )}
        </div>
    </main>
  )
}
