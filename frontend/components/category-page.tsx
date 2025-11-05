"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useCart } from "@/hooks/use-cart"

interface CategoryPageProps {
  categoryId: string
  title: string
  description: string
}

const FILTERS = [
  { id: "categoria", label: "Categoría", expanded: true },
  { id: "marca", label: "Marca", expanded: false },
  { id: "entrega", label: "Omitir Entrega Express", expanded: false },
  { id: "precio", label: "Precio", expanded: false },
  { id: "express", label: "Entrega Express", expanded: false },
]

const CATEGORY_ITEMS = [
  { id: 1, subcategory: "Subcategoría 1", count: 128 },
  { id: 2, subcategory: "Subcategoría 2", count: 256 },
  { id: 3, subcategory: "Subcategoría 3", count: 89 },
  { id: 4, subcategory: "Subcategoría 4", count: 340 },
  { id: 5, subcategory: "Subcategoría 5", count: 67 },
]

const PRODUCTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  brand: "BOSCH",
  name: `Producto ${i + 1}`,
  price: (i + 1) * 50000,
  originalPrice: (i + 1) * 60000,
  discount: Math.floor(Math.random() * 30) + 10,
  image: `/placeholder.svg?height=250&width=250&query=herramienta`,
}))

export default function CategoryPage({ categoryId, title, description }: CategoryPageProps) {
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    categoria: true,
  })

  const { add } = useCart()

  const toggleFilter = (filterId: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterId]: !prev[filterId],
    }))
  }

  const handleAddToCart = (product: (typeof PRODUCTS)[0]) => {
    add({
      id: product.id,
      sku: `SKU-${product.id}`,
      slug: product.name.toLowerCase().replace(/\s+/g, "-"),
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-neutral-600">
        <Link href="/" className="hover:text-neutral-900">
          Inicio
        </Link>
        <span className="mx-2">›</span>
        <span className="text-neutral-900 font-medium">{title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0">
            <h2 className="text-lg font-bold text-neutral-900 mb-6">Filtros</h2>

            {/* Search Box */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-1"
                style={{ focusRing: "var(--storefront-brand)" }}
              />
            </div>

            {/* Filter Sections */}
            {FILTERS.map((filter) => (
              <div key={filter.id} className="mb-6 pb-6 border-b border-neutral-200 last:border-b-0">
                <button
                  onClick={() => toggleFilter(filter.id)}
                  className="w-full flex items-center justify-between text-neutral-900 font-medium transition-colors"
                  style={{ "--hover-color": "var(--storefront-brand)" } as React.CSSProperties}
                >
                  <span className="text-sm">{filter.label}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${expandedFilters[filter.id] ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expanded Content - Category Items */}
                {expandedFilters[filter.id] && filter.id === "categoria" && (
                  <div className="mt-4 space-y-3">
                    {CATEGORY_ITEMS.map((item) => (
                      <label key={item.id} className="flex items-center gap-3 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-neutral-300"
                          style={{ accentColor: "var(--storefront-brand)" }}
                        />
                        <span className="text-sm text-neutral-600">{item.subcategory}</span>
                        <span className="text-xs text-neutral-400">({item.count})</span>
                      </label>
                    ))}
                  </div>
                )}

                {expandedFilters[filter.id] && filter.id === "marca" && (
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "var(--storefront-brand)" }}
                      />
                      <span className="text-sm text-neutral-600">Marca 1</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "var(--storefront-brand)" }}
                      />
                      <span className="text-sm text-neutral-600">Marca 2</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
                <p className="text-sm text-neutral-500 mt-1">{description}</p>
              </div>
              <select
                className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-1"
                style={{ focusRingColor: "var(--storefront-brand)" }}
              >
                <option>Nuevos</option>
                <option>Precio: Menor a Mayor</option>
                <option>Precio: Mayor a Menor</option>
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative bg-neutral-100 h-48 flex items-center justify-center">
                    {product.discount > 0 && (
                      <div
                        className="absolute top-3 right-3 text-white text-sm font-bold px-2 py-1 rounded"
                        style={{ backgroundColor: "var(--storefront-cta)" }}
                      >
                        {product.discount}%
                      </div>
                    )}
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-neutral-500 mb-1">{product.brand}</p>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-bold" style={{ color: "var(--storefront-brand)" }}>
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-neutral-400 line-through">
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">IVA incluido.</p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full text-white font-bold py-2 px-3 rounded transition-colors text-sm hover:opacity-90"
                      style={{ backgroundColor: "var(--storefront-cta)", color: "var(--storefront-text-primary)" }}
                    >
                      AÑADIR AL CARRO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
