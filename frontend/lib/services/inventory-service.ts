import { api } from "@/lib/apiClient"

export interface StockSummary {
  producto_id: number
  producto_nombre: string
  variante_id: number
  variante_nombre?: string | null
  unidad_medida?: string | null
  almacen_id: number
  almacen_nombre: string
  cantidad_disponible: number
  costo_promedio?: number | null
}

export interface StockEntry {
  variante_id: number
  almacen_id: number
  almacen_nombre: string
  cantidad_disponible: number
  costo_promedio?: number | null
}

export interface Warehouse {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface VariantStockOverview {
  almacen_id: number
  almacen_nombre: string
  cantidad_disponible: number
}

export interface VariantSearchItem {
  id: number
  producto_id: number
  producto_nombre: string
  variante_nombre?: string | null
  unidad_medida?: string | null
  total_stock: number
  stock_detalle: VariantStockOverview[]
}

export interface InventoryEntryItemPayload {
  variante_id: number
  cantidad: number
  costo_unitario?: number
}

export interface InventoryEntryPayload {
  almacen_id: number
  descripcion?: string
  items: InventoryEntryItemPayload[]
}

export interface InventoryTransferItemPayload {
  variante_id: number
  cantidad: number
}

export interface InventoryTransferPayload {
  almacen_origen_id: number
  almacen_destino_id: number
  descripcion?: string
  items: InventoryTransferItemPayload[]
}

export interface InventoryAdjustmentItemPayload {
  variante_id: number
  almacen_id: number
  cantidad_nueva: number
}

export interface InventoryAdjustmentPayload {
  descripcion?: string
  items: InventoryAdjustmentItemPayload[]
}

export interface InventoryOperationResult {
  message: string
  updated_stock: StockEntry[]
}

export const inventoryService = {
  async listStocks(): Promise<StockSummary[]> {
    return api.get<StockSummary[]>("/inventory/stock")
  },

  async listWarehouses(): Promise<Warehouse[]> {
    return api.get<Warehouse[]>("/inventory/warehouses")
  },

  async searchVariants(query: string): Promise<VariantSearchItem[]> {
    const params = new URLSearchParams({ q: query })
    return api.get<VariantSearchItem[]>(`/inventory/variants/search?${params.toString()}`)
  },

  async registerEntry(payload: InventoryEntryPayload): Promise<InventoryOperationResult> {
    return api.post<InventoryOperationResult>("/inventory/entries", payload)
  },

  async transferStock(payload: InventoryTransferPayload): Promise<InventoryOperationResult> {
    return api.post<InventoryOperationResult>("/inventory/transfers", payload)
  },

  async adjustStock(payload: InventoryAdjustmentPayload): Promise<InventoryOperationResult> {
    return api.post<InventoryOperationResult>("/inventory/adjustments", payload)
  },

  async getStockByVariant(variantId: number): Promise<StockEntry[]> {
    return api.get<StockEntry[]>(`/inventory/stock/${variantId}`)
  },
}
