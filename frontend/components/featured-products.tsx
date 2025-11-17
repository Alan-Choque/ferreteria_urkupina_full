"use client"

import { Heart, Truck, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { productsService, type ProductListItem } from "@/lib/services/products-service"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/lib/contexts/toast-context"

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { add } = useCart()
  const { showToast } = useToast()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productsService.listProducts({ page: 1, page_size: 12 })
        setProducts(data.items)
      } catch (err) {
        console.error("Error loading featured products:", err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, Math.ceil(products.length / 4)))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(products.length / 4)) % Math.ceil(products.length / 4))
  }

  const visibleProducts = products.slice(currentIndex * 4, (currentIndex + 1) * 4)

  const handleAddToCart = (product: ProductListItem) => {
    const variant = product.variantes?.[0]
    if (variant) {
      const productName = product.nombre || product.name || "Producto"
      add({
        id: product.id,
        sku: product.sku || String(product.id),
        slug: product.slug || String(product.id),
        name: productName,
        price: product.price ?? variant.precio ?? 0,
        image: product.image || product.imagenes?.[0]?.url,
        variantId: variant.id.toString(),
        variantSku: String(variant.id),
        variantName: variant.nombre || "Variante",
        variantPrice: variant.precio ?? 0,
      }, 1)
      showToast(`Producto "${productName}" se agregó al carrito`, "success")
    }
  }

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-black text-neutral-900 mb-8 uppercase">Productos Destacados</h2>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 bg-neutral-200 animate-pulse h-96 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl md:text-4xl font-black text-neutral-900 mb-8 uppercase">Productos Destacados</h2>

      <div className="relative">
        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border-2 border-neutral-300 hover:border-orange-500 text-neutral-700 hover:text-orange-500 p-2 rounded-full shadow-lg z-10 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border-2 border-neutral-300 hover:border-orange-500 text-neutral-700 hover:text-orange-500 p-2 rounded-full shadow-lg z-10 transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleProducts.map((product) => {
            const productPrice = Number(product.price ?? product.variantes?.[0]?.precio ?? 0)
            const originalPrice = productPrice * 1.25
            const discount = 20
            const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg"
            const productName = product.nombre || product.name || "Producto"
            const productSlug = String(product.id)

            return (
              <div key={product.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative">
                {/* Heart icon */}
                <button className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition-colors">
                  <Heart className="w-5 h-5 text-neutral-600" />
                </button>

                {/* Discount badge */}
                {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded z-10">
                    {discount}%
                  </div>
                )}

                {/* Receive tomorrow badge */}
                {Math.random() > 0.7 && (
                  <div className="absolute top-12 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    RECIBE MAÑANA
                  </div>
                )}

                {/* Product Image */}
                <Link href={`/producto/${product.id}`}> 
                  <div className="relative bg-neutral-100 h-48 overflow-hidden">
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  {product.marca?.nombre && (
                    <p className="text-xs text-neutral-600 mb-1 font-semibold">{product.marca.nombre}</p>
                  )}
                  <Link href={`/producto/${product.id}`}> 
                    <h3 className="font-bold text-neutral-900 text-sm mb-3 line-clamp-2 hover:text-orange-600 transition-colors">
                      {productName}
                    </h3>
                  </Link>

                  {/* Prices */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-green-600">
                        Bs. {productPrice.toLocaleString("es-BO")}
                      </span>
                      {originalPrice > productPrice && (
                        <span className="text-sm text-neutral-400 line-through">
                          Bs. {originalPrice.toLocaleString("es-BO")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">IVA incluido.</p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    AÑADIR AL CARRO
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
              index === currentIndex
                ? "bg-orange-500 border-orange-500 scale-110 shadow-[0_0_6px_rgba(249,115,22,0.7)]"
                : "bg-transparent border-orange-300 hover:border-orange-500 hover:scale-105"
            }`}
            aria-label={`Ir a página ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

