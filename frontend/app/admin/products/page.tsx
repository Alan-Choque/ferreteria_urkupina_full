"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
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
} from "lucide-react"
import jsPDF from "jspdf"

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
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
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

  const actions: ActionItem[] = [
    {
      id: "list",
      label: "Listar productos",
      description: "Consulta el catálogo con filtros, variantes e inventario asociado.",
      status: "disponible",
      icon: <Boxes className="h-5 w-5" />,
    },
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
    {
      id: "search",
      label: "Buscar producto",
      description: "Localiza productos por ID, SKU o nombre comercial.",
      status: "disponible",
      icon: <Search className="h-5 w-5" />,
    },
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

  const renderProductsTable = (options?: { showFilters?: boolean; highlightStatus?: boolean; sectionId?: string }) => {
    const { showFilters = true, highlightStatus = true, sectionId } = options ?? {}
    return (
      <motion.div
        id={sectionId}
        key={`products-table-${showFilters ? "filters" : "compact"}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
      >
        {showFilters && (
          <div className="border-b border-gray-700 bg-gray-900/60 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    value={filters.q}
                    onChange={(event) => handleFilterChange("q", event.target.value)}
                    placeholder="Nombre, descripción..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Marca</label>
                <select
                  value={filters.brand_id}
                  onChange={(event) => handleFilterChange("brand_id", event.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-red-500"
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
                <label className="text-xs text-gray-400">Categoría</label>
                <select
                  value={filters.category_id}
                  onChange={(event) => handleFilterChange("category_id", event.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-red-500"
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
                <label className="text-xs text-gray-400">Estado</label>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange("status", event.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-red-500"
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
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm"
                disabled={loading}
              >
                <Search size={16} /> Aplicar filtros
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 border border-gray-600 px-4 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700/60"
                disabled={loading}
              >
                <RefreshCw size={16} /> Limpiar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 flex items-center justify-center text-gray-300">
            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Cargando productos...
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-300">No se encontraron productos con los filtros actuales.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">ID</th>
                  <th className="px-6 py-3 text-left font-semibold">Producto</th>
                  <th className="px-6 py-3 text-left font-semibold">Marca</th>
                  <th className="px-6 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-6 py-3 text-left font-semibold">Precio</th>
                  <th className="px-6 py-3 text-left font-semibold">Variantes</th>
                  <th className="px-6 py-3 text-left font-semibold">Estado</th>
                  <th className="px-6 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-400">{product.id}</td>
                    <td className="px-6 py-4 text-gray-100">
                      <div className="flex flex-col">
                        <span className="font-semibold">{product.nombre}</span>
                        {product.short && (
                          <span className="text-xs text-gray-400 line-clamp-2">{product.short}</span>
                        )}
                      </div>
                      </td>
                    <td className="px-6 py-4 text-gray-300">{product.marca?.nombre ?? "-"}</td>
                    <td className="px-6 py-4 text-gray-300">{product.categoria?.nombre ?? "-"}</td>
                    <td className="px-6 py-4 text-gray-200">
                      {product.price !== undefined && product.price !== null
                        ? new Intl.NumberFormat("es-BO", {
                            style: "currency",
                            currency: "BOB",
                            maximumFractionDigits: 2,
                          }).format(product.price)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{product.variantes?.length ?? 0}</td>
                    <td className="px-6 py-4">{highlightStatus ? renderStatusBadge(product.status) : product.status}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                          type="button"
                          onClick={() => openEditProduct(product.id)}
                          className="inline-flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={16} />
                          <span className="hidden sm:inline">Editar</span>
                          </button>
                        {highlightStatus && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            className="inline-flex items-center gap-1 text-gray-300 hover:text-amber-400 transition-colors"
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
          <div className="border-t border-gray-700 bg-gray-900/60 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalProducts)} de {totalProducts} productos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-300">
                Página {currentPage} de {Math.ceil(totalProducts / pageSize)}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalProducts / pageSize) || loading}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const renderCreateForm = () => (
          <motion.div
      id="products-section-create"
      key="create-wrapper"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6 text-white"
    >
      {metaLoading || !meta ? (
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando catálogos para registrar productos...
              </div>
      ) : (
        <form onSubmit={handleSubmitCreate} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Nuevo producto</h2>
            {saving && <Loader2 className="animate-spin h-5 w-5 text-gray-300" />}
                  </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Nombre *</label>
                    <input
                      required
                value={createForm.nombre}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Estado</label>
              <select
                value={createForm.status ?? "ACTIVE"}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as ProductCreatePayload["status"] }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
                </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Marca</label>
                    <select
                value={createForm.marca_id ?? ""}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    marca_id: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
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
              <label className="text-sm text-gray-300">Categoría</label>
                    <select
                value={createForm.categoria_id ?? ""}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    categoria_id: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
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
            <label className="text-sm text-gray-300">Descripción</label>
                  <textarea
              value={createForm.descripcion ?? ""}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, descripcion: event.target.value }))}
              rows={3}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Variantes</h3>
              <button
                type="button"
                onClick={handleAddCreateVariant}
                className="inline-flex items-center gap-2 text-sm bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 hover:border-orange-500"
              >
                <Plus size={16} /> Variante
              </button>
            </div>
            <div className="space-y-3">
              {createForm.variantes.map((variant, index) => (
                <div key={`create-variant-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Nombre</label>
                    <input
                      value={variant.nombre ?? ""}
                      onChange={(event) => handleCreateVariantChange(index, { nombre: event.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Unidad de medida *</label>
                    <select
                      value={variant.unidad_medida_id}
                      onChange={(event) => handleCreateVariantChange(index, { unidad_medida_id: Number(event.target.value) })}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
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
                    <label className="text-xs text-gray-400">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.precio ?? ""}
                      onChange={(event) => handleCreateVariantChange(index, { precio: event.target.value ? Number(event.target.value) : undefined })}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                </div>
                  <div className="flex items-end justify-end">
                    {createForm.variantes.length > 1 && (
                  <button
                    type="button"
                        onClick={() => handleRemoveCreateVariant(index)}
                        className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
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
              <h3 className="text-lg font-semibold">Imágenes</h3>
              <button
                type="button"
                onClick={handleAddCreateImage}
                className="inline-flex items-center gap-2 text-sm bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 hover:border-orange-500"
              >
                <Plus size={16} /> Imagen
              </button>
            </div>
            {createForm.imagenes.length === 0 && (
              <p className="text-sm text-gray-400">Puedes añadir imágenes opcionales para ilustrar el producto.</p>
            )}
            <div className="space-y-3">
              {createForm.imagenes.map((image, index) => (
                <div key={`create-image-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-900/60 border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">URL *</label>
                    <input
                      required
                      value={image.url}
                      onChange={(event) => handleCreateImageChange(index, { url: event.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Descripción</label>
                    <input
                      value={image.descripcion ?? ""}
                      onChange={(event) => handleCreateImageChange(index, { descripcion: event.target.value })}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveCreateImage(index)}
                      className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
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
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
              disabled={saving}
                  >
              Guardar producto
                  </button>
                </div>
              </form>
        )}
    </motion.div>
  )

  const renderEditForm = () => (
          <motion.div
      key="edit-wrapper"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6 text-white"
      id="products-section-edit"
    >
      {editingProductId === null ? (
        <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-6 text-center text-gray-300">
          <p className="mb-3">Elige un producto desde el listado y haz clic en "Editar" para cargarlo aquí.</p>
                <button
            type="button"
            onClick={() => setSelectedAction(null)}
            className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-red-500"
                >
            <Search size={16} /> Volver al menú
                </button>
              </div>
      ) : metaLoading && !meta ? (
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando catálogos para editar...
        </div>
      ) : (
        <form onSubmit={handleSubmitEdit} className="space-y-6">
          <div className="flex items-center justify-between">
                <div>
              <h2 className="text-xl font-semibold">Editar producto</h2>
              {editingProductId ? (
                <p className="text-sm text-gray-400">ID seleccionado: {editingProductId}</p>
              ) : (
                <p className="text-sm text-gray-400">Selecciona un producto desde el listado para editarlo.</p>
              )}
            </div>
            {saving && <Loader2 className="animate-spin h-5 w-5 text-gray-300" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Nombre</label>
                  <input
                    required
                value={editForm.nombre ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Estado</label>
              <select
                value={editForm.status ?? "ACTIVE"}
                onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as ProductUpdatePayload["status"] }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Marca</label>
              <select
                value={editForm.marca_id ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, marca_id: event.target.value ? Number(event.target.value) : undefined }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
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
              <label className="text-sm text-gray-300">Categoría</label>
              <select
                value={editForm.categoria_id ?? ""}
                onChange={(event) => setEditForm((prev) => ({ ...prev, categoria_id: event.target.value ? Number(event.target.value) : undefined }))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
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
            <label className="text-sm text-gray-300">Descripción</label>
            <textarea
              value={editForm.descripcion ?? ""}
              onChange={(event) => setEditForm((prev) => ({ ...prev, descripcion: event.target.value }))}
              rows={3}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Variantes</h3>
              <button
                type="button"
                onClick={handleAddEditVariant}
                className="inline-flex items-center gap-2 text-sm bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 hover:border-orange-500"
              >
                <Plus size={16} /> Variante
              </button>
            </div>
            {editForm.variantes.length === 0 && <p className="text-sm text-gray-400">No hay variantes registradas.</p>}
            <div className="space-y-3">
              {editForm.variantes.map((variant, index) => {
                const markedForDeletion = Boolean(variant.delete)
                return (
                  <div
                    key={`edit-variant-${variant.id ?? index}`}
                    className={`grid grid-cols-1 md:grid-cols-4 gap-3 border rounded-lg p-4 ${
                      markedForDeletion ? "border-red-700 bg-red-900/20" : "border-gray-700 bg-gray-900/60"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">Nombre</label>
                  <input
                        value={variant.nombre ?? ""}
                        onChange={(event) => handleEditVariantChange(index, { nombre: event.target.value })}
                        disabled={markedForDeletion}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
                  />
                </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">Unidad</label>
                      <select
                        value={variant.unidad_medida_id}
                        onChange={(event) => handleEditVariantChange(index, { unidad_medida_id: Number(event.target.value) })}
                        disabled={markedForDeletion}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
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
                      <label className="text-xs text-gray-400">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                        value={variant.precio ?? ""}
                        onChange={(event) => handleEditVariantChange(index, { precio: event.target.value ? Number(event.target.value) : undefined })}
                        disabled={markedForDeletion}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
                  />
                </div>
                    <div className="flex items-end justify-end">
                  <button
                    type="button"
                        onClick={() => handleRemoveEditVariant(index)}
                        className={`inline-flex items-center gap-1 text-sm ${
                          markedForDeletion ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"
                        }`}
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
              <h3 className="text-lg font-semibold">Imágenes</h3>
              <button
                type="button"
                onClick={handleAddEditImage}
                className="inline-flex items-center gap-2 text-sm bg-gray-900 px-3 py-2 rounded-lg border border-gray-700 hover:border-orange-500"
              >
                <Plus size={16} /> Imagen
              </button>
            </div>
            {editForm.imagenes.length === 0 && <p className="text-sm text-gray-400">Sin imágenes asociadas.</p>}
            <div className="space-y-3">
              {editForm.imagenes.map((image, index) => {
                const markedForDeletion = Boolean(image.delete)
                return (
                  <div
                    key={`edit-image-${image.id ?? index}`}
                    className={`grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4 ${
                      markedForDeletion ? "border-red-700 bg-red-900/20" : "border-gray-700 bg-gray-900/60"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">URL</label>
                      <input
                        value={image.url}
                        onChange={(event) => handleEditImageChange(index, { url: event.target.value })}
                        disabled={markedForDeletion}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-gray-400">Descripción</label>
                      <input
                        value={image.descripcion ?? ""}
                        onChange={(event) => handleEditImageChange(index, { descripcion: event.target.value })}
                        disabled={markedForDeletion}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveEditImage(index)}
                        className={`inline-flex items-center gap-1 text-sm ${
                          markedForDeletion ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"
                        }`}
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
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
              disabled={saving}
                  >
              Guardar cambios
                  </button>
                </div>
              </form>
      )}
            </motion.div>
  )

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

  const renderContent = () => {
    switch (selectedAction) {
      case "list":
        return renderProductsTable({ showFilters: true, highlightStatus: true, sectionId: "products-section-list" })
      case "status":
        return renderProductsTable({ showFilters: false, highlightStatus: true, sectionId: "products-section-status" })
      case "search":
        return renderProductsTable({ showFilters: true, highlightStatus: false, sectionId: "products-section-search" })
      case "create":
        return renderCreateForm()
      case "edit":
        return renderEditForm()
      case "print":
        return (
          <motion.div
            key="print-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-white"
          >
            <h2 className="text-xl font-semibold mb-4">Imprimir Listado de Productos</h2>
            <p className="text-sm text-gray-300 mb-6">
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Productos</h1>
        </div>
        <button
          type="button"
          onClick={() => reloadProducts()}
          className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-red-500 px-4 py-2 rounded-lg text-sm text-gray-200"
          disabled={loading}
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {selectedAction === null ? (
        <ActionsGrid
          title="Panel de productos"
          subtitle="Operaciones disponibles"
          actions={actions}
          selectedAction={selectedAction}
          onSelect={handleActionSelect}
        />
      ) : (
        <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span className="font-semibold">{actions.find((action) => action.id === selectedAction)?.label ?? ""}</span>
            {metaLoading && (selectedAction === "create" || selectedAction === "edit") && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedAction(null)
              setEditingProductId(null)
            }}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-red-500 hover:bg-gray-800"
          >
            <ArrowLeft size={16} /> Volver al menú de acciones
          </button>
        </div>
      )}

      {feedback && (
        <div className="border border-green-700 bg-green-900/20 text-green-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {feedback}
        </div>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {renderContent()}
    </div>
  )
}
