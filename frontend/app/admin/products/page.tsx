"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { productsService } from "@/lib/services/products-service"
import type { Product, ProductVariant, Brand, Category, ID } from "@/lib/contracts"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductFormData {
  name: string
  sku: string
  slug: string
  brandId: ID
  categoryId: ID
  description?: string
  status: "ACTIVE" | "INACTIVE"
  taxRate?: number
}

interface VariantFormData {
  sku: string
  attributes: Record<string, string>
  barcode?: string
  price: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<ID | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    slug: "",
    brandId: "",
    categoryId: "",
    description: "",
    status: "ACTIVE",
    taxRate: 0.13,
  })
  const [variantFormData, setVariantFormData] = useState<VariantFormData>({
    sku: "",
    attributes: {},
    barcode: "",
    price: 0,
  })

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      sku: "",
      slug: "",
      brandId: "",
      categoryId: "",
      description: "",
      status: "ACTIVE",
      taxRate: 0.13,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      brandId: product.brandId,
      categoryId: product.categoryId,
      description: product.description,
      status: product.status,
      taxRate: product.taxRate,
    })
    setIsFormOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.name || !formData.sku || !formData.brandId || !formData.categoryId) {
        alert("Por favor complete todos los campos requeridos")
        return
      }

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, formData)
        setProducts(products.map((p) => (p.id === editingProduct.id ? { ...p, ...formData } : p)))
      } else {
        const newProduct = await productsService.createProduct(formData)
        setProducts([...products, newProduct])
      }
      setIsFormOpen(false)
      alert(editingProduct ? "Producto actualizado" : "Producto creado exitosamente")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error procesando formulario")
    }
  }

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !variantFormData.sku || variantFormData.price <= 0) {
      alert("Por favor complete todos los campos requeridos")
      return
    }
    try {
      const newVariant = await productsService.createVariant(selectedProductId, variantFormData)
      setVariants([...variants, newVariant])
      setVariantFormData({ sku: "", attributes: {}, barcode: "", price: 0 })
      setIsVariantFormOpen(false)
      alert("Variante creada exitosamente")
    } catch (error) {
      console.error("Error creating variant:", error)
      alert("Error creando variante")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, brandsData, categoriesData] = await Promise.all([
          productsService.listProducts(),
          productsService.listBrands(),
          productsService.listCategories(),
        ])
        setProducts((productsData as any)?.items ?? (Array.isArray(productsData) ? productsData : []));
        setBrands(brandsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDelete = async (id: ID) => {
    if (confirm("¿Desea eliminar este producto?")) {
      try {
        await productsService.deleteProduct(id)
        setProducts(products.filter((p) => p.id !== id))
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  const handleDeleteVariant = async (variantId: ID, productId: ID) => {
    if (confirm("¿Desea eliminar esta variante?")) {
      try {
        await productsService.deleteVariant(variantId)
        setVariants(variants.filter((v) => v.id !== variantId))
      } catch (error) {
        console.error("Error deleting variant:", error)
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value)
  }

  const getBrandName = (brandId: ID) => brands.find((b) => b.id === brandId)?.name || "-"
  const getCategoryName = (categoryId: ID) => categories.find((c) => c.id === categoryId)?.name || "-"
  const getProductVariants = (productId: ID) => variants.filter((v) => v.productId === productId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos</h1>
        <button
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-300">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Marca</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Categoría</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Variantes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {products.map((product) => {
                  const productVariants = getProductVariants(product.id)
                  return (
                    <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-200">{product.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-200">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{getBrandName(product.brandId)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{getCategoryName(product.categoryId)}</td>
                      <td className="px-6 py-4 text-sm text-gray-200">{productVariants.length}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.status === "ACTIVE"
                              ? "bg-green-600/20 text-green-400"
                              : "bg-red-600/20 text-red-400"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-gray-300 hover:text-blue-400 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProductId(product.id)
                              setIsVariantFormOpen(true)
                            }}
                            className="text-gray-300 hover:text-yellow-400 transition-colors"
                            title="Agregar variante"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">Marca *</label>
                    <select
                      required
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Seleccionar marca</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">Categoría *</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 min-h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">IVA (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate || 0}
                      onChange={(e) => setFormData({ ...formData, taxRate: Number.parseFloat(e.target.value) })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-200">Estado *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVariantFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Nueva Variante</h2>
                <button
                  onClick={() => setIsVariantFormOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddVariant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">SKU Variante *</label>
                  <input
                    type="text"
                    required
                    value={variantFormData.sku}
                    onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Código de Barras</label>
                  <input
                    type="text"
                    value={variantFormData.barcode}
                    onChange={(e) => setVariantFormData({ ...variantFormData, barcode: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={variantFormData.price}
                    onChange={(e) =>
                      setVariantFormData({ ...variantFormData, price: Number.parseFloat(e.target.value) })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsVariantFormOpen(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Crear Variante
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
