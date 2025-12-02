// Datos de prueba para desarrollo y demostración
// Estos datos se pueden activar/desactivar desde Configuración

import type { SalesOrder } from "@/lib/contracts"
import type { ReportsSummary } from "@/lib/services/reports-service"
import type { AdminUser } from "@/lib/types/admin"
import type { AdminCustomer } from "@/lib/services/customers-service"

// Ajustar fechas para que sean strings ISO
const now = new Date()
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
import type { ProductListItem } from "@/lib/services/products-service"

// Generar fechas aleatorias en los últimos 30 días
function randomDate(daysAgo: number = 30): Date {
  const now = new Date()
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime())
  return new Date(randomTime)
}

// MOCK: Ventas
export const mockSalesOrders: SalesOrder[] = [
  {
    id: "1",
    customerId: "1",
    status: "PAGADO",
    totals: { sub: 1100.00, discount: 0, shipping: 0, total: 1250.50, currency: "BOB" },
    shippingMethod: "RETIRO_TIENDA",
    createdAt: randomDate(5).toISOString(),
    items: [
      { id: "1", variantId: "1", sku: "MART-001", name: "Martillo", price: 45.00, qty: 2 },
      { id: "2", variantId: "2", sku: "CLAV-001", name: "Clavos", price: 12.00, qty: 5 },
    ],
  },
  {
    id: "2",
    customerId: "2",
    status: "PENDIENTE",
    totals: { sub: 750.00, discount: 0, shipping: 0, total: 850.00, currency: "BOB" },
    shippingMethod: "RETIRO_TIENDA",
    createdAt: randomDate(3).toISOString(),
    items: [
      { id: "3", variantId: "3", sku: "DEST-001", name: "Destornillador", price: 25.00, qty: 3 },
    ],
  },
  {
    id: "3",
    customerId: "3",
    status: "ENTREGADO",
    totals: { sub: 1900.00, discount: 0, shipping: 0, total: 2100.75, currency: "BOB" },
    shippingMethod: "DOMICILIO",
    createdAt: randomDate(10).toISOString(),
    items: [
      { id: "4", variantId: "4", sku: "SERR-001", name: "Serrucho", price: 85.00, qty: 1 },
      { id: "5", variantId: "5", sku: "TALAD-001", name: "Taladro", price: 350.00, qty: 1 },
    ],
  },
  {
    id: "4",
    customerId: "1",
    status: "ENVIADO",
    totals: { sub: 400.00, discount: 0, shipping: 0, total: 450.00, currency: "BOB" },
    shippingMethod: "RETIRO_TIENDA",
    createdAt: randomDate(1).toISOString(),
    items: [
      { id: "6", variantId: "6", sku: "PINT-001", name: "Pintura", price: 125.00, qty: 2 },
    ],
  },
  {
    id: "5",
    customerId: "4",
    status: "PAGADO",
    totals: { sub: 3000.00, discount: 0, shipping: 0, total: 3200.00, currency: "BOB" },
    shippingMethod: "DOMICILIO",
    createdAt: randomDate(7).toISOString(),
    items: [
      { id: "7", variantId: "7", sku: "BROCH-001", name: "Brocha", price: 15.00, qty: 10 },
      { id: "8", variantId: "8", sku: "RODILL-001", name: "Rodillo", price: 45.00, qty: 5 },
    ],
  },
]

// MOCK: Resumen de reportes
export const mockReportsSummary: ReportsSummary = {
  summary: {
    sales_last_30_days: 157230.50,
    pending_orders: 12,
    low_stock_products: 8,
    active_customers_last_30_days: 45,
  },
  category_breakdown: [
    { category: "Herramientas", total: 45230.50, percentage: 28.8 },
    { category: "Materiales", total: 38900.00, percentage: 24.8 },
    { category: "Pinturas", total: 28100.00, percentage: 17.9 },
    { category: "Electricidad", total: 25000.00, percentage: 15.9 },
    { category: "Plomería", total: 20000.00, percentage: 12.7 },
  ],
  top_products: [
    { product: "Martillo Profesional", total: 12500.00 },
    { product: "Taladro Inalámbrico", total: 9800.00 },
    { product: "Pintura Acrílica", total: 7500.00 },
    { product: "Destornillador Set", total: 6200.00 },
    { product: "Cable Eléctrico", total: 5800.00 },
  ],
}

// MOCK: Usuarios
export const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: "admin.root",
    email: "admin@ferreteria.com",
    role: "ADMIN",
    active: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    name: "victor",
    email: "victor@gmail.com",
    role: "ADMIN",
    active: true,
    createdAt: new Date("2024-02-20"),
  },
  {
    id: 3,
    name: "jose",
    email: "jose@gmail.com",
    role: "INVENTARIOS",
    active: true,
    createdAt: new Date("2024-03-10"),
  },
  {
    id: 4,
    name: "María Vendedora",
    email: "maria@ferreteria.com",
    role: "VENTAS",
    active: true,
    createdAt: new Date("2024-04-05"),
  },
  {
    id: 5,
    name: "Carlos Supervisor",
    email: "carlos@ferreteria.com",
    role: "SUPERVISOR",
    active: true,
    createdAt: new Date("2024-05-12"),
  },
]

// MOCK: Clientes
export const mockCustomers: AdminCustomer[] = [
  {
    id: 1,
    nombre: "Juan Pérez",
    correo: "juan.perez@email.com",
    telefono: "70123456",
    direccion: "Av. Principal #123",
    nit_ci: "12345678",
    fecha_registro: randomDate(60).toISOString(),
  },
  {
    id: 2,
    nombre: "María González",
    correo: "maria.gonzalez@email.com",
    telefono: "70234567",
    direccion: "Calle Comercio #456",
    nit_ci: "23456789",
    fecha_registro: randomDate(45).toISOString(),
  },
  {
    id: 3,
    nombre: "Carlos Rodríguez",
    correo: "carlos.rodriguez@email.com",
    telefono: "70345678",
    direccion: "Av. Libertad #789",
    nit_ci: "34567890",
    fecha_registro: randomDate(30).toISOString(),
  },
  {
    id: 4,
    nombre: "Ana Martínez",
    correo: "ana.martinez@email.com",
    telefono: "70456789",
    direccion: "Calle Bolívar #321",
    nit_ci: "45678901",
    fecha_registro: randomDate(15).toISOString(),
  },
]

// MOCK: Productos
export const mockProducts: ProductListItem[] = [
  {
    id: 1,
    nombre: "Martillo Profesional",
    sku: "MART-001",
    precio: 45.00,
    stock: 25,
    categoria: "Herramientas",
    estado: "ACTIVE",
    imagen_url: null,
  },
  {
    id: 2,
    nombre: "Taladro Inalámbrico",
    sku: "TALAD-001",
    precio: 350.00,
    stock: 8,
    categoria: "Herramientas",
    estado: "ACTIVE",
    imagen_url: null,
  },
  {
    id: 3,
    nombre: "Pintura Acrílica",
    sku: "PINT-001",
    precio: 125.00,
    stock: 45,
    categoria: "Pinturas",
    estado: "ACTIVE",
    imagen_url: null,
  },
  {
    id: 4,
    nombre: "Destornillador Set",
    sku: "DEST-001",
    precio: 25.00,
    stock: 12,
    categoria: "Herramientas",
    estado: "ACTIVE",
    imagen_url: null,
  },
  {
    id: 5,
    nombre: "Cable Eléctrico",
    sku: "CABLE-001",
    precio: 20.00,
    stock: 3,
    categoria: "Electricidad",
    estado: "ACTIVE",
    imagen_url: null,
  },
]

// Función helper para verificar si los datos mock están habilitados
export function isMockDataEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin-mock-data-enabled') === 'true'
}

