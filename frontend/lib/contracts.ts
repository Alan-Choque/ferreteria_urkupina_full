// All field names and enums match exactly what the backend API will provide

export type DocumentType = "CI" | "NIT" | "PASSPORT"
export type OrderStatus = "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO"
export type ReservationStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA"
export type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA"
export type ProductStatus = "ACTIVE" | "INACTIVE"
export type PromotionType = "PERCENT" | "FIXED"
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED"

export type ID = string
export type Money = number

export type Address = {
  id: ID
  label?: string
  line1: string
  line2?: string
  city: string
  department: string
  postalCode?: string
}

export type Branch = {
  id: ID
  name: string
  city: string
  address: string
}

export type Warehouse = {
  id: ID
  name: string
  branchId: ID
}

export type Category = {
  id: ID
  name: string
  parentId?: ID
}

export type Brand = {
  id: ID
  name: string
}

export type Product = {
  id: ID
  sku: string
  name: string
  slug: string
  brandId: ID
  categoryId: ID
  description?: string
  status: ProductStatus
  taxRate?: number
}

export type ProductVariant = {
  id: ID
  productId: ID
  sku: string
  attributes: Record<string, string>
  barcode?: string
  price: Money
}

export type Stock = {
  id: ID
  variantId: ID
  warehouseId: ID
  qty: number
  minQty?: number
  maxQty?: number
}

export type StockMovement = {
  id: ID
  variantId: ID
  type: MovementType
  qty: number
  warehouseFromId?: ID
  warehouseToId?: ID
  reason?: string
  createdAt: string
}

export type Supplier = {
  id: ID
  name: string
  contact?: string
  phone?: string
  email?: string
  terms?: string
  rating?: number
}

export type PurchaseOrderItem = {
  id: ID
  variantId: ID
  qty: number
  price: Money
}

export type PurchaseOrder = {
  id: ID
  supplierId: ID
  status: "DRAFT" | "SENT" | "RECEIVED" | "PARTIAL" | "CANCELED"
  expectedDate?: string
  total: Money
  items: PurchaseOrderItem[]
  createdAt: string
}

export type Customer = {
  id: ID
  type: "PERSON" | "COMPANY"
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  documentType?: DocumentType
  documentNumber?: string
  addresses: Address[]
}

export type User = {
  id: ID
  email: string
  firstName?: string
  lastName?: string
  role: "admin" | "manager" | "staff"
  branchId?: ID
  active: boolean
}

export type SalesOrderItem = {
  id: ID
  variantId: ID
  sku: string
  name: string
  price: Money
  qty: number
  image?: string
}

export type SalesOrder = {
  id: ID
  customerId?: ID | string
  status: OrderStatus
  items: SalesOrderItem[]
  totals: {
    sub: Money
    discount: Money
    shipping: Money
    total: Money
    currency: "BOB"
  }
  shippingMethod: "DOMICILIO" | "RETIRO_TIENDA"
  pickupStoreId?: ID
  shippingAddressId?: ID
  createdAt: string
}

export type Payment = {
  id: ID
  salesOrderId: ID
  method: "CARD" | "QR" | "CASH"
  amount: Money
  status: PaymentStatus
}

export type Coupon = {
  id: ID
  code: string
  type: PromotionType
  value: number
  minTotal?: Money
  enabled: boolean
  validFrom?: string
  validTo?: string
}

export type Reservation = {
  id: ID
  customerId?: ID
  productId: ID
  variantId: ID
  qty: number
  storeId: ID
  deposit: Money
  status: ReservationStatus
  createdAt: string
}

export type FileType = "image" | "pdf" | "doc" | "sheet" | "video" | "other"
export type FileMeta = {
  id: ID
  name: string
  type: FileType
  mime: string
  size: number
  width?: number
  height?: number
  tags: string[]
  publicUrl: string
  createdAt: string
  usedIn?: Array<{ module: string; refId: string }>
}
