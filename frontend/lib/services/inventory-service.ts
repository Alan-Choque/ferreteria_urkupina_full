// frontend/lib/services/inventory-service.ts
import { fetchJSON } from "@/lib/api"

export interface StockByWarehouse {
  warehouse_id: number
  qty: number
}

export const inventoryService = {
  async getStockByVariant(variantId: number): Promise<StockByWarehouse[]> {
    return fetchJSON(`/api/v1/inventory/stock/${variantId}`)
  },
}
