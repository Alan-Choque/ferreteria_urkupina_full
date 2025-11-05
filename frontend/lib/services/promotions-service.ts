import type { Coupon, ID } from "@/lib/contracts"

let coupons: Coupon[] = [
  {
    id: "coup-1",
    code: "BIENVENIDO10",
    type: "PERCENT",
    value: 10,
    minTotal: 100000,
    enabled: true,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "coup-2",
    code: "ENVIOGRATIS",
    type: "FIXED",
    value: 50000,
    minTotal: 200000,
    enabled: true,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

let nextId = 3

export const promotionsService = {
  async listCoupons() {
    await new Promise((r) => setTimeout(r, 300))
    return coupons
  },

  async getCoupon(code: string) {
    await new Promise((r) => setTimeout(r, 200))
    return coupons.find((c) => c.code === code && c.enabled)
  },

  async createCoupon(data: Omit<Coupon, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newCoupon: Coupon = {
      ...data,
      id: `coup-${nextId++}`,
    }
    coupons.push(newCoupon)
    return newCoupon
  },

  async updateCoupon(id: ID, data: Partial<Coupon>) {
    await new Promise((r) => setTimeout(r, 400))
    const coupon = coupons.find((c) => c.id === id)
    if (!coupon) throw new Error("Cupón no encontrado")
    Object.assign(coupon, data)
    return coupon
  },

  async deleteCoupon(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    coupons = coupons.filter((c) => c.id !== id)
  },
}
