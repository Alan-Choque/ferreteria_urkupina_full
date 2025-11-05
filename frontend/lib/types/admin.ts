// Admin types and interfaces for all modules
export type UserRole = "admin" | "manager" | "staff"

export interface Permission {
  module: string
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: UserRole
  branch?: string
  active: boolean
  createdAt: Date
}

export interface Role {
  id: number
  name: string
  permissions: Permission[]
  createdAt: Date
}

export interface Product {
  id: number
  sku: string
  name: string
  slug: string
  brand: string
  category: string
  description: string
  price: number
  tax: number
  status: "active" | "inactive" | "discontinued"
  variants: Variant[]
  images: string[]
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
}

export interface Variant {
  id: number
  productId: number
  sku: string
  attributes: Record<string, string>
  barcode?: string
  stock: number
  price: number
}

export interface InventoryMovement {
  id: number
  type: "entry" | "exit" | "adjust"
  variantId: number
  qty: number
  reason: string
  warehouse: string
  date: Date
}

export interface PurchaseOrder {
  id: number
  poNumber: string
  supplierId: number
  status: "draft" | "sent" | "received" | "partial" | "canceled"
  items: POItem[]
  expectedDate: Date
  totalAmount: number
  createdAt: Date
}

export interface POItem {
  id: number
  productId: number
  qty: number
  price: number
  received?: number
}

export interface Supplier {
  id: number
  name: string
  contact: string
  phone: string
  email: string
  paymentTerms: string
  rating: number
  notes?: string
  products: number[]
  createdAt: Date
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  ci?: string
  nit?: string
  passport?: string
  addresses: Address[]
  createdAt: Date
}

export interface Address {
  id: number
  customerId: number
  street: string
  city: string
  department: string
  zip?: string
  isDefault: boolean
}

export interface SalesOrder {
  id: number
  orderNumber: string
  customerId: number
  status: "pending" | "paid" | "shipped" | "delivered" | "canceled"
  items: OrderItem[]
  total: number
  shippingMethod: "delivery" | "pickup"
  shippingCost: number
  createdAt: Date
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  variantId: number
  qty: number
  price: number
}

export interface Coupon {
  id: number
  code: string
  type: "percentage" | "fixed"
  value: number
  minTotal?: number
  validFrom: Date
  validTo: Date
  usageLimit?: number
  usageCount: number
  enabled: boolean
  createdAt: Date
}

export interface Campaign {
  id: number
  name: string
  description?: string
  categories: string[]
  brands: string[]
  stores: string[]
  discountPercentage: number
  validFrom: Date
  validTo: Date
  enabled: boolean
}

export interface Reservation {
  id: number
  reservationNumber: string
  customerId: number
  productId: number
  variantId: number
  qty: number
  store: string
  depositAmount: number
  status: "pending" | "confirmed" | "canceled"
  createdAt: Date
}

export interface Branch {
  id: number
  name: string
  address: string
  phone: string
  email: string
  manager?: string
}

export interface CompanySettings {
  name: string
  address: string
  nit: string
  branches: Branch[]
  taxRate: number
  numberingSequence: {
    po: number
    so: number
    reservation: number
  }
}
