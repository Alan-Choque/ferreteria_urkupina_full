"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Minus, Plus, ShieldCheck, Truck, Store, MessageCircle, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import type { ProductDetail, ProductVariant } from "@/lib/services/products-service"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useToast } from "@/lib/contexts/toast-context"

interface ProductDetailViewProps {
  product: ProductDetail
  variants: ProductVariant[]
}

function sanitizePrice(value?: number | null): number | null {
  if (value === undefined || value === null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export default function ProductDetailView({ product, variants }: ProductDetailViewProps) {
  const galleryImages =
    product.imagenes?.map((img) => ({ id: img.id, src: img.url, alt: img.descripcion || product.nombre })) ??
    (product.image ? [{ id: 0, src: product.image, alt: product.nombre }] : [])

  const fallbackImage = product.image || "/placeholder.png"
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(variants[0]?.id ?? null)
  const { add } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { showToast } = useToast()
  const router = useRouter()

  const activeVariant = useMemo(() => {
    if (!variants.length) return null
    return variants.find((variant) => variant.id === selectedVariantId) ?? variants[0]
  }, [variants, selectedVariantId])

  const basePrice =
    sanitizePrice(activeVariant?.precio) ??
    sanitizePrice(product.price) ??
    sanitizePrice(product.variantes?.[0]?.precio) ??
    0

  const canAdd = basePrice > 0

  const displayedImage = galleryImages[activeImageIdx]?.src ?? fallbackImage

  const highlights = useMemo(() => {
    const points: string[] = []
    if (product.short) points.push(product.short)
    if (product.marca?.nombre) points.push(`Línea oficial ${product.marca.nombre}`)
    if (product.categoria?.nombre) points.push(`Ideal para ${product.categoria.nombre}`)
    if (product.sku) points.push(`SKU: ${product.sku}`)
    return points.slice(0, 4)
  }, [product])

  const handleAddToCart = () => {
    // No requiere autenticación para agregar al carrito
    // El carrito funciona sin cuenta (se guarda en localStorage)
    // Solo se requiere autenticación al finalizar la compra (checkout)

    if (!canAdd) {
      showToast("Este producto aún no tiene un precio disponible.", "error")
      return
    }

    add(
      {
        id: product.id,
        sku: product.sku || "",
        slug: product.slug,
        name: product.nombre,
        price: basePrice,
        image: displayedImage,
        variantId: activeVariant?.id ?? product.id,
        variantSku: activeVariant?.nombre || product.sku || product.slug,
        variantName: activeVariant?.nombre || product.nombre,
        variantPrice: basePrice,
        variantImage: displayedImage,
      },
      qty,
    )

    const productName = product.nombre || "Producto"
    const message = qty > 1 
      ? `Producto "${productName}" (x${qty}) se agregó al carrito`
      : `Producto "${productName}" se agregó al carrito`
    showToast(message, "success")
  }

  const handleToggleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      showToast("Producto eliminado de tu lista de deseos", "info")
    } else {
      addToWishlist(product)
      showToast("Producto agregado a tu lista de deseos", "success")
    }
  }

  const changeImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
    } else {
      setActiveImageIdx((prev) => (prev + 1) % galleryImages.length)
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 bg-white rounded-3xl shadow-xl p-3.5 lg:p-5">
        {/* Gallery */}
        <div className="flex flex-col lg:flex-row gap-3">
          {galleryImages.length > 1 && (
            <div className="order-2 lg:order-1 flex lg:flex-col gap-2 justify-center">
              {galleryImages.map((img, idx) => (
                <button
                  key={`${img.id}-${idx}`}
                  className={`rounded-2xl border ${
                    idx === activeImageIdx ? "border-orange-500 shadow-md" : "border-transparent opacity-70"
                  } overflow-hidden w-14 h-14 bg-neutral-100`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <Image
                    src={img.src || "/placeholder.png"}
                    alt={img.alt || product.nombre}
                    width={56}
                    height={56}
                    className="object-contain w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="order-1 lg:order-2 relative flex-1 bg-neutral-50 rounded-3xl min-h-[240px] flex items-center justify-center">
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => changeImage("prev")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 border border-neutral-200 rounded-full p-1.5 hover:shadow"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => changeImage("next")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 border border-neutral-200 rounded-full p-1.5 hover:shadow"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <Image
              src={displayedImage}
              alt={product.nombre}
              width={380}
              height={300}
              className="object-contain max-h-[260px]"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/placeholder.png"
              }}
            />
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm text-neutral-500">
              {product.categoria?.nombre ? `Categoría: ${product.categoria.nombre}` : "Producto destacado"}
            </p>
            <h1 className="text-xl font-bold text-neutral-900 leading-tight">{product.nombre}</h1>
            {product.marca?.nombre && (
              <p className="text-sm text-neutral-600">
                Marca <span className="font-semibold text-neutral-900">{product.marca.nombre}</span>
              </p>
            )}
          </div>

          <div className="flex items-end gap-3">
            <p className="text-2xl font-black text-neutral-900">Bs {basePrice.toLocaleString("es-BO")}</p>
            <div className="text-sm text-neutral-500 flex flex-col">
              <span>Incluye impuestos</span>
              {product.sku && <span>SKU {product.sku}</span>}
            </div>
          </div>

          {variants.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">Selecciona una presentación</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {variants.map((variant) => {
                  const isActive = variant.id === (activeVariant?.id ?? variants[0]?.id)
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-2xl border px-2.5 py-2 text-left transition-all ${
                        isActive ? "border-orange-500 bg-orange-50 shadow-sm" : "border-neutral-200 hover:border-orange-300"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-neutral-900">{variant.nombre || "Variante"}</p>
                      <p className="text-[11px] text-neutral-500">
                        {variant.unidad_medida_nombre || "Unidad"} • Bs{" "}
                        {sanitizePrice(variant.precio)?.toLocaleString("es-BO") ?? "--"}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-neutral-200 px-1 py-0.5 bg-white">
              <button
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-full hover:bg-neutral-100"
                aria-label="Restar"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center font-semibold text-sm">{qty}</span>
              <button
                onClick={() => setQty((prev) => prev + 1)}
                className="p-1.5 rounded-full hover:bg-neutral-100"
                aria-label="Sumar"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <motion.button
              disabled={!canAdd}
              onClick={handleAddToCart}
              className="flex-1 bg-orange-600 text-white rounded-2xl py-2.5 font-semibold shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition disabled:bg-neutral-300 disabled:text-neutral-500 text-[15px]"
              whileHover={canAdd ? { scale: 1.02, boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)" } : {}}
              whileTap={canAdd ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Agregar al carrito
            </motion.button>
            <motion.button
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-2xl border-2 transition-colors ${
                isInWishlist(product.id)
                  ? "bg-red-50 border-red-600 text-red-600"
                  : "bg-white border-neutral-300 text-neutral-600 hover:border-red-600 hover:text-red-600"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={isInWishlist(product.id) ? "Eliminar de lista de deseos" : "Agregar a lista de deseos"}
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
            </motion.button>
          </div>

          {highlights.length > 0 && (
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100 space-y-1.5">
              <p className="text-[13px] font-semibold text-neutral-700">Aspectos destacados</p>
              <ul className="text-[13px] text-neutral-600 space-y-1">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="border border-neutral-200 rounded-2xl p-2.5 text-center space-y-0.5">
              <Truck className="w-4 h-4 mx-auto text-orange-500" />
              <p className="text-[13px] font-semibold text-neutral-800">Entrega express</p>
              <p className="text-[11px] text-neutral-500">Envío en 24-72h según ciudad</p>
            </div>
            <div className="border border-neutral-200 rounded-2xl p-2.5 text-center space-y-0.5">
              <Store className="w-4 h-4 mx-auto text-orange-500" />
              <p className="text-[13px] font-semibold text-neutral-800">Retiro en sucursal</p>
              <p className="text-[11px] text-neutral-500">Reserva sin costo y retira</p>
            </div>
            <div className="border border-neutral-200 rounded-2xl p-2.5 text-center space-y-0.5">
              <ShieldCheck className="w-4 h-4 mx-auto text-orange-500" />
              <p className="text-[13px] font-semibold text-neutral-800">Garantía oficial</p>
              <p className="text-[11px] text-neutral-500">Soporte autorizado y repuestos</p>
            </div>
          </div>
        </div>
      </div>

      {product.descripcion && (
        <div className="bg-white rounded-3xl shadow-lg p-3.5 lg:p-5">
          <h2 className="text-lg font-semibold text-neutral-900 mb-1.5">Descripción detallada</h2>
          <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-[15px]">{product.descripcion}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="rounded-3xl border border-neutral-200 p-3.5 flex items-center gap-3 bg-white">
          <Truck className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Opciones de entrega</p>
            <p className="text-[13px] text-neutral-600">
              Calculamos envíos según tu ubicación. Consulta disponibilidad en el checkout.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 p-3.5 flex items-center gap-3 bg-white">
          <MessageCircle className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Asesor comercial</p>
            <p className="text-[13px] text-neutral-600">¿Tienes dudas técnicas? Nuestro equipo te ayuda por WhatsApp.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

