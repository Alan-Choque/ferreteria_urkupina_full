"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Loader2, Heart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/toast"
import { productsService, type ProductListItem } from "@/lib/services/products-service"
import { categoriesService, type Category } from "@/lib/services/categories-service"
import { getCategoryIdFromSlug } from "@/lib/utils/category-mapping"

interface CategoryPageProps {
  categoryId: string
  parentCategoryId?: string | null
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

// Removed hardcoded products - now loaded from API

export default function CategoryPage({ categoryId: categorySlug, parentCategoryId, title, description }: CategoryPageProps) {
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    categoria: true,
  })
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [resolvedCategoryId, setResolvedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set())
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set())
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })
  const [sortBy, setSortBy] = useState("newest")
  const { add } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { toasts, showToast, removeToast } = useToast()
  const router = useRouter()

  // Obtener categorías disponibles - usar todas las categorías del sistema
  const availableCategories = useMemo(() => {
    if (allCategories.length === 0) return []
    
    // Contar productos por categoría para mostrar el conteo
    const catCountMap = new Map<number, number>()
    products.forEach((p) => {
      if (p.categoria?.id) {
        catCountMap.set(p.categoria.id, (catCountMap.get(p.categoria.id) || 0) + 1)
      }
    })
    
    // Mapear todas las categorías con sus conteos
    return allCategories.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      count: catCountMap.get(cat.id) || 0,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [allCategories, products])

  // Obtener marcas disponibles desde los productos
  const brands = useMemo(() => {
    const brandMap = new Map<number, { id: number; nombre: string; count: number }>()
    products.forEach((p) => {
      if (p.marca?.id && p.marca?.nombre) {
        const existing = brandMap.get(p.marca.id)
        if (existing) {
          existing.count++
        } else {
          brandMap.set(p.marca.id, {
            id: p.marca.id,
            nombre: p.marca.nombre,
            count: 1,
          })
        }
      }
    })
    return Array.from(brandMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [products])

  // Cargar categorías y encontrar el ID correspondiente
  const loadCategoryId = useCallback(async () => {
    try {
      console.log(`📋 Cargando categorías para slug: "${categorySlug}"`)
      const categoriesList = await categoriesService.listCategories()
      console.log(`📋 Total de categorías disponibles: ${categoriesList.length}`)
      console.log("Categorías:", categoriesList.map(c => `"${c.nombre}" (ID: ${c.id})`).join(", "))
      
      setAllCategories(categoriesList)
      
      let id = await getCategoryIdFromSlug(categorySlug, categoriesList)
      
      // Si no se encuentra la categoría y hay una categoría padre, intentar con ella
      if (!id && parentCategoryId) {
        console.log(`⚠️ No se encontró categoría para "${categorySlug}", intentando con categoría padre "${parentCategoryId}"`)
        id = await getCategoryIdFromSlug(parentCategoryId, categoriesList)
        if (id) {
          console.log(`✅ Usando categoría padre: "${parentCategoryId}" (ID: ${id})`)
        }
      }
      
      setResolvedCategoryId(id)
      
      if (id) {
        const foundCategory = categoriesList.find(c => c.id === id)
        console.log(`✅ Categoría resuelta: "${foundCategory?.nombre}" (ID: ${id}) para slug "${categorySlug}"`)
      } else {
        console.warn(`⚠️ No se pudo encontrar categoría para slug "${categorySlug}"${parentCategoryId ? ` ni para categoría padre "${parentCategoryId}"` : ""}. Se mostrarán todos los productos.`)
      }
      
      return id
    } catch (err) {
      console.error("Error loading categories:", err)
      return null
    }
  }, [categorySlug, parentCategoryId])

  // Cargar productos de la categoría
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log(`🔍 Cargando productos para categoría slug: "${categorySlug}"`)
      
      // Primero cargamos las categorías para obtener el ID
      const catId = await loadCategoryId()
      
      // Determinar qué category_id usar: si hay categorías seleccionadas, usar la primera; si no, usar la categoría actual
      let categoryIdToUse: number | undefined = undefined
      if (selectedCategories.size > 0) {
        // Si hay categorías seleccionadas, usar la primera
        categoryIdToUse = Array.from(selectedCategories)[0]
      } else if (catId) {
        // Si no hay categorías seleccionadas pero hay una categoría actual, usarla
        categoryIdToUse = catId
      }
      // Si no hay ninguna, categoryIdToUse será undefined y se mostrarán todos los productos
      
      // Construir parámetros de búsqueda
      const params: {
        page: number
        page_size: number
        category_id?: number
        q?: string
      } = {
        page: currentPage,
        page_size: pageSize,
      }
      
      if (categoryIdToUse) {
        params.category_id = categoryIdToUse
      }
      
      if (searchQuery.trim()) {
        params.q = searchQuery.trim()
      }
      
      console.log(`✅ Cargando productos con parámetros:`, params)

      // Cargar productos con filtros
      const response = await productsService.listProducts(params)
      
      console.log(`📦 Página ${currentPage}: ${response.items.length} productos (Total: ${response.total})`)
      
      setProducts(response.items)
      setTotal(response.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"))
      console.error("Error loading products:", err)
    } finally {
      setLoading(false)
    }
  }, [categorySlug, loadCategoryId, currentPage, pageSize, searchQuery, selectedCategories])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])
  
  // Resetear página cuando cambian los filtros o búsqueda
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, selectedCategories])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFilter = (filterId: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterId]: !prev[filterId],
    }))
  }

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const toggleBrand = (brandId: number) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev)
      if (next.has(brandId)) {
        next.delete(brandId)
      } else {
        next.add(brandId)
      }
      return next
    })
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadProducts()
  }

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Filtrar por marcas seleccionadas
    if (selectedBrands.size > 0) {
      result = result.filter((p) => p.marca?.id && selectedBrands.has(p.marca.id))
    }

    // Filtrar por rango de precio
    result = result.filter((p) => {
      const price = Number(p.price ?? p.variantes?.[0]?.precio ?? 0)
      return price >= priceRange.min && price <= priceRange.max
    })

    // Ordenar
    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const priceA = Number(a.price ?? a.variantes?.[0]?.precio ?? 0)
        const priceB = Number(b.price ?? b.variantes?.[0]?.precio ?? 0)
        return priceA - priceB
      })
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const priceA = Number(a.price ?? a.variantes?.[0]?.precio ?? 0)
        const priceB = Number(b.price ?? b.variantes?.[0]?.precio ?? 0)
        return priceB - priceA
      })
    } else if (sortBy === "newest") {
      result.sort((a, b) => b.id - a.id)
    }

    return result
  }, [products, selectedBrands, priceRange, sortBy])

  const handleAddToCart = (product: ProductListItem) => {
    // No requiere autenticación para agregar al carrito
    // El carrito funciona sin cuenta (se guarda en localStorage)
    // Solo se requiere autenticación al finalizar la compra (checkout)
    
    const variant = product.variantes?.[0]
    if (variant) {
      const price = Number(product.price ?? variant.precio ?? 0)
      const image = product.image || product.imagenes?.[0]?.url || "/placeholder.svg"
      const name = product.nombre || product.name || "Producto"
      const slug = product.slug || String(product.id)

      add({
        id: product.id,
        sku: product.sku || String(product.id),
        slug,
        name,
        price,
        image,
        variantId: variant.id.toString(),
        variantSku: String(variant.id),
        variantName: variant.nombre || "Variante",
        variantPrice: variant.precio ?? 0,
      }, 1)

      // Mostrar notificación
      showToast(`Producto "${name}" se agregó al carrito`, "success")
    }
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
            <form onSubmit={handleSearchSubmit} className="mb-6">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </form>

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
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                    {availableCategories.length > 0 ? (
                      availableCategories.map((cat) => (
                        <label 
                          key={cat.id} 
                          className="flex items-center gap-3 cursor-pointer transition-colors hover:text-orange-600"
                          onClick={() => toggleCategory(cat.id)}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                            checked={selectedCategories.has(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                          />
                          <span className="text-sm text-neutral-600 flex-1">{cat.nombre}</span>
                          {cat.count > 0 && (
                            <span className="text-xs text-neutral-400">({cat.count})</span>
                          )}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-400">Cargando categorías...</p>
                    )}
                  </div>
                )}

                {expandedFilters[filter.id] && filter.id === "marca" && (
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                    {brands.length > 0 ? (
                      brands.map((brand) => (
                        <label
                          key={brand.id}
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => toggleBrand(brand.id)}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded"
                            style={{ accentColor: "var(--storefront-brand)" }}
                            checked={selectedBrands.has(brand.id)}
                            onChange={() => toggleBrand(brand.id)}
                          />
                          <span className="text-sm text-neutral-600">{brand.nombre}</span>
                          <span className="text-xs text-neutral-400">({brand.count})</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-400">No hay marcas disponibles</p>
                    )}
                  </div>
                )}

                {expandedFilters[filter.id] && filter.id === "precio" && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Mín"
                        value={priceRange.min || ""}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            min: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Máx"
                        value={priceRange.max === 1000000 ? "" : priceRange.max || ""}
                        onChange={(e) =>
                          setPriceRange((prev) => ({
                            ...prev,
                            max: Number(e.target.value) || 1000000,
                          }))
                        }
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-sm"
                      />
                    </div>
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
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-1"
                style={{ focusRingColor: "var(--storefront-brand)" }}
              >
                <option value="newest">Nuevos</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error al cargar productos: {error.message}</p>
                <button
                  onClick={() => loadProducts()}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600 mb-4">No se encontraron productos en esta categoría</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-neutral-600 mb-4">
                  Mostrando <strong>{((currentPage - 1) * pageSize) + 1}</strong> - <strong>{Math.min(currentPage * pageSize, total)}</strong> de <strong>{total}</strong> productos
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => {
                    const productPrice = Number(product.price ?? product.variantes?.[0]?.precio ?? 0)
                    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg"
                    const productName = product.nombre || product.name || "Producto"
                    // Usar slug del backend si está disponible, de lo contrario generar uno desde el nombre o usar ID
                    let productSlug = (product.slug || "").trim()
                    if (!productSlug || productSlug === "undefined" || productSlug === "null") {
                      // Generar slug desde el nombre
                      productSlug = productName
                        .toLowerCase()
                        .trim()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "") || String(product.id)
                    }
                    const productHref = productSlug ? `/producto/${productSlug}` : `/producto/${product.id}?id=${product.id}`
                    const productBrand = product.marca?.nombre || ""
                    // Calcular descuento: todos los productos tienen un 20% de descuento simulado
                    // TODO: En el futuro, obtener descuentos reales desde promociones activas en la BD
                    const originalPrice = productPrice * 1.25 // Precio original = precio actual + 25% (20% descuento)
                    const discount = 20 // Descuento fijo del 20% para todos los productos

                    return (
                      <div
                        key={product.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <Link href={`/producto/${product.id}`}>
                          <div className="relative bg-neutral-100 h-48 flex items-center justify-center cursor-pointer">
                            {discount > 0 && (
                              <div
                                className="absolute top-3 right-3 text-white text-sm font-bold px-2 py-1 rounded"
                                style={{ backgroundColor: "var(--storefront-cta)" }}
                              >
                                {discount}%
                              </div>
                            )}
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                        </Link>
                        <div className="p-4">
                          {productBrand && <p className="text-xs text-neutral-500 mb-1">{productBrand}</p>}
                          <Link href={`/producto/${product.id}`}>
                            <h3 className="text-sm font-medium text-neutral-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                              {productName}
                            </h3>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-lg font-bold" style={{ color: "var(--storefront-brand)" }}>
                              Bs. {productPrice.toLocaleString("es-BO")}
                            </span>
                            {originalPrice > productPrice && (
                              <span className="text-sm text-neutral-400 line-through">
                                Bs. {originalPrice.toLocaleString("es-BO")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mb-3">IVA incluido.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 text-white font-bold py-2 px-3 rounded transition-colors text-sm hover:opacity-90"
                              style={{ backgroundColor: "var(--storefront-cta)", color: "var(--storefront-text-primary)" }}
                            >
                              AÑADIR AL CARRO
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (isInWishlist(product.id)) {
                                  removeFromWishlist(product.id)
                                  showToast("Producto eliminado de tu lista de deseos", "info")
                                } else {
                                  addToWishlist(product)
                                  showToast("Producto agregado a tu lista de deseos", "success")
                                }
                              }}
                              className={`p-2 rounded border-2 transition-colors ${
                                isInWishlist(product.id)
                                  ? "bg-red-50 border-red-600 text-red-600"
                                  : "bg-white border-neutral-300 text-neutral-600 hover:border-red-600 hover:text-red-600"
                              }`}
                              aria-label={isInWishlist(product.id) ? "Eliminar de lista de deseos" : "Agregar a lista de deseos"}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Paginación */}
                {(() => {
                  const maxPage = Math.ceil(total / pageSize)
                  if (maxPage <= 1) return null
                  
                  return (
                    <div className="mt-8 flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, currentPage - 1)
                          handlePageChange(newPage)
                        }}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                      >
                        ← Anterior
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(maxPage, 7) }, (_, i) => {
                          let pageNum: number
                          if (maxPage <= 7) {
                            pageNum = i + 1
                          } else if (currentPage <= 4) {
                            pageNum = i + 1
                          } else if (currentPage >= maxPage - 3) {
                            pageNum = maxPage - 6 + i
                          } else {
                            pageNum = currentPage - 3 + i
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 min-w-[40px] rounded-lg transition-colors font-medium ${
                                currentPage === pageNum
                                  ? "bg-orange-600 text-white"
                                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => {
                          const newPage = Math.min(maxPage, currentPage + 1)
                          handlePageChange(newPage)
                        }}
                        disabled={currentPage >= maxPage}
                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
