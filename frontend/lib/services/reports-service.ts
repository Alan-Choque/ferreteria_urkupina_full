import { api } from "@/lib/apiClient"

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
}

