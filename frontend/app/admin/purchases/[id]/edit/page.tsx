"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { purchasesService } from "@/lib/services/purchases-service"
import { suppliersService } from "@/lib/services/suppliers-service"
import { productsService } from "@/lib/services/products-service"
import { Loader2, X, FilePlus, ArrowLeft, Save } from "lucide-react"
import type { PurchaseOrder } from "@/lib/types/admin"
import type { AdminSupplier } from "@/lib/services/suppliers-service"
import type { ProductListItem } from "@/lib/services/products-service"

const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

export default function PurchaseEditPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = parseInt(params.id as string)
  
  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    supplierId: "",
    items: [] as Array<{
      variantId: string
      productId: number
      productName: string
      variantName: string
      qty: string
      price: string
    }>,
    observaciones: "",
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [orderData, suppliersData, productsData] = await Promise.all([
          purchasesService.getPO(orderId),
          suppliersService.listSuppliers(),
          productsService.listProducts({ page: 1, page_size: 100 }),
        ])
        
        if (orderData.status !== "borrador") {
          setError("Solo se pueden editar órdenes en estado BORRADOR")
          return
        }
        
        setOrder(orderData)
        setSuppliers(suppliersData)
        setProducts(productsData.items)
        
        // Cargar datos del formulario desde la orden
        setFormData({
          supplierId: typeof orderData.supplierId === "number" ? String(orderData.supplierId) : "",
          items: orderData.items.map(item => ({
            variantId: String(item.productId), // productId es variante_producto_id
            productId: item.productId,
            productName: `Item ${item.id}`,
            variantName: "Variante",
            qty: String(item.qty),
            price: String(item.price),
          })),
          observaciones: orderData.observaciones || "",
        })
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [orderId])

  const handleAddItem = () => {
    const firstProduct = products[0]
    if (firstProduct) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          variantId: firstProduct.variantes?.[0]?.id ? String(firstProduct.variantes[0].id) : "",
          productId: firstProduct.id,
          productName: firstProduct.nombre,
          variantName: firstProduct.variantes?.[0]?.nombre || "Variante",
          qty: "1",
          price: String(firstProduct.variantes?.[0]?.precio || 0),
        }],
      }))
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.supplierId) {
      setError("Debes seleccionar un proveedor")
      return
    }
    if (formData.items.length === 0) {
      setError("Debes agregar al menos un ítem")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const items = formData.items.map(item => ({
        variante_producto_id: Number(item.variantId),
        cantidad: Number(item.qty),
        precio_unitario: item.price ? Number(item.price) : null,
      }))

      await purchasesService.updatePO(orderId, {
        proveedor_id: Number(formData.supplierId),
        items,
        observaciones: formData.observaciones || null,
      })

      router.push("/admin/purchases?action=list")
    } catch (err) {
      console.error("Error updating purchase order", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar la orden de compra")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} style={{ color: PURPLE_COLORS.primary }} />
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/admin/purchases")}
          className="mb-4 flex items-center gap-2 text-sm hover:opacity-80"
          style={{ color: PURPLE_COLORS.primary }}
        >
          <ArrowLeft size={16} />
          Volver a compras
        </button>
        <div className="text-center py-12 text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/purchases")}
          className="flex items-center gap-2 text-sm hover:opacity-80"
          style={{ color: PURPLE_COLORS.primary }}
        >
          <ArrowLeft size={16} />
          Volver a compras
        </button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
            Editar orden de compra #{orderId}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Modifica los productos y cantidades de la orden
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: PURPLE_COLORS.dark }}>
            Proveedor <span className="text-red-600">*</span>
          </label>
          {loadingSuppliers ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
              <Loader2 className="animate-spin" size={16} />
              Cargando proveedores...
            </div>
          ) : (
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            >
              <option value="">Selecciona un proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>
              Items <span className="text-red-600">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              + Agregar ítem
            </button>
          </div>
          {formData.items.length === 0 ? (
            <div className="text-sm text-center py-4 border rounded-lg" style={{ borderColor: PURPLE_COLORS.accent, color: "#6B7280" }}>
              No hay ítems agregados. Haz clic en "Agregar ítem" para comenzar.
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId)
                return (
                  <div key={index} className="border rounded-lg p-4" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Producto</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const product = products.find(p => p.id === Number(e.target.value))
                            const variant = product?.variantes?.[0]
                            setFormData(prev => ({
                              ...prev,
                              items: prev.items.map((it, i) => i === index ? {
                                ...it,
                                productId: Number(e.target.value),
                                productName: product?.nombre || "",
                                variantId: variant ? String(variant.id) : "",
                                variantName: variant?.nombre || "Variante",
                                price: String(variant?.precio || 0),
                              } : it),
                            }))
                          }}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                        >
                          <option value="">Selecciona producto</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === index ? { ...it, qty: e.target.value } : it),
                          }))}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: PURPLE_COLORS.dark }}>Precio unitario</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            items: prev.items.map((it, i) => i === index ? { ...it, price: e.target.value } : it),
                          }))}
                          className="w-full border rounded py-1.5 px-2 text-sm bg-white focus:outline-none"
                          style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="w-full hover:opacity-80 transition-opacity text-red-500 text-sm"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: PURPLE_COLORS.dark }}>
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => router.push("/admin/purchases")}
            className="px-4 py-2 border rounded-lg text-sm transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: "#FFFFFF",
              color: PURPLE_COLORS.primary
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !formData.supplierId || formData.items.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  )
}

