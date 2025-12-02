import { api } from "@/lib/apiClient"
import { mockReportsSummary, isMockDataEnabled } from "@/lib/mock-data"

export type ReportsSummary = {
  summary: {
    sales_last_30_days: number
    pending_orders: number
    low_stock_products: number
    active_customers_last_30_days: number
  }
  category_breakdown: Array<{
    category: string
    total: number
    percentage: number
  }>
  top_products: Array<{
    product: string
    total: number
  }>
}

export const reportsService = {
  async getSummary(params?: { startDate?: string; endDate?: string }): Promise<ReportsSummary> {
    // Si los datos mock están habilitados, devolver datos de prueba
    if (isMockDataEnabled()) {
      // Simular un pequeño delay para que parezca real
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockReportsSummary
    }
    
    const query = new URLSearchParams()
    if (params?.startDate) {
      query.append("start_date", params.startDate)
    }
    if (params?.endDate) {
      query.append("end_date", params.endDate)
    }
    const search = query.toString()
    const url = search ? `/reports/summary?${search}` : "/reports/summary"
    return api.get<ReportsSummary>(url, { requireAuth: true })
  },

  async getFinancialReport(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams()
    if (params?.startDate) query.append("start_date", params.startDate)
    if (params?.endDate) query.append("end_date", params.endDate)
    const search = query.toString()
    const url = search ? `/reports/financial?${search}` : "/reports/financial"
    return api.get(url, { requireAuth: true })
  },

  async getStockReport() {
    return api.get("/reports/stock", { requireAuth: true })
  },

  async getSalesReport(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams()
    if (params?.startDate) query.append("start_date", params.startDate)
    if (params?.endDate) query.append("end_date", params.endDate)
    const search = query.toString()
    const url = search ? `/reports/sales?${search}` : "/reports/sales"
    return api.get(url, { requireAuth: true })
  },

  async getPurchasesReport(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams()
    if (params?.startDate) query.append("start_date", params.startDate)
    if (params?.endDate) query.append("end_date", params.endDate)
    const search = query.toString()
    const url = search ? `/reports/purchases?${search}` : "/reports/purchases"
    return api.get(url, { requireAuth: true })
  },

  async getCustomersReport(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams()
    if (params?.startDate) query.append("start_date", params.startDate)
    if (params?.endDate) query.append("end_date", params.endDate)
    const search = query.toString()
    const url = search ? `/reports/customers?${search}` : "/reports/customers"
    return api.get(url, { requireAuth: true })
  },

  async getAlerts() {
    return api.get("/reports/alerts", { requireAuth: true })
  },
}

