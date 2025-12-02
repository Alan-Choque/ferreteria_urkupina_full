import { api } from "@/lib/apiClient"
import type { Coupon } from "@/lib/types/admin"

type PromotionRule = {
  id?: number
  tipo_regla: string
  valor: number
  descripcion?: string | null
}

type PromotionResponse = {
  id: number
  nombre: string
  descripcion?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  activo: boolean
  reglas: PromotionRule[]
}

type PromotionListResponse = {
  items: PromotionResponse[]
  total: number
  page: number
  page_size: number
}

export type CouponPayload = {
  code: string
  type: "percentage" | "fixed"
  value: number
  description?: string
  validFrom?: string | Date | null
  validTo?: string | Date | null
  enabled?: boolean
}

const DEFAULT_PAGE_SIZE = 200

function parseDate(value?: string | Date | null): string | null {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function toCoupon(promotion: PromotionResponse): Coupon {
  const firstRule = promotion.reglas[0]
  const isPercentage = firstRule?.tipo_regla === "PORCENTAJE"
  const value = firstRule ? Number(firstRule.valor) : 0

  const validFromIso = promotion.fecha_inicio || new Date().toISOString()
  const validToIso = promotion.fecha_fin || promotion.fecha_inicio || new Date().toISOString()

  return {
    id: promotion.id,
    code: promotion.nombre,
    type: isPercentage ? "percentage" : "fixed",
    value,
    minTotal: undefined,
    enabled: promotion.activo,
    validFrom: new Date(validFromIso),
    validTo: new Date(validToIso),
    usageLimit: undefined,
    usageCount: 0,
    createdAt: new Date(validFromIso),
  }
}

function toPromotionRequest(payload: CouponPayload) {
  const fechaInicio = parseDate(payload.validFrom) ?? new Date().toISOString()
  const fechaFin = parseDate(payload.validTo)
  const tipo_regla = payload.type === "percentage" ? "PORCENTAJE" : "MONTO"

  return {
    nombre: payload.code.trim(),
    descripcion: payload.description?.trim() || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    activo: payload.enabled ?? true,
    reglas: [
      {
        tipo_regla,
        valor: payload.value,
        descripcion: payload.description?.trim() || null,
      },
    ],
  }
}

export const promotionsService = {
  async listCoupons(active?: boolean, search?: string): Promise<Coupon[]> {
    const params = new URLSearchParams()
    params.append("page_size", String(DEFAULT_PAGE_SIZE))
    if (typeof active === "boolean") {
      params.append("active", String(active))
    }
    if (search) params.append("q", search)
    const response = await api.get<PromotionListResponse>(`/promotions?${params.toString()}`, {
      requireAuth: true,
    })
    return response.items.map(toCoupon)
  },

  async getCoupon(code: string): Promise<Coupon | undefined> {
    const coupons = await this.listCoupons()
    return coupons.find((coupon) => coupon.code === code)
  },

  async createCoupon(payload: CouponPayload): Promise<Coupon> {
    const body = toPromotionRequest(payload)
    const response = await api.post<PromotionResponse>("/promotions", body, { requireAuth: true })
    return toCoupon(response)
  },

  async updateCoupon(id: number, payload: CouponPayload): Promise<Coupon> {
    const body = toPromotionRequest(payload)
    const response = await api.put<PromotionResponse>(`/promotions/${id}`, body, { requireAuth: true })
    return toCoupon(response)
  },

  async deleteCoupon(id: number): Promise<void> {
    await api.delete(`/promotions/${id}`, { requireAuth: true })
  },
}

