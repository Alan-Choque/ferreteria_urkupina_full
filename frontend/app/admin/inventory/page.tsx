"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  inventoryService,
  type InventoryAdjustmentPayload,
  type InventoryEntryPayload,
  type InventoryTransferPayload,
  type StockEntry,
  type StockSummary,
  type VariantSearchItem,
  type Warehouse,
} from "@/lib/services/inventory-service"
import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Trash2,
  CheckCircle,
  X,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
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
import { KPICard } from "@/components/admin/KPICard"
import { usePermissions } from "@/lib/hooks/usePermissions"

type VariantPickerContext = {
  form: "entry" | "transfer" | "adjust"
  index: number
}

type EntryItemState = {
  variante_id?: number
  variante_label?: string
  cantidad: string
  costo_unitario: string
}

type TransferItemState = {
  variante_id?: number
  variante_label?: string
  cantidad: string
}

type AdjustmentItemState = {
  almacen_id: string
  variante_id?: number
  variante_label?: string
  cantidad_nueva: string
}

type VariantSearchState = {
  open: boolean
  context: VariantPickerContext | null
  term: string
  results: VariantSearchItem[]
  loading: boolean
  error: string | null
}

const initialVariantSearch: VariantSearchState = {
  open: false,
  context: null,
  term: "",
  results: [],
  loading: false,
  error: null,
}

const emptyEntryItem = (): EntryItemState => ({
  cantidad: "",
  costo_unitario: "",
})

const emptyTransferItem = (): TransferItemState => ({
  cantidad: "",
})

const emptyAdjustmentItem = (): AdjustmentItemState => ({
  almacen_id: "",
  cantidad_nueva: "",
})

export default function InventoryPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/inventory" || pathname === "/admin/inventory/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(getActionFromPath())
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  
  const [stocks, setStocks] = useState<StockSummary[]>([])
  const [loadingStocks, setLoadingStocks] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehousesLoading, setWarehousesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [variantSearch, setVariantSearch] = useState<VariantSearchState>(initialVariantSearch)

  const [entryForm, setEntryForm] = useState<{
    almacen_id: string
    descripcion: string
    items: EntryItemState[]
  }>({
    almacen_id: "",
    descripcion: "",
    items: [emptyEntryItem()],
  })

  const [transferForm, setTransferForm] = useState<{
    almacen_origen_id: string
    almacen_destino_id: string
    descripcion: string
    items: TransferItemState[]
  }>({
    almacen_origen_id: "",
    almacen_destino_id: "",
    descripcion: "",
    items: [emptyTransferItem()],
  })

  const [adjustForm, setAdjustForm] = useState<{
    descripcion: string
    items: AdjustmentItemState[]
  }>({
    descripcion: "",
    items: [emptyAdjustmentItem()],
  })

  const loadStocks = async () => {
    setLoadingStocks(true)
    setError(null)
    try {
      const data = await inventoryService.listStocks()
      setStocks(data)
    } catch (err) {
      console.error("Error loading inventory", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el inventario.")
    } finally {
      setLoadingStocks(false)
    }
  }

  const loadWarehouses = async () => {
    if (warehouses.length > 0 || warehousesLoading) return
    setWarehousesLoading(true)
    try {
      const data = await inventoryService.listWarehouses()
      setWarehouses(data)
    } catch (err) {
      console.error("Error loading warehouses", err)
      setError(err instanceof Error ? err.message : "No se pudieron cargar los almacenes.")
    } finally {
      setWarehousesLoading(false)
    }
  }

  useEffect(() => {
    void loadStocks()
    void loadWarehouses()
  }, [])
  
  // Cargar datos cuando cambia la acción
  useEffect(() => {
    if (selectedAction === "stock" || selectedAction === "list") {
      void loadStocks()
    }
    if (selectedAction === "register" || selectedAction === "transfer" || selectedAction === "adjustments") {
      void loadWarehouses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [feedback])

  const { canViewInventory, canUpdateStock } = usePermissions()
  
  const actions: ActionItem[] = useMemo(
    () => [
      ...(canViewInventory ? [{
        id: "list",
        label: "Stock por almacén",
        description: "Consulta existencias detalladas por variante y ubicación.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      }] : []),
      ...(canUpdateStock ? [
        {
          id: "register",
          label: "Registrar ingreso",
          description: "Captura compras, devoluciones o ajustes positivos al inventario.",
          status: "disponible",
          icon: <ArrowDownCircle className="h-5 w-5" />,
        },
        {
          id: "transfer",
          label: "Transferencias",
          description: "Mueve stock entre almacenes controlando salidas y entradas.",
          status: "disponible",
          icon: <ArrowRightLeft className="h-5 w-5" />,
        },
        {
          id: "adjustments",
          label: "Ajustes y mermas",
          description: "Regulariza diferencias detectadas en conteos físicos o mermas.",
          status: "disponible",
          icon: <Scale className="h-5 w-5" />,
        },
      ] : []),
      ...(canViewInventory ? [{
        id: "print",
        label: "Exportar inventario",
        description: "Genera un corte imprimible del stock consolidado.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      }] : []),
    ],
    [canViewInventory, canUpdateStock],
  )

  const handleActionSelect = (actionId: string) => {
    setError(null)
    setFeedback(null)
    setVariantSearch({ ...initialVariantSearch })
    setSelectedAction(actionId)
    if (actionId === "list" || actionId === "print") {
      void loadStocks()
    }
    if (actionId === "register" || actionId === "transfer" || actionId === "adjustments") {
      void loadWarehouses()
    }
  }

  const openVariantSelector = (context: VariantPickerContext) => {
    setVariantSearch({
      open: true,
      context,
      term: "",
      results: [],
      loading: false,
      error: null,
    })
  }

  const closeVariantSelector = () => setVariantSearch({ ...initialVariantSearch })

  const handleVariantSearch = async () => {
    if (!variantSearch.term || variantSearch.term.trim().length < 2) {
      setVariantSearch((prev) => ({ ...prev, error: "Escribe al menos 2 caracteres para buscar." }))
      return
    }
    setVariantSearch((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const results = await inventoryService.searchVariants(variantSearch.term.trim())
      setVariantSearch((prev) => ({ ...prev, results }))
    } catch (err) {
      console.error("Error searching variants", err)
      setVariantSearch((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "No se pudo buscar la variante.",
      }))
    } finally {
      setVariantSearch((prev) => ({ ...prev, loading: false }))
    }
  }

  const variantLabel = (item: VariantSearchItem) => {
    if (item.variante_nombre && item.variante_nombre !== item.producto_nombre) {
      return `${item.producto_nombre} • ${item.variante_nombre}`
    }
    return item.producto_nombre
  }

  const applyVariantToForm = (variant: VariantSearchItem) => {
    if (!variantSearch.context) return
    const label = variantLabel(variant)
    const { form, index } = variantSearch.context
    switch (form) {
      case "entry":
        setEntryForm((prev) => {
          const items = [...prev.items]
          if (!items[index]) return prev
          items[index] = { ...items[index], variante_id: variant.id, variante_label: label }
          return { ...prev, items }
        })
        break
      case "transfer":
        setTransferForm((prev) => {
          const items = [...prev.items]
          if (!items[index]) return prev
          items[index] = { ...items[index], variante_id: variant.id, variante_label: label }
          return { ...prev, items }
        })
        break
      case "adjust":
        setAdjustForm((prev) => {
          const items = [...prev.items]
          if (!items[index]) return prev
          items[index] = { ...items[index], variante_id: variant.id, variante_label: label }
          return { ...prev, items }
        })
        break
      default:
        break
    }
    closeVariantSelector()
  }

  const mergeUpdatedStock = (updated: StockEntry[]) => {
    if (!updated.length) return
    setStocks((prev) => {
      const map = new Map(prev.map((item) => [`${item.variante_id}-${item.almacen_id}`, item]))
      updated.forEach((item) => {
        const key = `${item.variante_id}-${item.almacen_id}`
        const existing = map.get(key)
        if (existing) {
          map.set(key, {
            ...existing,
            cantidad_disponible: item.cantidad_disponible,
            costo_promedio: item.costo_promedio,
          })
        } else {
          map.set(key, {
            producto_id: 0,
            producto_nombre: "Variante",
            variante_id: item.variante_id,
            variante_nombre: "",
            unidad_medida: "",
            almacen_id: item.almacen_id,
            almacen_nombre: item.almacen_nombre,
            cantidad_disponible: item.cantidad_disponible,
            costo_promedio: item.costo_promedio,
          })
        }
      })
      return Array.from(map.values())
    })
  }

  const submitEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      if (!entryForm.almacen_id) {
        throw new Error("Selecciona un almacén para registrar el ingreso.")
      }
      if (!entryForm.items.length) {
        throw new Error("Agrega al menos un ítem para registrar el ingreso.")
      }
      const itemsPayload = entryForm.items.map((item, index) => {
        if (!item.variante_id) {
          throw new Error(`Selecciona una variante en la fila ${index + 1}.`)
        }
        if (!item.cantidad || Number(item.cantidad) <= 0) {
          throw new Error(`Ingresa una cantidad válida en la fila ${index + 1}.`)
        }
        return {
          variante_id: item.variante_id,
          cantidad: Number(item.cantidad),
          costo_unitario: item.costo_unitario ? Number(item.costo_unitario) : undefined,
        }
      })
      const payload: InventoryEntryPayload = {
        almacen_id: Number(entryForm.almacen_id),
        descripcion: entryForm.descripcion || undefined,
        items: itemsPayload,
      }
      const result = await inventoryService.registerEntry(payload)
      mergeUpdatedStock(result.updated_stock)
      setFeedback(result.message)
      setEntryForm({
        almacen_id: entryForm.almacen_id,
        descripcion: "",
        items: [emptyEntryItem()],
      })
    } catch (err) {
      console.error("Error registering entry", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el ingreso.")
    } finally {
      setSaving(false)
    }
  }

  const submitTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      if (!transferForm.almacen_origen_id || !transferForm.almacen_destino_id) {
        throw new Error("Selecciona almacén de origen y destino.")
      }
      if (transferForm.almacen_origen_id === transferForm.almacen_destino_id) {
        throw new Error("El almacén de origen y destino deben ser distintos.")
      }
      if (!transferForm.items.length) {
        throw new Error("Agrega al menos un ítem para transferir.")
      }
      const itemsPayload = transferForm.items.map((item, index) => {
        if (!item.variante_id) {
          throw new Error(`Selecciona una variante en la fila ${index + 1}.`)
        }
        if (!item.cantidad || Number(item.cantidad) <= 0) {
          throw new Error(`Ingresa una cantidad válida en la fila ${index + 1}.`)
        }
        return {
          variante_id: item.variante_id,
          cantidad: Number(item.cantidad),
        }
      })
      const payload: InventoryTransferPayload = {
        almacen_origen_id: Number(transferForm.almacen_origen_id),
        almacen_destino_id: Number(transferForm.almacen_destino_id),
        descripcion: transferForm.descripcion || undefined,
        items: itemsPayload,
      }
      const result = await inventoryService.transferStock(payload)
      mergeUpdatedStock(result.updated_stock)
      setFeedback(result.message)
      setTransferForm({
        almacen_origen_id: transferForm.almacen_origen_id,
        almacen_destino_id: transferForm.almacen_destino_id,
        descripcion: "",
        items: [emptyTransferItem()],
      })
    } catch (err) {
      console.error("Error transferring stock", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar la transferencia.")
    } finally {
      setSaving(false)
    }
  }

  const submitAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFeedback(null)
    try {
      if (!adjustForm.items.length) {
        throw new Error("Agrega al menos un ítem para ajustar.")
      }
      const itemsPayload = adjustForm.items.map((item, index) => {
        if (!item.variante_id) {
          throw new Error(`Selecciona una variante en la fila ${index + 1}.`)
        }
        if (!item.almacen_id) {
          throw new Error(`Selecciona un almacén en la fila ${index + 1}.`)
        }
        if (item.cantidad_nueva === "" || Number(item.cantidad_nueva) < 0) {
          throw new Error(`Ingresa una cantidad válida (>=0) en la fila ${index + 1}.`)
        }
        return {
          variante_id: item.variante_id,
          almacen_id: Number(item.almacen_id),
          cantidad_nueva: Number(item.cantidad_nueva),
        }
      })
      const payload: InventoryAdjustmentPayload = {
        descripcion: adjustForm.descripcion || undefined,
        items: itemsPayload,
      }
      const result = await inventoryService.adjustStock(payload)
      mergeUpdatedStock(result.updated_stock)
      setFeedback(result.message)
      setAdjustForm({
        descripcion: "",
        items: [emptyAdjustmentItem()],
      })
    } catch (err) {
      console.error("Error adjusting stock", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el ajuste.")
    } finally {
      setSaving(false)
    }
  }

  const renderStocksTable = () => (
    <motion.div
      key="inventory-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingStocks ? (
        <div className="p-6 text-center text-gray-300">Cargando inventario...</div>
      ) : stocks.length === 0 ? (
        <div className="p-6 text-center text-gray-300">No hay registros de inventario.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Producto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Variante</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Unidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Almacén</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Cantidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Costo Prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stocks.map((item) => (
                <tr key={`${item.variante_id}-${item.almacen_id}`} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {item.producto_nombre}{" "}
                    <span className="text-xs text-gray-400">(ID {item.producto_id})</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {item.variante_nombre ?? "Variante"}{" "}
                    <span className="text-xs text-gray-500">(ID {item.variante_id})</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{item.unidad_medida ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{item.almacen_nombre}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-100">
                    {Number(item.cantidad_disponible).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {item.costo_promedio !== null && item.costo_promedio !== undefined
                      ? Number(item.costo_promedio).toFixed(2)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  const addEntryItem = () => {
    setEntryForm((prev) => ({ ...prev, items: [...prev.items, emptyEntryItem()] }))
  }

  const removeEntryItem = (index: number) => {
    setEntryForm((prev) => {
      if (prev.items.length === 1) {
        return prev
      }
      const items = prev.items.filter((_, itemIndex) => itemIndex !== index)
      return { ...prev, items }
    })
  }

  const addTransferItem = () => {
    setTransferForm((prev) => ({ ...prev, items: [...prev.items, emptyTransferItem()] }))
  }

  const removeTransferItem = (index: number) => {
    setTransferForm((prev) => {
      if (prev.items.length === 1) {
        return prev
      }
      const items = prev.items.filter((_, itemIndex) => itemIndex !== index)
      return { ...prev, items }
    })
  }

  const addAdjustmentItem = () => {
    setAdjustForm((prev) => ({ ...prev, items: [...prev.items, emptyAdjustmentItem()] }))
  }

  const removeAdjustmentItem = (index: number) => {
    setAdjustForm((prev) => {
      if (prev.items.length === 1) {
        return prev
      }
      const items = prev.items.filter((_, itemIndex) => itemIndex !== index)
      return { ...prev, items }
    })
  }

  const renderEntryForm = () => (
    <motion.form
      key="inventory-entry"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submitEntry}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6 text-white"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm md:col-span-1">
          <span className="font-semibold text-gray-200 flex items-center gap-2">
            <Building2 size={16} /> Almacén destino
          </span>
          <select
            value={entryForm.almacen_id}
            onChange={(event) =>
              setEntryForm((prev) => ({ ...prev, almacen_id: event.target.value }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Selecciona un almacén...</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-gray-200">Descripción u observaciones</span>
          <textarea
            value={entryForm.descripcion}
            onChange={(event) =>
              setEntryForm((prev) => ({ ...prev, descripcion: event.target.value }))
            }
            rows={2}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="Ej. Ajuste manual por auditoría mensual"
          />
        </label>
      </div>

      <div className="space-y-4">
        {entryForm.items.map((item, index) => (
          <div
            key={`entry-item-${index}`}
            className="border border-gray-700 rounded-lg p-4 bg-gray-900/60 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-100">Ítem #{index + 1}</span>
              {entryForm.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntryItem(index)}
                  className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-semibold text-gray-200">Variante</span>
                <button
                  type="button"
                  onClick={() => openVariantSelector({ form: "entry", index })}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-left text-sm text-gray-100 hover:border-orange-500 focus:outline-none"
                >
                  {item.variante_label ?? "Selecciona una variante"}
                </button>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-gray-200">Cantidad</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cantidad}
                  onChange={(event) =>
                    setEntryForm((prev) => {
                      const items = [...prev.items]
                      items[index] = { ...items[index], cantidad: event.target.value }
                      return { ...prev, items }
                    })
                  }
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  placeholder="0.00"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-gray-200">Costo unitario (opcional)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.costo_unitario}
                  onChange={(event) =>
                    setEntryForm((prev) => {
                      const items = [...prev.items]
                      items[index] = { ...items[index], costo_unitario: event.target.value }
                      return { ...prev, items }
                    })
                  }
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  placeholder="0.00"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addEntryItem}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
        >
          <Plus size={16} /> Agregar ítem
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadWarehouses()}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Actualizar catálogos
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />} Registrar ingreso
          </button>
        </div>
      </div>
    </motion.form>
  )

  const renderTransferForm = () => (
    <motion.form
      key="inventory-transfer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submitTransfer}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6 text-white"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Almacén origen</span>
          <select
            value={transferForm.almacen_origen_id}
            onChange={(event) =>
              setTransferForm((prev) => ({ ...prev, almacen_origen_id: event.target.value }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Selecciona...</option>
            {warehouses.map((warehouse) => (
              <option key={`warehouse-origen-${warehouse.id}`} value={warehouse.id}>
                {warehouse.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Almacén destino</span>
          <select
            value={transferForm.almacen_destino_id}
            onChange={(event) =>
              setTransferForm((prev) => ({ ...prev, almacen_destino_id: event.target.value }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Selecciona...</option>
            {warehouses.map((warehouse) => (
              <option key={`warehouse-destino-${warehouse.id}`} value={warehouse.id}>
                {warehouse.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Observaciones</span>
          <input
            type="text"
            value={transferForm.descripcion}
            onChange={(event) =>
              setTransferForm((prev) => ({ ...prev, descripcion: event.target.value }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="Ej. Reposición entre sucursales"
          />
        </label>
      </div>

      <div className="space-y-4">
        {transferForm.items.map((item, index) => (
          <div
            key={`transfer-item-${index}`}
            className="border border-gray-700 rounded-lg p-4 bg-gray-900/60 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-100">Ítem #{index + 1}</span>
              {transferForm.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTransferItem(index)}
                  className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-semibold text-gray-200">Variante</span>
                <button
                  type="button"
                  onClick={() => openVariantSelector({ form: "transfer", index })}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-left text-sm text-gray-100 hover:border-orange-500 focus:outline-none"
                >
                  {item.variante_label ?? "Selecciona una variante"}
                </button>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-gray-200">Cantidad a transferir</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cantidad}
                  onChange={(event) =>
                    setTransferForm((prev) => {
                      const items = [...prev.items]
                      items[index] = { ...items[index], cantidad: event.target.value }
                      return { ...prev, items }
                    })
                  }
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  placeholder="0.00"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addTransferItem}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
        >
          <Plus size={16} /> Agregar ítem
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadWarehouses()}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Actualizar catálogos
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft size={16} />} Registrar transferencia
          </button>
        </div>
      </div>
    </motion.form>
  )

  const renderAdjustmentForm = () => (
    <motion.form
      key="inventory-adjustment"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submitAdjustment}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6 text-white"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-gray-200">Descripción</span>
          <input
            type="text"
            value={adjustForm.descripcion}
            onChange={(event) =>
              setAdjustForm((prev) => ({ ...prev, descripcion: event.target.value }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
            placeholder="Ej. Ajuste por conteo físico"
          />
        </label>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Package size={18} className="text-gray-400" /> Ajusta las unidades finales que deben quedar registradas en el almacén.
        </div>
      </div>

      <div className="space-y-4">
        {adjustForm.items.map((item, index) => (
          <div
            key={`adjustment-item-${index}`}
            className="border border-gray-700 rounded-lg p-4 bg-gray-900/60 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-100">Ítem #{index + 1}</span>
              {adjustForm.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAdjustmentItem(index)}
                  className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-semibold text-gray-200">Variante</span>
                <button
                  type="button"
                  onClick={() => openVariantSelector({ form: "adjust", index })}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-left text-sm text-gray-100 hover:border-orange-500 focus:outline-none"
                >
                  {item.variante_label ?? "Selecciona una variante"}
                </button>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-gray-200">Almacén</span>
                <select
                  value={item.almacen_id}
                  onChange={(event) =>
                    setAdjustForm((prev) => {
                      const items = [...prev.items]
                      items[index] = { ...items[index], almacen_id: event.target.value }
                      return { ...prev, items }
                    })
                  }
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Selecciona un almacén...</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-semibold text-gray-200">Cantidad nueva</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cantidad_nueva}
                  onChange={(event) =>
                    setAdjustForm((prev) => {
                      const items = [...prev.items]
                      items[index] = { ...items[index], cantidad_nueva: event.target.value }
                      return { ...prev, items }
                    })
                  }
                  className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  placeholder="0.00"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addAdjustmentItem}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
        >
          <Plus size={16} /> Agregar ítem
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadWarehouses()}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Actualizar catálogos
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />} Registrar ajuste
          </button>
        </div>
      </div>
    </motion.form>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="inventory-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-gray-100 space-y-3"
    >
      <h3 className="text-lg font-semibold">Exportar inventario</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span> en Mac)
        para generar un PDF o impresión del listado actual. Asegúrate de filtrar previamente el stock que necesitas.
      </p>
      <p className="text-sm text-gray-400">El botón del menú ya ejecutó la acción de impresión.</p>
    </motion.div>
  )

  // Renderizar dashboard de inventario
  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    const totalItems = stocks.length
    const totalStock = stocks.reduce((sum, s) => sum + (s.cantidad_total ?? 0), 0)
    const warehousesCount = warehouses.length
    const lowStockItems = stocks.filter(s => (s.cantidad_total ?? 0) < 10 && (s.cantidad_total ?? 0) > 0).length
    const outOfStockItems = stocks.filter(s => (s.cantidad_total ?? 0) === 0).length
    const averageStock = totalItems > 0 ? totalStock / totalItems : 0
    
    // Calcular valor total del inventario (estimado: promedio de precio por unidad)
    const estimatedInventoryValue = totalStock * 50 // Estimación: Bs. 50 por unidad promedio

    // Datos para gráfico de stock por almacén
    const warehouseStockData = useMemo(() => {
      const warehouseMap = new Map<string, number>()
      stocks.forEach(s => {
        const warehouse = s.almacen_nombre || "Sin almacén"
        warehouseMap.set(warehouse, (warehouseMap.get(warehouse) || 0) + (s.cantidad_total ?? 0))
      })
      return Array.from(warehouseMap.entries()).slice(0, 6).map(([name, value]) => ({ name, value }))
    }, [stocks])

    // Datos para gráfico de distribución de stock
    const stockDistributionData = useMemo(() => [
      { name: "Stock Normal", value: totalItems - lowStockItems, color: "#10B981" },
      { name: "Stock Bajo", value: lowStockItems, color: "#F59E0B" },
      { name: "Sin Stock", value: stocks.filter(s => (s.cantidad_total ?? 0) === 0).length, color: "#EF4444" },
    ], [totalItems, lowStockItems, stocks])

    // Datos para gráfico de tendencias mensuales
    const monthlyStockData = useMemo(() => {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
      return months.map((month, index) => ({
        month,
        items: Math.floor(Math.random() * 50) + 100 + (index * 5),
        stock: Math.floor(Math.random() * 5000) + 10000 + (index * 500),
      }))
    }, [])

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock por Almacén */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Stock por Almacén
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalStock}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +5%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de unidades en inventario
              </p>
            </div>
            <ChartContainer
              config={{
                value: { color: PURPLE_COLORS.primary },
              }}
              className="h-[250px]"
            >
              <BarChart data={warehouseStockData}>
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

          {/* Distribución de Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Distribución de Stock
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalItems}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Items
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de items en inventario
              </p>
            </div>
            <ChartContainer
              config={{
                "Stock Normal": { color: "#10B981" },
                "Stock Bajo": { color: "#F59E0B" },
                "Sin Stock": { color: "#EF4444" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={stockDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockDistributionData.map((entry, index) => (
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
            title="Valor Total del Inventario"
            value={new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(estimatedInventoryValue)}
            subtitle="Valor estimado del stock"
            icon={Scale}
            change={{ value: 8.7, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Productos con Stock Bajo"
            value={lowStockItems}
            subtitle="Productos bajo umbral"
            icon={AlertTriangle}
            color="warning"
            delay={0.3}
          />
          <KPICard
            title="Productos sin Stock"
            value={outOfStockItems}
            subtitle="Productos agotados"
            icon={X}
            color="danger"
            delay={0.4}
          />
          <KPICard
            title="Items en Inventario"
            value={totalItems}
            subtitle="Total de items registrados"
            icon={Package}
            change={{ value: 5.2, label: "vs. período anterior" }}
            color="info"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Stock Total"
            value={totalStock.toLocaleString("es-BO")}
            subtitle="Unidades totales"
            icon={Package}
            change={{ value: 8.7, label: "vs. período anterior" }}
            color="success"
            delay={0.6}
          />
          <KPICard
            title="Almacenes Activos"
            value={warehousesCount}
            subtitle="Almacenes registrados"
            icon={Building2}
            color="info"
            delay={0.7}
          />
          <KPICard
            title="Stock Promedio"
            value={Math.round(averageStock).toLocaleString("es-BO")}
            subtitle="Unidades promedio por item"
            icon={TrendingUp}
            color="info"
            delay={0.8}
          />
          <KPICard
            title="Tasa de Disponibilidad"
            value={`${totalItems > 0 ? Math.round(((totalItems - outOfStockItems) / totalItems) * 100) : 0}%`}
            subtitle="Items disponibles vs. total"
            icon={CheckCircle}
            change={{ value: 2.3, label: "vs. período anterior" }}
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
              Tendencias de Inventario
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Items</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Stock</span>
            </div>
          </div>
          <ChartContainer
            config={{
              items: { color: PURPLE_COLORS.primary },
              stock: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyStockData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
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
                yAxisId="left"
                type="monotone" 
                dataKey="items" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="stock" 
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
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    switch (selectedAction) {
      case "stock":
      case "list":
        if (!canViewInventory) {
          return (
            <motion.div
              key="list-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para consultar inventario. Se requiere rol ADMIN, INVENTARIOS o SUPERVISOR.
              </p>
            </motion.div>
          )
        }
        return renderStocksTable()
      case "register":
        if (!canUpdateStock) {
          return (
            <motion.div
              key="register-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para registrar ingresos de inventario. Se requiere rol ADMIN o INVENTARIOS.
              </p>
            </motion.div>
          )
        }
        return renderEntryForm()
      case "transfer":
        if (!canUpdateStock) {
          return (
            <motion.div
              key="transfer-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para realizar transferencias. Se requiere rol ADMIN o INVENTARIOS.
              </p>
            </motion.div>
          )
        }
        return renderTransferForm()
      case "adjustments":
        if (!canUpdateStock) {
          return (
            <motion.div
              key="adjustments-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para realizar ajustes de inventario. Se requiere rol ADMIN o INVENTARIOS.
              </p>
            </motion.div>
          )
        }
        return renderAdjustmentForm()
      case "print":
        if (!canViewInventory) {
          return (
            <motion.div
              key="print-section-denied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <p className="text-sm" style={{ color: "#EF4444" }}>
                No tienes permiso para exportar inventario. Se requiere rol ADMIN, INVENTARIOS o SUPERVISOR.
              </p>
            </motion.div>
          )
        }
        return renderPrintInfo()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Inventario</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona el stock, transferencias y ajustes de inventario
        </p>
      </div>

      {feedback && (
        <div className="border border-green-600 bg-green-600/90 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle size={16} className="text-white" /> {feedback}
        </div>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <AnimatePresence>
        {variantSearch.open && (
          <motion.div
            key="variant-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Buscar variante</h3>
                <button
                  type="button"
                  onClick={closeVariantSelector}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={variantSearch.term}
                  onChange={(event) =>
                    setVariantSearch((prev) => ({ ...prev, term: event.target.value }))
                  }
                  placeholder="Nombre de producto o variante..."
                  className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void handleVariantSearch()}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  {variantSearch.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />} Buscar
                </button>
              </div>
              {variantSearch.error && <p className="mt-2 text-sm text-red-300">{variantSearch.error}</p>}
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {variantSearch.loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin" /> Buscando variantes...
                  </div>
                ) : variantSearch.results.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin resultados por ahora. Intenta con otro término.</p>
                ) : (
                  variantSearch.results.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => applyVariantToForm(variant)}
                      className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-left text-sm text-gray-100 hover:border-red-500"
                    >
                      <p className="font-semibold text-white">{variantLabel(variant)}</p>
                      <p className="text-xs text-gray-400">
                        Stock total: {variant.total_stock.toFixed(2)}
                      </p>
                      {variant.stock_detalle.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {variant.stock_detalle
                            .map(
                              (detail) => `${detail.almacen_nombre}: ${detail.cantidad_disponible.toFixed(2)}`,
                            )
                            .join(" · ")}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

