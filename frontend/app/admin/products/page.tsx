"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  productsService,
  type ProductCreatePayload,
  type ProductImageInput,
  type ProductListItem,
  type ProductMetaResponse,
  type ProductStatusPayload,
  type ProductUpdatePayload,
  type ProductVariantInput,
} from "@/lib/services/products-service"
import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import {
  ArrowLeft,
  Boxes,
  CheckCircle,
  Edit2,
  Loader2,
  PencilLine,
  Plus,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  ToggleLeft,
  Trash2,
  XCircle,
  TrendingUp,
  Package,
  Image as ImageIcon,
  Tag,
} from "lucide-react"
import jsPDF from "jspdf"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { KPICard } from "@/components/admin/KPICard"

interface FiltersState {
  q: string
  brand_id: string
  category_id: string
  status: string
}

const initialFilters: FiltersState = {
  q: "",
  brand_id: "",
  category_id: "",
  status: "",
}

const DEFAULT_VARIANT = (unidadId?: number): ProductVariantInput => ({
  nombre: "",
  unidad_medida_id: unidadId ?? 0,
  precio: undefined,
})

const DEFAULT_IMAGE = (): ProductImageInput => ({
  url: "",
  descripcion: "",
})

export default function ProductsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { canManageProducts } = usePermissions()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    // Primero verificar query param (prioridad)
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si no hay query param, verificar la ruta
    if (pathname.includes("/list")) return "list"
    if (pathname.includes("/create")) return "create"
    if (pathname.includes("/edit")) return "edit"
    if (pathname.includes("/status")) return "status"
    
    // Si estamos en la ruta base sin action, mostrar dashboard
    if (pathname === "/admin/products" || pathname === "/admin/products/") {
      return null // Mostrar dashboard
    }
    
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  
  // Inicializar y actualizar selectedAction cuando cambia la ruta
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // Sincronizar searchQuery con filters.q cuando se cambia a listado
    if (action === "list") {
      setSearchQuery(filters.q)
    } else {
      setSearchQuery("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)
  const [meta, setMeta] = useState<ProductMetaResponse | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<ProductListItem | null>(null)

  const [createForm, setCreateForm] = useState<
    ProductCreatePayload & {
      variantes: ProductVariantInput[]
      imagenes: ProductImageInput[]
    }
  >({
    nombre: "",
    descripcion: "",
    categoria_id: undefined,
    marca_id: undefined,
    status: "ACTIVE",
    variantes: [DEFAULT_VARIANT()],
    imagenes: [],
  })

  const [editForm, setEditForm] = useState<
    ProductUpdatePayload & {
      variantes: ProductVariantInput[]
      imagenes: ProductImageInput[]
    }
  >({
    nombre: undefined,
    descripcion: undefined,
    categoria_id: undefined,
    marca_id: undefined,
    status: undefined,
    variantes: [],
    imagenes: [],
  })

  const normalizedUnits = useMemo(() => meta?.unidades ?? [], [meta])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const activeProducts = products.filter(p => p.status === "ACTIVE").length
  const inactiveProducts = products.filter(p => p.status === "INACTIVE").length
  const totalVariants = products.reduce((sum, p) => sum + (p.variantes?.length || 0), 0)
  const productsWithImages = products.filter(p => p.imagenes && p.imagenes.length > 0).length

  // Datos para gráfico de productos por categoría
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    products.forEach(p => {
      const cat = p.categoria_nombre || "Sin categoría"
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
    })
    return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, value: count }))
  }, [products])

  // Datos para gráfico de productos por estado
  const statusData = useMemo(() => [
    { name: "Activos", value: activeProducts, color: "#10B981" },
    { name: "Inactivos", value: inactiveProducts, color: "#EF4444" },
  ], [activeProducts, inactiveProducts])

  // Datos para gráfico de tendencia mensual (simulado)
  const monthlyTrendData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
    return months.map((month, index) => ({
      month,
      productos: Math.floor(Math.random() * 50) + 100 + (index * 10),
      variantes: Math.floor(Math.random() * 100) + 200 + (index * 15),
    }))
  }, [])

  const ensureVariantUnit = useCallback(
    (variant: ProductVariantInput): ProductVariantInput => {
      if (variant.unidad_medida_id && variant.unidad_medida_id !== 0) {
        return variant
      }
      const firstUnit = normalizedUnits[0]?.id ?? 0
      return { ...variant, unidad_medida_id: firstUnit }
    },
    [normalizedUnits],
  )

  const loadMeta = useCallback(async () => {
    if (meta || metaLoading) {
      return meta
    }
    setMetaLoading(true)
    try {
      const response = await productsService.fetchMeta()
      setMeta(response)
      return response
    } catch (err) {
      console.error("Error cargando catálogos auxiliares", err)
      setError(err instanceof Error ? err.message : "No se pudieron cargar los catálogos de productos")
      return null
    } finally {
      setMetaLoading(false)
    }
  }, [meta, metaLoading])

  const reloadProducts = useCallback(
    async (overrides?: Partial<FiltersState>, page: number = currentPage) => {
      setLoading(true)
      setError(null)
      const effectiveFilters = { ...filters, ...(overrides ?? {}) }
      try {
        const response = await productsService.listProducts({
          q: effectiveFilters.q || undefined,
          brand_id: effectiveFilters.brand_id ? Number(effectiveFilters.brand_id) : undefined,
          category_id: effectiveFilters.category_id ? Number(effectiveFilters.category_id) : undefined,
          status: effectiveFilters.status || undefined,
          page: page,
          page_size: pageSize,
        })
        setProducts(response.items ?? [])
        setTotalProducts(response.total ?? 0)
      } catch (err) {
        console.error("Error fetching products", err)
        setError(err instanceof Error ? err.message : "No se pudieron cargar los productos")
      } finally {
        setLoading(false)
      }
    },
    [filters, currentPage, pageSize],
  )

  useEffect(() => {
    const bootstrap = async () => {
      await reloadProducts()
    }
    void bootstrap()
  }, [reloadProducts])

  // Actualizar búsqueda cuando cambia searchQuery (solo para listado)
  useEffect(() => {
    if (selectedAction === "list" && searchQuery !== filters.q) {
      const timer = setTimeout(() => {
        reloadProducts({ q: searchQuery }, 1)
      }, 300) // Debounce de 300ms
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedAction])

  const actions: ActionItem[] = [
    {
      id: "list",
      label: "Listar y buscar productos",
      description: "Consulta el catálogo con filtros, variantes e inventario asociado.",
      status: "disponible",
      icon: <Boxes className="h-5 w-5" />,
    },
    ...(canManageProducts ? [
      {
        id: "create",
        label: "Registrar nuevo producto",
        description: "Añade un nuevo producto con variantes e imágenes reales.",
        status: "disponible",
        icon: <PlusCircle className="h-5 w-5" />,
      },
      {
        id: "edit",
        label: "Modificar producto",
        description: "Actualiza atributos, variantes e imágenes de un producto existente.",
        status: "disponible",
        icon: <PencilLine className="h-5 w-5" />,
      },
      {
        id: "status",
        label: "Cambio de estado",
        description: "Activa o pausa productos y variantes según disponibilidad.",
        status: "disponible",
        icon: <ToggleLeft className="h-5 w-5" />,
      },
    ] : []),
    {
      id: "print",
      label: "Imprimir listado",
      description: "Genera un PDF con todos los productos del catálogo.",
      status: "disponible",
      icon: <Printer className="h-5 w-5" />,
    },
  ]

  const handleFilterChange = (field: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = async () => {
    setCurrentPage(1)
    await reloadProducts(undefined, 1)
    setFeedback("Filtros aplicados correctamente.")
  }

  const handleResetFilters = async () => {
    setFilters(initialFilters)
    setCurrentPage(1)
    await reloadProducts(initialFilters, 1)
    setFeedback("Filtros restablecidos.")
  }

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage)
    await reloadProducts(undefined, newPage)
  }

  const handleToggleStatus = async (product: ProductListItem) => {
    if (!product.id) return
    setSaving(true)
    setFeedback(null)
    try {
      const payload: ProductStatusPayload = {
        status: product.status.toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }
      const updated = await productsService.updateProductStatus(product.id, payload)
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setFeedback(`Estado actualizado a ${updated.status}.`)
    } catch (err) {
      console.error("Error al actualizar estado", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado del producto")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateVariantChange = (index: number, partial: Partial<ProductVariantInput>) => {
    setCreateForm((prev) => {
      const variantes = [...prev.variantes]
      variantes[index] = ensureVariantUnit({ ...variantes[index], ...partial })
      return { ...prev, variantes }
    })
  }

  const handleAddCreateVariant = () => {
    setCreateForm((prev) => ({ ...prev, variantes: [...prev.variantes, ensureVariantUnit(DEFAULT_VARIANT())] }))
  }

  const handleRemoveCreateVariant = (index: number) => {
    setCreateForm((prev) => {
      if (prev.variantes.length === 1) return prev
      const variantes = prev.variantes.filter((_, idx) => idx !== index)
      return { ...prev, variantes: variantes.length ? variantes : [ensureVariantUnit(DEFAULT_VARIANT())] }
    })
  }

  const handleCreateImageChange = (index: number, partial: Partial<ProductImageInput>) => {
    setCreateForm((prev) => {
      const imagenes = [...prev.imagenes]
      imagenes[index] = { ...imagenes[index], ...partial }
      return { ...prev, imagenes }
    })
  }

  const handleAddCreateImage = () => {
    setCreateForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, DEFAULT_IMAGE()] }))
  }

  const handleRemoveCreateImage = (index: number) => {
    setCreateForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, idx) => idx !== index) }))
  }

  const sanitizeNumber = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return undefined
    if (typeof value === "number") return value
    if (value === "") return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      const payload: ProductCreatePayload = {
        nombre: createForm.nombre.trim(),
        descripcion: createForm.descripcion?.trim() || undefined,
        categoria_id: sanitizeNumber(createForm.categoria_id as any),
        marca_id: sanitizeNumber(createForm.marca_id as any),
        status: createForm.status ?? "ACTIVE",
        variantes: createForm.variantes.map((variant) => ({
          nombre: variant.nombre?.trim() || undefined,
          unidad_medida_id: variant.unidad_medida_id,
          precio: variant.precio !== undefined && variant.precio !== null ? Number(variant.precio) : undefined,
        })),
        imagenes: createForm.imagenes
          .filter((image) => image.url && image.url.trim().length > 0)
          .map((image) => ({
            url: image.url.trim(),
            descripcion: image.descripcion?.trim() || undefined,
          })),
      }

      if (!payload.nombre) {
        throw new Error("El nombre del producto es obligatorio")
      }
      if (!payload.variantes.length) {
        throw new Error("Debes registrar al menos una variante")
      }
      if (payload.variantes.some((variant) => !variant.unidad_medida_id)) {
        throw new Error("Cada variante debe tener una unidad de medida válida")
      }

      const created = await productsService.createProduct(payload)
      setProducts((prev) => [created, ...prev])
      setCreateForm({
        nombre: "",
        descripcion: "",
        categoria_id: undefined,
        marca_id: undefined,
        status: "ACTIVE",
        variantes: [ensureVariantUnit(DEFAULT_VARIANT())],
        imagenes: [],
      })
      setFeedback(`Producto "${created.nombre}" registrado correctamente.`)
    } catch (err) {
      console.error("Error creando producto", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el producto")
      } finally {
      setSaving(false)
    }
  }

  const openEditProduct = async (productId: number) => {
    setEditingProductId(productId)
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      await loadMeta()
      const detail = await productsService.adminGetProduct(productId)
      setEditForm({
        nombre: detail.nombre,
        descripcion: detail.descripcion ?? undefined,
        categoria_id: detail.categoria?.id,
        marca_id: detail.marca?.id,
        status: detail.status as ProductUpdatePayload["status"],
        variantes: (detail.variantes ?? []).map((variant) => ({
          id: variant.id,
          nombre: variant.nombre ?? "",
          unidad_medida_id: normalizedUnits.find((unit) => unit.nombre === variant.unidad_medida_nombre)?.id ?? normalizedUnits[0]?.id ?? 0,
          precio: variant.precio ?? undefined,
        })),
        imagenes: (detail.imagenes ?? []).map((imagen) => ({
          id: imagen.id,
          url: imagen.url,
          descripcion: imagen.descripcion ?? "",
        })),
      })
      setSelectedAction("edit")
    } catch (err) {
      console.error("Error cargando producto", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el producto seleccionado")
    } finally {
      setSaving(false)
    }
  }

  const handleEditVariantChange = (index: number, partial: Partial<ProductVariantInput>) => {
    setEditForm((prev) => {
      const variantes = [...prev.variantes]
      variantes[index] = ensureVariantUnit({ ...variantes[index], ...partial })
      return { ...prev, variantes }
    })
  }

  const handleRemoveEditVariant = (index: number) => {
    setEditForm((prev) => {
      const variantes = [...prev.variantes]
      const target = variantes[index]
      if (target?.id) {
        variantes[index] = { ...target, delete: true }
      } else {
        variantes.splice(index, 1)
      }
      return { ...prev, variantes }
    })
  }

  const handleAddEditVariant = () => {
    setEditForm((prev) => ({ ...prev, variantes: [...prev.variantes, ensureVariantUnit(DEFAULT_VARIANT())] }))
  }

  const handleEditImageChange = (index: number, partial: Partial<ProductImageInput>) => {
    setEditForm((prev) => {
      const imagenes = [...prev.imagenes]
      imagenes[index] = { ...imagenes[index], ...partial }
      return { ...prev, imagenes }
    })
  }

  const handleRemoveEditImage = (index: number) => {
    setEditForm((prev) => {
      const imagenes = [...prev.imagenes]
      const target = imagenes[index]
      if (target?.id) {
        imagenes[index] = { ...target, delete: true }
      } else {
        imagenes.splice(index, 1)
      }
      return { ...prev, imagenes }
    })
  }

  const handleAddEditImage = () => {
    setEditForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, DEFAULT_IMAGE()] }))
  }

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingProductId) {
      setError("Selecciona un producto para editar")
      return
    }
    setSaving(true)
    setFeedback(null)
    setError(null)
    try {
      const payload: ProductUpdatePayload = {
        nombre: editForm.nombre?.trim() || undefined,
        descripcion: editForm.descripcion?.trim() || undefined,
        categoria_id: sanitizeNumber(editForm.categoria_id as any),
        marca_id: sanitizeNumber(editForm.marca_id as any),
        status: editForm.status,
        variantes: editForm.variantes.map((variant) => ({
          id: variant.id,
          nombre: variant.nombre?.trim() || undefined,
          unidad_medida_id: variant.unidad_medida_id,
          precio: variant.precio !== undefined && variant.precio !== null ? Number(variant.precio) : undefined,
          delete: variant.delete ?? false,
        })),
        imagenes: editForm.imagenes.map((image) => ({
          id: image.id,
          url: image.url.trim(),
          descripcion: image.descripcion?.trim() || undefined,
          delete: image.delete ?? false,
        })),
      }

      const updated = await productsService.updateProduct(editingProductId, payload)
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setFeedback(`Producto "${updated.nombre}" actualizado correctamente.`)
      setSelectedAction("list")
      void reloadProducts()
    } catch (err) {
      console.error("Error actualizando producto", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar el producto")
    } finally {
      setSaving(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    const normalized = status?.toUpperCase() ?? "ACTIVE"
    const isActive = normalized === "ACTIVE"
  return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isActive ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
        }`}
      >
        {normalized}
      </span>
    )
  }

  const renderProductsTable = (options?: { showFilters?: boolean; highlightStatus?: boolean; sectionId?: string; showEditButton?: boolean }) => {
    const { showFilters = true, highlightStatus = true, sectionId, showEditButton = false } = options ?? {}
    const isListAction = selectedAction === "list"
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"
    
    return (
      <motion.div
        id={sectionId}
        key={`products-table-${showFilters ? "filters" : "compact"}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-sm bg-white border overflow-hidden"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        {/* Buscador simple para listado (como usuarios) */}
        {isListAction && (
          <div className="p-4 border-b" style={{ borderColor: PURPLE_COLORS.accent }}>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                size={18} 
                style={{ color: PURPLE_COLORS.secondary }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setFilters(prev => ({ ...prev, q: e.target.value }))
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm bg-white focus:outline-none"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  color: "#1F2937"
                }}
              />
            </div>
          </div>
        )}
        
        {showFilters && !isListAction && (
          <div className="border-b p-4 space-y-3" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: PURPLE_COLORS.secondary }} />
                  <input
                    value={filters.q}
                    onChange={(event) => handleFilterChange("q", event.target.value)}
                    placeholder="Nombre, descripción..."
                    className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm bg-white focus:outline-none"
                    style={{ 
                      borderColor: PURPLE_COLORS.accent,
                      color: "#1F2937"
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Marca</label>
                <select
                  value={filters.brand_id}
                  onChange={(event) => handleFilterChange("brand_id", event.target.value)}
                  className="border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="">Todas</option>
                  {meta?.marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Categoría</label>
                <select
                  value={filters.category_id}
                  onChange={(event) => handleFilterChange("category_id", event.target.value)}
                  className="border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="">Todas</option>
                  {meta?.categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Estado</label>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange("status", event.target.value)}
                  className="border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="">Todos</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition-colors"
                style={{ backgroundColor: PURPLE_COLORS.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
                disabled={loading}
              >
                <Search size={16} /> Aplicar filtros
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  backgroundColor: WHITE,
                  color: PURPLE_COLORS.primary
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
                disabled={loading}
              >
                <RefreshCw size={16} /> Limpiar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 flex items-center justify-center" style={{ color: PURPLE_COLORS.secondary }}>
            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center space-y-2" style={{ color: "#6B7280" }}>
            <p>No se encontraron productos con los filtros actuales.</p>
            {filters.category_id && (
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                La categoría seleccionada no tiene productos asignados. Verifica en la base de datos si los productos tienen esta categoría asignada.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>ID</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Producto</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Marca</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Categoría</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Precio</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Variantes</th>
                  <th className="px-6 py-3 text-left font-semibold" style={{ color: PURPLE_COLORS.dark }}>Estado</th>
                  <th className="px-6 py-3 text-right font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 font-mono" style={{ color: "#6B7280" }}>{product.id}</td>
                    <td className="px-6 py-4" style={{ color: "#1F2937" }}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{product.nombre}</span>
                        {product.short && (
                          <span className="text-xs line-clamp-2" style={{ color: "#6B7280" }}>{product.short}</span>
                        )}
                      </div>
                      </td>
                    <td className="px-6 py-4" style={{ color: "#6B7280" }}>{product.marca?.nombre ?? "-"}</td>
                    <td className="px-6 py-4" style={{ color: "#6B7280" }}>{product.categoria?.nombre ?? "-"}</td>
                    <td className="px-6 py-4" style={{ color: "#1F2937" }}>
                      {product.price !== undefined && product.price !== null
                        ? new Intl.NumberFormat("es-BO", {
                            style: "currency",
                            currency: "BOB",
                            maximumFractionDigits: 2,
                          }).format(product.price)
                        : "-"}
                    </td>
                    <td className="px-6 py-4" style={{ color: "#6B7280" }}>
                      <div className="flex items-center gap-2">
                        <span>{product.variantes?.length ?? 0}</span>
                        {product.variantes && product.variantes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedProductForVariants(product)}
                            className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity text-white"
                            style={{ backgroundColor: PURPLE_COLORS.primary }}
                            title="Ver variantes"
                          >
                            Ver
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{highlightStatus ? renderStatusBadge(product.status) : product.status}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManageProducts && (
                            <button
                              type="button"
                              onClick={() => openEditProduct(product.id)}
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                              style={{ color: PURPLE_COLORS.primary }}
                            >
                              <Edit2 size={16} />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          )}
                          {highlightStatus && canManageProducts && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(product)}
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                              style={{ color: "#F59E0B" }}
                              disabled={saving}
                            >
                              {product.status.toUpperCase() === "ACTIVE" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              <span className="hidden sm:inline">
                                {product.status.toUpperCase() === "ACTIVE" ? "Desactivar" : "Activar"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && products.length > 0 && (
          <div className="border-t p-4 flex items-center justify-between" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
            <div className="text-sm" style={{ color: "#6B7280" }}>
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalProducts)} de {totalProducts} productos
              <span className="ml-3 text-xs" style={{ color: "#9CA3AF" }}>
                (Ordenados por fecha de creación, más recientes primero)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 border rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  backgroundColor: WHITE,
                  color: PURPLE_COLORS.primary
                }}
                onMouseEnter={(e) => !(currentPage === 1 || loading) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
              >
                Anterior
              </button>
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Página {currentPage} de {Math.ceil(totalProducts / pageSize)}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalProducts / pageSize) || loading}
                className="px-3 py-1.5 border rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  backgroundColor: WHITE,
                  color: PURPLE_COLORS.primary
                }}
                onMouseEnter={(e) => !(currentPage >= Math.ceil(totalProducts / pageSize) || loading) && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const renderCreateForm = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <motion.div
        id="products-section-create"
        key="create-wrapper"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-sm bg-white border p-6 space-y-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        {metaLoading || !meta ? (
          <div className="flex items-center gap-3" style={{ color: PURPLE_COLORS.secondary }}>
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando catálogos para registrar productos...
          </div>
        ) : (
          <form onSubmit={handleSubmitCreate} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: PURPLE_COLORS.dark }}>Nuevo producto</h2>
              {saving && <Loader2 className="animate-spin h-5 w-5" style={{ color: PURPLE_COLORS.secondary }} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm" style={{ color: PURPLE_COLORS.dark }}>Nombre *</label>
                <input
                  required
                  value={createForm.nombre}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm" style={{ color: PURPLE_COLORS.dark }}>Estado</label>
                <select
                  value={createForm.status ?? "ACTIVE"}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as ProductCreatePayload["status"] }))}
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm" style={{ color: PURPLE_COLORS.dark }}>Marca</label>
                <select
                  value={createForm.marca_id ?? ""}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      marca_id: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="">Sin marca</option>
                  {meta?.marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm" style={{ color: PURPLE_COLORS.dark }}>Categoría</label>
                <select
                  value={createForm.categoria_id ?? ""}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      categoria_id: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    color: "#1F2937"
                  }}
                >
                  <option value="">Sin categoría</option>
                  {meta?.categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm" style={{ color: PURPLE_COLORS.dark }}>Descripción</label>
              <textarea
                value={createForm.descripcion ?? ""}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                rows={3}
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                style={{ 
                  borderColor: PURPLE_COLORS.accent,
                  color: "#1F2937"
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Variantes</h3>
                <button
                  type="button"
                  onClick={handleAddCreateVariant}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    backgroundColor: WHITE,
                    color: PURPLE_COLORS.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
                >
                  <Plus size={16} /> Variante
                </button>
              </div>
              <div className="space-y-3">
                {createForm.variantes.map((variant, index) => (
                  <div key={`create-variant-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Nombre</label>
                      <input
                        value={variant.nombre ?? ""}
                        onChange={(event) => handleCreateVariantChange(index, { nombre: event.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                        style={{ 
                          borderColor: PURPLE_COLORS.accent,
                          color: "#1F2937"
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Unidad de medida *</label>
                      <select
                        value={variant.unidad_medida_id}
                        onChange={(event) => handleCreateVariantChange(index, { unidad_medida_id: Number(event.target.value) })}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                        style={{ 
                          borderColor: PURPLE_COLORS.accent,
                          color: "#1F2937"
                        }}
                        required
                      >
                        <option value={0}>Seleccionar unidad</option>
                        {normalizedUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.precio ?? ""}
                        onChange={(event) => handleCreateVariantChange(index, { precio: event.target.value ? Number(event.target.value) : undefined })}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                        style={{ 
                          borderColor: PURPLE_COLORS.accent,
                          color: "#1F2937"
                        }}
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      {createForm.variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCreateVariant(index)}
                          className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity text-red-500"
                        >
                          <Trash2 size={16} /> Quitar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Imágenes</h3>
                <button
                  type="button"
                  onClick={handleAddCreateImage}
                  className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors"
                  style={{ 
                    borderColor: PURPLE_COLORS.accent,
                    backgroundColor: WHITE,
                    color: PURPLE_COLORS.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
                >
                  <Plus size={16} /> Imagen
                </button>
              </div>
              {createForm.imagenes.length === 0 && (
                <p className="text-sm" style={{ color: "#6B7280" }}>Puedes añadir imágenes opcionales para ilustrar el producto.</p>
              )}
              <div className="space-y-3">
                {createForm.imagenes.map((image, index) => (
                  <div key={`create-image-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>URL *</label>
                      <input
                        required
                        value={image.url}
                        onChange={(event) => handleCreateImageChange(index, { url: event.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                        style={{ 
                          borderColor: PURPLE_COLORS.accent,
                          color: "#1F2937"
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs" style={{ color: PURPLE_COLORS.dark }}>Descripción</label>
                      <input
                        value={image.descripcion ?? ""}
                        onChange={(event) => handleCreateImageChange(index, { descripcion: event.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                        style={{ 
                          borderColor: PURPLE_COLORS.accent,
                          color: "#1F2937"
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateImage(index)}
                        className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity text-red-500"
                      >
                        <Trash2 size={16} /> Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: PURPLE_COLORS.primary }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
                disabled={saving}
              >
                Guardar producto
              </button>
            </div>
          </form>
        )}
      </motion.div>
    )
  }

  const renderEditForm = () => {
    // Si no hay producto seleccionado, mostrar lista para seleccionar
    if (editingProductId === null) {
      return (
          <motion.div
          key="edit-select"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#6D28D9" }}>Modificar Producto</h2>
            <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
              Selecciona un producto de la lista para editarlo. Puedes buscar por nombre, marca o categoría.
            </p>
          </div>
          {renderProductsTable({ 
            showFilters: true, 
            highlightStatus: false, 
            sectionId: "products-section-edit-select",
            showEditButton: true 
          })}
        </motion.div>
      )
    }

    // Si hay producto seleccionado, mostrar formulario de edición
    return (
            <motion.div
        key="edit-wrapper"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        id="products-section-edit"
      >
        {metaLoading && !meta ? (
          <div className="rounded-xl shadow-sm bg-white border p-6 flex items-center gap-3" style={{ borderColor: "#EDE9FE", color: "#A78BFA" }}>
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando catálogos para editar...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl shadow-sm bg-white border p-4 flex items-center justify-between" style={{ borderColor: "#EDE9FE" }}>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "#6D28D9" }}>Editando Producto</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>ID: {editingProductId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProductId(null)
                  setEditForm({
                    nombre: undefined,
                    descripcion: undefined,
                    categoria_id: undefined,
                    marca_id: undefined,
                    status: undefined,
                    variantes: [],
                    imagenes: [],
                  })
                }}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ 
                  borderColor: "#EDE9FE",
                  backgroundColor: "#FFFFFF",
                  color: "#8B5CF6"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
              >
                Seleccionar otro producto
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="rounded-xl shadow-sm bg-white border p-6 space-y-6" style={{ borderColor: "#EDE9FE" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Formulario de edición</h3>
                {saving && <Loader2 className="animate-spin h-5 w-5" style={{ color: "#A78BFA" }} />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm" style={{ color: "#6D28D9" }}>Nombre</label>
                  <input
                    required
                    value={editForm.nombre ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm" style={{ color: "#6D28D9" }}>Estado</label>
                  <select
                    value={editForm.status ?? "ACTIVE"}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as ProductUpdatePayload["status"] }))}
                    className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm" style={{ color: "#6D28D9" }}>Marca</label>
                  <select
                    value={editForm.marca_id ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, marca_id: event.target.value ? Number(event.target.value) : undefined }))}
                    className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  >
                    <option value="">Sin marca</option>
                    {meta?.marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm" style={{ color: "#6D28D9" }}>Categoría</label>
                  <select
                    value={editForm.categoria_id ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, categoria_id: event.target.value ? Number(event.target.value) : undefined }))}
                    className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  >
                    <option value="">Sin categoría</option>
                    {meta?.categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm" style={{ color: "#6D28D9" }}>Descripción</label>
                <textarea
                  value={editForm.descripcion ?? ""}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                  rows={3}
                  className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ 
                    borderColor: "#EDE9FE",
                    color: "#1F2937"
                  }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Variantes</h3>
                  <button
                    type="button"
                    onClick={handleAddEditVariant}
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: "#EDE9FE",
                      backgroundColor: "#FFFFFF",
                      color: "#8B5CF6"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                  >
                    <Plus size={16} /> Variante
                  </button>
                </div>
                {editForm.variantes.length === 0 && <p className="text-sm" style={{ color: "#6B7280" }}>No hay variantes registradas.</p>}
                <div className="space-y-3">
                  {editForm.variantes.map((variant, index) => {
                    const markedForDeletion = Boolean(variant.delete)
                    return (
                      <div
                        key={`edit-variant-${variant.id ?? index}`}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-4"
                        style={{ 
                          borderColor: markedForDeletion ? "#EF4444" : "#EDE9FE",
                          backgroundColor: markedForDeletion ? "#FEE2E2" : "#EDE9FE40"
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-xs" style={{ color: "#6D28D9" }}>Nombre</label>
                          <input
                            value={variant.nombre ?? ""}
                            onChange={(event) => handleEditVariantChange(index, { nombre: event.target.value })}
                            disabled={markedForDeletion}
                            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none disabled:opacity-60"
                            style={{ 
                              borderColor: "#EDE9FE",
                              color: "#1F2937"
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs" style={{ color: "#6D28D9" }}>Unidad</label>
                          <select
                            value={variant.unidad_medida_id}
                            onChange={(event) => handleEditVariantChange(index, { unidad_medida_id: Number(event.target.value) })}
                            disabled={markedForDeletion}
                            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none disabled:opacity-60"
                            style={{ 
                              borderColor: "#EDE9FE",
                              color: "#1F2937"
                            }}
                          >
                            <option value={0}>Seleccionar unidad</option>
                            {normalizedUnits.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs" style={{ color: "#6D28D9" }}>Precio</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.precio ?? ""}
                            onChange={(event) => handleEditVariantChange(index, { precio: event.target.value ? Number(event.target.value) : undefined })}
                            disabled={markedForDeletion}
                            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none disabled:opacity-60"
                            style={{ 
                              borderColor: "#EDE9FE",
                              color: "#1F2937"
                            }}
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditVariant(index)}
                            className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                            style={{ color: markedForDeletion ? "#10B981" : "#EF4444" }}
                          >
                            {markedForDeletion ? <RefreshCw size={16} /> : <Trash2 size={16} />}
                            {markedForDeletion ? "Restaurar" : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Imágenes</h3>
                  <button
                    type="button"
                    onClick={handleAddEditImage}
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: "#EDE9FE",
                      backgroundColor: "#FFFFFF",
                      color: "#8B5CF6"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                  >
                    <Plus size={16} /> Imagen
                  </button>
                </div>
                {editForm.imagenes.length === 0 && <p className="text-sm" style={{ color: "#6B7280" }}>Sin imágenes asociadas.</p>}
                <div className="space-y-3">
                  {editForm.imagenes.map((image, index) => {
                    const markedForDeletion = Boolean(image.delete)
                    return (
                      <div
                        key={`edit-image-${image.id ?? index}`}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4"
                        style={{ 
                          borderColor: markedForDeletion ? "#EF4444" : "#EDE9FE",
                          backgroundColor: markedForDeletion ? "#FEE2E2" : "#EDE9FE40"
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-xs" style={{ color: "#6D28D9" }}>URL</label>
                          <input
                            value={image.url}
                            onChange={(event) => handleEditImageChange(index, { url: event.target.value })}
                            disabled={markedForDeletion}
                            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none disabled:opacity-60"
                            style={{ 
                              borderColor: "#EDE9FE",
                              color: "#1F2937"
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs" style={{ color: "#6D28D9" }}>Descripción</label>
                          <input
                            value={image.descripcion ?? ""}
                            onChange={(event) => handleEditImageChange(index, { descripcion: event.target.value })}
                            disabled={markedForDeletion}
                            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none disabled:opacity-60"
                            style={{ 
                              borderColor: "#EDE9FE",
                              color: "#1F2937"
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(index)}
                            className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                            style={{ color: markedForDeletion ? "#10B981" : "#EF4444" }}
                          >
                            {markedForDeletion ? <RefreshCw size={16} /> : <Trash2 size={16} />}
                            {markedForDeletion ? "Restaurar" : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: "#8B5CF6" }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = "#6D28D9")}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#8B5CF6"}
                  disabled={saving}
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    )
  }

  const printProductsPDF = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar todos los productos para el PDF (sin límite de página)
      let allProducts: ProductListItem[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const response = await productsService.listProducts({
          q: filters.q || undefined,
          brand_id: filters.brand_id ? Number(filters.brand_id) : undefined,
          category_id: filters.category_id ? Number(filters.category_id) : undefined,
          status: filters.status || undefined,
          page: currentPage,
          page_size: 100, // Cargar en lotes de 100
        })
        
        if (response.items && response.items.length > 0) {
          allProducts = [...allProducts, ...response.items]
          currentPage++
          hasMore = response.items.length === 100 && allProducts.length < (response.total ?? 0)
        } else {
          hasMore = false
        }
      }

      if (allProducts.length === 0) {
        setError("No hay productos para imprimir")
        setLoading(false)
        return
      }

      const doc = new jsPDF("landscape") // Usar orientación horizontal para más espacio
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      // Encabezado
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("LISTADO DE PRODUCTOS", pageWidth / 2, yPos, { align: "center" })
      yPos += 8

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(`FERRETERÍA URKUPINA`, pageWidth / 2, yPos, { align: "center" })
      yPos += 5
      doc.text(`Generado el ${new Date().toLocaleDateString("es-BO")} a las ${new Date().toLocaleTimeString("es-BO")}`, pageWidth / 2, yPos, { align: "center" })
      yPos += 8

      // Información de filtros aplicados
      if (filters.q || filters.brand_id || filters.category_id || filters.status) {
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.text("Filtros aplicados:", margin, yPos)
        yPos += 5
        if (filters.q) {
          doc.text(`Buscar: ${filters.q}`, margin + 5, yPos)
          yPos += 4
        }
        if (filters.brand_id && meta?.marcas.find(m => m.id === Number(filters.brand_id))) {
          doc.text(`Marca: ${meta.marcas.find(m => m.id === Number(filters.brand_id))?.nombre}`, margin + 5, yPos)
          yPos += 4
        }
        if (filters.category_id && meta?.categorias.find(c => c.id === Number(filters.category_id))) {
          doc.text(`Categoría: ${meta.categorias.find(c => c.id === Number(filters.category_id))?.nombre}`, margin + 5, yPos)
          yPos += 4
        }
        if (filters.status) {
          doc.text(`Estado: ${filters.status}`, margin + 5, yPos)
          yPos += 4
        }
        yPos += 3
      }

      // Tabla con más espacio
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      const colWidths = [20, 80, 50, 50, 40, 30, 30]
      const headers = ["ID", "Producto", "Marca", "Categoría", "Precio", "Variantes", "Estado"]
      let xPos = margin

      // Encabezados de tabla
      headers.forEach((header, idx) => {
        doc.text(header, xPos, yPos)
        xPos += colWidths[idx]
      })
      yPos += 6
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 4

      // Filas de productos
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      allProducts.forEach((product, index) => {
        // Nueva página si es necesario
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = margin
          // Repetir encabezados en nueva página
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          xPos = margin
          headers.forEach((header, idx) => {
            doc.text(header, xPos, yPos)
            xPos += colWidths[idx]
          })
          yPos += 6
          doc.line(margin, yPos, pageWidth - margin, yPos)
          yPos += 4
          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
        }

        xPos = margin
        const productId = String(product.id)
        const productName = product.nombre || "Sin nombre"
        const marca = product.marca?.nombre ?? "-"
        const categoria = product.categoria?.nombre ?? "-"
        const price = product.price !== undefined && product.price !== null
          ? `Bs. ${product.price.toLocaleString("es-BO")}`
          : product.variantes?.[0]?.precio !== undefined && product.variantes[0].precio !== null
          ? `Bs. ${product.variantes[0].precio.toLocaleString("es-BO")}`
          : "-"
        const variantes = product.variantes?.length ?? 0
        const status = product.status === "ACTIVE" ? "Activo" : "Inactivo"

        doc.text(productId, xPos, yPos)
        xPos += colWidths[0]
        doc.text(productName, xPos, yPos, { maxWidth: colWidths[1] - 2 })
        xPos += colWidths[1]
        doc.text(marca, xPos, yPos, { maxWidth: colWidths[2] - 2 })
        xPos += colWidths[2]
        doc.text(categoria, xPos, yPos, { maxWidth: colWidths[3] - 2 })
        xPos += colWidths[3]
        doc.text(price, xPos, yPos)
        xPos += colWidths[4]
        doc.text(String(variantes), xPos, yPos)
        xPos += colWidths[5]
        doc.text(status, xPos, yPos)

        yPos += 7
      })

      // Pie de página
      yPos += 5
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 5
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(`Total de productos: ${allProducts.length}`, margin, yPos)

      doc.save(`productos-${new Date().toISOString().split("T")[0]}.pdf`)
      setFeedback(`PDF generado correctamente con ${allProducts.length} productos.`)
    } catch (err) {
      console.error("Error generando PDF", err)
      setError(err instanceof Error ? err.message : "No se pudo generar el PDF")
    } finally {
      setLoading(false)
    }
  }

  const renderPlaceholder = () => (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-white"
    >
      <h2 className="text-lg font-semibold mb-2">Selecciona una acción</h2>
      <p className="text-sm text-gray-300">
        Usa el menú de acciones para listar, crear o actualizar productos. Este panel se habilita apenas elijas una opción.
      </p>
          </motion.div>
  )

  // Renderizar dashboard de productos
  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos por Categoría */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Productos por Categoría
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalProducts}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +12%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de productos en el catálogo
              </p>
            </div>
            <ChartContainer
              config={{
                value: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>

          {/* Distribución por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Estado de Productos
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {activeProducts}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Activos
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {((activeProducts / totalProducts) * 100).toFixed(1)}% del total
              </p>
            </div>
            <ChartContainer
              config={{
                activos: { color: "#10B981" },
                inactivos: { color: "#EF4444" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    // Solo mostrar etiqueta si el porcentaje es mayor a 5% para evitar superposiciones
                    if (percent < 0.05) return ""
                    return `${name}\n${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={80}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Productos"
            value={totalProducts}
            subtitle="Cantidad total en catálogo"
            icon={Boxes}
            change={{ value: 12.5, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Productos Activos"
            value={activeProducts}
            subtitle="Disponibles para venta"
            icon={CheckCircle}
            change={{ value: 8.7, label: "vs. período anterior" }}
            color="success"
            delay={0.3}
          />
          <KPICard
            title="Productos Inactivos"
            value={inactiveProducts}
            subtitle="Pausados temporalmente"
            icon={XCircle}
            color="warning"
            delay={0.4}
          />
          <KPICard
            title="Total de Variantes"
            value={totalVariants}
            subtitle="Variantes disponibles"
            icon={Tag}
            change={{ value: 18.3, label: "vs. período anterior" }}
            color="info"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Productos con Imágenes"
            value={`${totalProducts > 0 ? Math.round((productsWithImages / totalProducts) * 100) : 0}%`}
            subtitle={`${productsWithImages} de ${totalProducts} productos`}
            icon={ImageIcon}
            change={{ value: 24.1, label: "vs. período anterior" }}
            color="success"
            delay={0.6}
          />
          <KPICard
            title="Productos sin Imágenes"
            value={totalProducts - productsWithImages}
            subtitle="Requieren imágenes"
            icon={ImageIcon}
            color="warning"
            delay={0.7}
          />
          <KPICard
            title="Categorías Activas"
            value={categoryData.length}
            subtitle="Categorías con productos"
            icon={Tag}
            color="info"
            delay={0.8}
          />
          <KPICard
            title="Tasa de Activos"
            value={`${totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}%`}
            subtitle="Productos activos vs. total"
            icon={TrendingUp}
            change={{ value: 5.2, label: "vs. período anterior" }}
            color="success"
            delay={0.9}
          />
        </div>

        {/* Fila Inferior: Tendencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl p-6 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Tendencias Mensuales
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Productos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Variantes</span>
            </div>
          </div>
          <ChartContainer
            config={{
              productos: { color: PURPLE_COLORS.primary },
              variantes: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="productos" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="variantes" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </motion.div>
      </div>
    )
  }

  const renderContent = () => {
    // Si no hay acción seleccionada, mostrar el dashboard
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    // Si es "list", mostrar la lista principal
    if (selectedAction === "list") {
      return renderProductsTable({ showFilters: true, highlightStatus: true, sectionId: "products-section-list" })
    }
    
    switch (selectedAction) {
      case "status":
        if (!canManageProducts) {
          return (
            <motion.div
              key="status-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para cambiar el estado de productos. Se requiere rol ADMIN.
              </p>
            </motion.div>
          )
        }
        return (
          <motion.div
            key="status-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#6D28D9" }}>Cambio de Estado de Productos</h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Activa o desactiva productos del catálogo. Los productos inactivos no se mostrarán en el ecommerce.
              </p>
            </div>
            {renderProductsTable({ showFilters: true, highlightStatus: true, sectionId: "products-section-status" })}
          </motion.div>
        )
      case "create":
        if (!canManageProducts) {
          return (
            <motion.div
              key="create-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para crear productos. Se requiere rol ADMIN.
              </p>
            </motion.div>
          )
        }
        return renderCreateForm()
      case "edit":
        if (!canManageProducts) {
          return (
            <motion.div
              key="edit-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para editar productos. Se requiere rol ADMIN.
              </p>
            </motion.div>
          )
        }
        return renderEditForm()
      case "print":
        return (
          <motion.div
            key="print-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-sm bg-white border p-6"
            style={{ borderColor: "#EDE9FE" }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: "#6D28D9" }}>Imprimir Listado de Productos</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
              Se generará un PDF con todos los productos {filters.q || filters.brand_id || filters.category_id || filters.status ? "que coincidan con los filtros actuales" : "disponibles"}.
            </p>
            <button
              onClick={printProductsPDF}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
              Generar PDF
            </button>
          </motion.div>
        )
      default:
        return renderPlaceholder()
    }
  }

  const handleActionSelect = (actionId: string) => {
    setError(null)
    setFeedback(null)
    if (actionId === "create" || actionId === "edit") {
      void loadMeta()
    }
    setSelectedAction(actionId)
    if (["list", "status", "search"].includes(actionId)) {
      void reloadProducts()
    }
  }

  // Cargar meta cuando se necesita (create o edit)
  useEffect(() => {
    if ((selectedAction === "create" || selectedAction === "edit") && !meta && !metaLoading) {
      void loadMeta()
    }
  }, [selectedAction, meta, metaLoading, loadMeta])

  useEffect(() => {
    if (!meta || !meta.unidades || meta.unidades.length === 0) {
      return
    }
    setCreateForm((prev) => ({
      ...prev,
      variantes: prev.variantes.map((variant) => ensureVariantUnit(variant)),
    }))
    setEditForm((prev) => ({
      ...prev,
      variantes: prev.variantes.map((variant) => ensureVariantUnit(variant)),
    }))
  }, [meta, ensureVariantUnit])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Productos</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona tu catálogo de productos, variantes e inventario
        </p>
      </div>

      {feedback && (
        <div className="border border-green-600 bg-green-600/90 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle size={16} className="text-white" /> {feedback}
        </div>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {renderContent()}

      {/* Modal para ver variantes */}
      <AnimatePresence>
        {selectedProductForVariants && (
          <motion.div
            key="variants-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedProductForVariants(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-lg border bg-white p-6 shadow-lg"
              style={{ borderColor: "#EDE9FE" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>
                    Variantes de: {selectedProductForVariants.nombre}
                  </h3>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {selectedProductForVariants.variantes?.length ?? 0} variante(s) registrada(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForVariants(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {selectedProductForVariants.variantes && selectedProductForVariants.variantes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedProductForVariants.variantes.map((variant, index) => (
                    <div
                      key={variant.id ?? index}
                      className="border rounded-lg p-4"
                      style={{ borderColor: "#EDE9FE", backgroundColor: "#F9FAFB" }}
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold" style={{ color: "#6D28D9" }}>Nombre:</span>
                          <p className="mt-1" style={{ color: "#1F2937" }}>{variant.nombre || "Sin nombre"}</p>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: "#6D28D9" }}>Precio:</span>
                          <p className="mt-1" style={{ color: "#1F2937" }}>
                            {variant.precio !== undefined && variant.precio !== null
                              ? new Intl.NumberFormat("es-BO", {
                                  style: "currency",
                                  currency: "BOB",
                                  maximumFractionDigits: 2,
                                }).format(variant.precio)
                              : "No definido"}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: "#6D28D9" }}>Unidad de medida:</span>
                          <p className="mt-1" style={{ color: "#1F2937" }}>
                            {variant.unidad_medida?.nombre || "No definida"}
                          </p>
                        </div>
                        {variant.id && (
                          <div>
                            <span className="font-semibold" style={{ color: "#6D28D9" }}>ID:</span>
                            <p className="mt-1 font-mono text-xs" style={{ color: "#6B7280" }}>{variant.id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: "#6B7280" }}>
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Este producto no tiene variantes registradas.</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProductForVariants(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: "#8B5CF6" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6D28D9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
