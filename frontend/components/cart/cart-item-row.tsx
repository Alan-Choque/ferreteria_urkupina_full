"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Trash2, Plus, Minus } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import type { CartItem } from "@/lib/contexts/cart-context"
import { formatPrice } from "@/lib/price-formatter"

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty, remove } = useCart()

  return (
    <div className="flex gap-3 py-4 border-b border-neutral-200 last:border-0">
      {/* Image */}
      <div className="flex-shrink-0">
        {item.image && (
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-md bg-neutral-100"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/producto/${item.id}`}
          className="text-sm font-semibold text-neutral-900 hover:text-red-600 transition-colors line-clamp-2"
        >
          {item.name}
        </Link>
        {item.sku && <p className="text-xs text-neutral-500 mt-1">SKU: {item.sku}</p>}
        <p className="text-sm font-bold text-green-600 mt-2">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 border border-neutral-300 rounded-md bg-white">
          <motion.button
            onClick={() => updateQty(item.variantId, item.qty - 1)}
            className="p-1 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1 rounded"
            aria-label={`Reducir cantidad de ${item.name}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Minus className="w-3.5 h-3.5 text-neutral-600" />
          </motion.button>
          <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
          <motion.button
            onClick={() => updateQty(item.variantId, item.qty + 1)}
            className="p-1 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1 rounded"
            aria-label={`Aumentar cantidad de ${item.name}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Plus className="w-3.5 h-3.5 text-neutral-600" />
          </motion.button>
        </div>

        <motion.button
          onClick={() => remove(item.variantId)}
          className="p-1 text-neutral-500 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
          aria-label={`Eliminar ${item.name} del carrito`}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}
