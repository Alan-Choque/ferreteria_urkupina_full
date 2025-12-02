"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/lib/contexts/toast-context"
import { authService } from "@/lib/services/auth-service"
import { Loader2, Heart, Trash2, ShoppingCart } from "lucide-react"
import { formatPrice } from "@/lib/price-formatter"
import type { ProductListItem } from "@/lib/services/products-service"

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const { add } = useCart()
  const { showToast } = useToast()
  const router = useRouter()
  const [removingId, setRemovingId] = useState<number | null>(null)

  const handleAddToCart = async (product: ProductListItem) => {
    // No requiere autenticación para agregar al carrito
    // El carrito funciona sin cuenta (se guarda en localStorage)
    // Solo se requiere autenticación al finalizar la compra (checkout)
    
    // Obtener la primera variante disponible
    const variant = product.variantes?.[0]
    if (!variant || !variant.precio) {
      showToast("Este producto no tiene precio disponible", "error")
      return
    }

    const displayedImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg"

    add(
      {
        id: product.id,
        sku: product.sku || "",
        slug: product.slug,
        name: product.nombre,
        price: variant.precio,
        image: displayedImage,
        variantId: variant.id.toString(),
        variantSku: String(variant.id),
        variantName: variant.nombre || "Variante",
        variantPrice: variant.precio,
        variantImage: displayedImage,
      },
      1
    )

    showToast(`Producto "${product.nombre}" se agregó al carrito`, "success")
  }

  const handleRemove = async (productId: number) => {
    setRemovingId(productId)
    // Pequeño delay para feedback visual
    setTimeout(() => {
      removeFromWishlist(productId)
      setRemovingId(null)
      showToast("Producto eliminado de tu lista de deseos", "info")
    }, 200)
  }

  const handleClearAll = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todos los productos de tu lista de deseos?")) {
      clearWishlist()
      showToast("Lista de deseos vaciada", "info")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Mi Lista de Deseos</h2>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 border border-red-600 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            Vaciar Lista
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2 text-lg font-medium">Tu lista de deseos está vacía</p>
          <p className="text-neutral-500 mb-6 text-sm">Agrega productos que te interesen para verlos aquí</p>
          <Link
            href="/catalogo"
            className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Explorar Productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const variant = item.variantes?.[0]
            const price = variant?.precio ?? item.price ?? 0
            const displayedImage = item.image || item.imagenes?.[0]?.url || "/placeholder.svg"
            const isRemoving = removingId === item.id

            return (
              <div
                key={item.id}
                className={`border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-all ${
                  isRemoving ? "opacity-50" : ""
                }`}
              >
                <Link href={`/producto/${item.slug || item.id}`}>
                  <div className="relative h-48 bg-neutral-100">
                    <img
                      src={displayedImage}
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/producto/${item.slug || item.id}`}>
                    <h3 className="font-bold text-neutral-900 mb-2 hover:text-red-600 transition-colors line-clamp-2">
                      {item.nombre}
                    </h3>
                  </Link>
                  {item.marca && (
                    <p className="text-xs text-neutral-500 mb-2">{item.marca.nombre}</p>
                  )}
                  <p className="text-green-600 font-bold mb-4 text-lg">{formatPrice(price)}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Agregar al Carrito
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isRemoving}
                      className="w-full py-2 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-100 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
