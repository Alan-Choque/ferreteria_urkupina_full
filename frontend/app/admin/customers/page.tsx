"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  HeartHandshake,
  Loader2,
  MailPlus,
  PhoneIncoming,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Edit2,
  CheckCircle,
  X,
  Search,
  TrendingUp,
  Calendar,
  History,
  ShoppingCart,
  FileText,
  CreditCard,
  Package,
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

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { customersService, type AdminCustomer, type CustomerPayload } from "@/lib/services/customers-service"
import { KPICard } from "@/components/admin/KPICard"

const emptyPayload: CustomerPayload = {
  nombre: "",
  nit_ci: "",
  telefono: "",
  correo: "",
  direccion: "",
}

export default function CustomersPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/customers" || pathname === "/admin/customers/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Estados para crear cliente
  const [createForm, setCreateForm] = useState<CustomerPayload>({ ...emptyPayload })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  
  // Estados para reportes
  const [reportData, setReportData] = useState<any>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<AdminCustomer | null>(null)
  const [editForm, setEditForm] = useState<CustomerPayload>({ ...emptyPayload })

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalCustomers = customers.length
  const customersWithEmail = customers.filter(c => c.correo && c.correo.trim() !== "").length
  const customersWithPhone = customers.filter(c => c.telefono && c.telefono.trim() !== "").length
  const customersWithoutContact = totalCustomers - customersWithEmail - customersWithPhone
  
  // Calcular clientes nuevos en los últimos 30 días
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const newCustomersLast30Days = customers.filter(c => {
    const regDate = new Date(c.fecha_registro)
    return regDate >= thirtyDaysAgo
  }).length
  
  // Calcular clientes activos (con compras en últimos 30 días) - simulado por ahora
  const activeCustomersLast30Days = Math.floor(totalCustomers * 0.35)

  // Datos para gráfico de clientes por mes
  const monthlyCustomersData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      clientes: Math.floor(Math.random() * 30) + 50 + (index * 5),
      nuevos: Math.floor(Math.random() * 10) + 5,
    }))
  }, [])

  // Datos para gráfico de distribución de contacto
  const contactData = useMemo(() => [
    { name: "Con Email", value: customersWithEmail, color: "#10B981" },
    { name: "Con Teléfono", value: customersWithPhone, color: "#8B5CF6" },
    { name: "Sin Contacto", value: totalCustomers - customersWithEmail - customersWithPhone, color: "#EF4444" },
  ], [customersWithEmail, customersWithPhone, totalCustomers])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar clientes",
        description: "Consulta datos de contacto, historial de compras y fecha de registro.",
        status: "disponible",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Registrar cliente",
        description: "Crea un nuevo cliente manualmente.",
        status: "disponible",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        id: "reports",
        label: "Generar reportes",
        description: "Genera reportes de clientes, top clientes y estadísticas.",
        status: "disponible",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        id: "engagement",
        label: "Campañas y fidelización",
        description: "Segmenta clientes para campañas y beneficios.",
        status: "disponible",
        icon: <HeartHandshake className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir listado",
        description: "Genera una versión imprimible o PDF del padrón.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      },
    ],
    [],
  )

  const loadCustomers = async () => {
    setLoadingList(true)
    setError(null)
    try {
      const data = await customersService.listCustomers(searchQuery.trim() || undefined)
      setCustomers(data)
    } catch (err) {
      console.error("Error loading customers", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de clientes.")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [searchQuery])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setFeedback(null)
    setError(null)
    if (actionId === "list") {
      void loadCustomers()
    } else if (actionId === "reports") {
      void loadReport()
    } else if (actionId === "create") {
      setCreateForm({ ...emptyPayload })
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.nombre) {
      setError("El nombre es obligatorio")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await customersService.createCustomer(createForm)
      setFeedback("Cliente creado correctamente")
      setCreateForm({ ...emptyPayload })
      setSelectedAction("list")
      void loadCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el cliente")
    } finally {
      setSaving(false)
    }
  }

  const loadReport = async () => {
    setLoadingReport(true)
    setError(null)
    try {
      const data = await customersService.getCustomersReport()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el reporte")
    } finally {
      setLoadingReport(false)
    }
  }

  const openEditModal = (customer: AdminCustomer) => {
    setEditCustomer(customer)
    setEditForm({
      nombre: customer.nombre,
      nit_ci: customer.nit_ci ?? "",
      telefono: customer.telefono ?? "",
      correo: customer.correo ?? "",
      direccion: customer.direccion ?? "",
    })
    setEditModalOpen(true)
  }

  const router = useRouter()
  const openHistory = (customer: AdminCustomer) => {
    router.push(`/admin/customers/${customer.id}/history`)
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editCustomer) return
    if (!editForm.nombre?.trim()) {
      setError("El nombre del cliente es obligatorio")
      return
    }
    setSaving(true)
    try {
      const updated = await customersService.updateCustomer(editCustomer.id, editForm)
      setCustomers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setFeedback("Cliente actualizado correctamente.")
      setEditModalOpen(false)
    } catch (err) {
      console.error("Error updating customer", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar el cliente.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar este cliente?")) return
    try {
      await customersService.deleteCustomer(id)
      setCustomers((prev) => prev.filter((item) => item.id !== id))
      setFeedback("Cliente eliminado correctamente.")
    } catch (err) {
      console.error("Error deleting customer", err)
      setError(err instanceof Error ? err.message : "No se pudo eliminar el cliente.")
    }
  }

  const renderCustomerList = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <motion.div
        key="customers-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-sm bg-white border overflow-hidden"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        {/* Barra de búsqueda */}
        <div className="p-4 border-b" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              size={18} 
              style={{ color: PURPLE_COLORS.secondary }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </div>
        </div>
        {loadingList ? (
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando clientes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>Aún no se registraron clientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>CI / NIT</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Correo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Dirección</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Registrado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{customer.nombre}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{customer.nit_ci || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{customer.telefono || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: PURPLE_COLORS.primary }}>{customer.correo || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{customer.direccion || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {new Date(customer.fecha_registro).toLocaleDateString("es-BO")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openHistory(customer)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.secondary }}
                          title="Ver historial"
                        >
                          <History size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(customer)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer.id)}
                          className="hover:opacity-80 transition-opacity text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    )
  }

  const renderCreateCustomer = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <motion.form
        key="customer-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateSubmit}
        className="space-y-6 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Registrar nuevo cliente</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Nombre *</span>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(e) => setCreateForm(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>CI / NIT</span>
            <input
              type="text"
              value={createForm.nit_ci ?? ""}
              onChange={(e) => setCreateForm(prev => ({ ...prev, nit_ci: e.target.value }))}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Teléfono</span>
            <input
              type="tel"
              value={createForm.telefono ?? ""}
              onChange={(e) => setCreateForm(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Correo</span>
            <input
              type="email"
              value={createForm.correo ?? ""}
              onChange={(e) => setCreateForm(prev => ({ ...prev, correo: e.target.value }))}
              className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
              style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium" style={{ color: PURPLE_COLORS.dark }}>Dirección</span>
          <textarea
            rows={3}
            value={createForm.direccion ?? ""}
            onChange={(e) => setCreateForm(prev => ({ ...prev, direccion: e.target.value }))}
            className="w-full border rounded-lg py-2 px-3 text-sm bg-white focus:outline-none"
            style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
          />
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: PURPLE_COLORS.accent }}>
          <button
            type="button"
            onClick={() => {
              setCreateForm({ ...emptyPayload })
              setCreateModalOpen(false)
            }}
            className="px-4 py-2 border rounded-lg text-sm transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: WHITE,
              color: PURPLE_COLORS.primary
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !createForm.nombre}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
          >
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus size={16} />}
            Registrar cliente
          </button>
        </div>
      </motion.form>
    )
  }

  const renderReports = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }

    if (loadingReport) {
      return (
        <motion.div
          key="reports-loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 text-center"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <Loader2 className="animate-spin mx-auto" size={32} style={{ color: PURPLE_COLORS.primary }} />
          <p className="mt-4 text-sm" style={{ color: "#6B7280" }}>Cargando reporte...</p>
        </motion.div>
      )
    }

    if (!reportData) {
      return (
        <motion.div
          key="reports-empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto mb-4" style={{ color: PURPLE_COLORS.secondary }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: PURPLE_COLORS.dark }}>Reportes de clientes</h3>
            <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
              Genera reportes detallados sobre tu cartera de clientes
            </p>
            <button
              onClick={loadReport}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: PURPLE_COLORS.primary }}
            >
              Generar Reporte
            </button>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="reports-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: PURPLE_COLORS.dark }}>Resumen General</h3>
            <button
              onClick={loadReport}
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: PURPLE_COLORS.primary }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Total Clientes</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{reportData.summary.total_clientes}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Con Email</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{reportData.summary.clientes_con_email}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Con Teléfono</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{reportData.summary.clientes_con_telefono}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Con Usuario</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{reportData.summary.clientes_con_usuario}</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Nuevos (30 días)</p>
              <p className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{reportData.summary.clientes_nuevos_30_dias}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
            <h4 className="text-md font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Top 10 Clientes por Órdenes</h4>
            <div className="space-y-2">
              {reportData.top_clientes_ordenes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#6B7280" }}>No hay datos disponibles</p>
              ) : (
                reportData.top_clientes_ordenes.map((cliente: any, index: number) => (
                  <div key={cliente.cliente_id} className="flex items-center justify-between p-2 rounded border" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{index + 1}. {cliente.nombre}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{cliente.total_ordenes} órdenes</p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#10B981" }}>
                      {new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(cliente.total_gastado)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: PURPLE_COLORS.accent }}>
            <h4 className="text-md font-semibold mb-4" style={{ color: PURPLE_COLORS.dark }}>Top 10 Clientes por Reservas</h4>
            <div className="space-y-2">
              {reportData.top_clientes_reservas.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#6B7280" }}>No hay datos disponibles</p>
              ) : (
                reportData.top_clientes_reservas.map((cliente: any, index: number) => (
                  <div key={cliente.cliente_id} className="flex items-center justify-between p-2 rounded border" style={{ borderColor: PURPLE_COLORS.accent }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{index + 1}. {cliente.nombre}</p>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: PURPLE_COLORS.primary }}>
                      {cliente.total_reservas} reservas
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }


  const renderEngagementInfo = () => (
    <motion.div
      key="customer-engagement"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Campañas y fidelización</h3>
      <p className="text-sm text-gray-300">
        Próximamente podrás segmentar clientes, generar campañas de correo y seguimiento telefónico, y medir la
        efectividad de cada acción.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Campañas por correo</p>
          <p className="text-xs text-gray-400">Integración futura con Mailer para envíos y tracking.</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MailPlus size={14} /> Plantillas dinámicas con productos destacados.
          </div>
        </div>
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Seguimiento telefónico</p>
          <p className="text-xs text-gray-400">Registro de llamadas, recordatorios y resultados.</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <PhoneIncoming size={14} /> Asigna responsables por zona o segmento.
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="customer-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Imprimir listado de clientes</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para obtener un PDF. Activa la opción "Fondo" en tu
        impresora para mantener los estilos oscuros.
      </p>
      <p className="text-xs text-gray-400">Recomendación: filtra desde la acción "Listado" antes de imprimir para limitar la vista.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="customer-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar la cartera de clientes.
    </motion.div>
  )

  // Renderizar dashboard de clientes
  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clientes por Mes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Crecimiento de Clientes
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalCustomers}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +18%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de clientes registrados
              </p>
            </div>
            <ChartContainer
              config={{
                clientes: { color: PURPLE_COLORS.primary },
                nuevos: { color: "#3B82F6" },
              }}
              className="h-[250px]"
            >
              <BarChart data={monthlyCustomersData}>
                <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "#6B7280", fontSize: 12 }}
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
                <Bar dataKey="clientes" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="nuevos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </motion.div>

          {/* Distribución de Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Distribución de Contacto
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {customersWithEmail + customersWithPhone}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Con contacto
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {((customersWithEmail + customersWithPhone) / totalCustomers * 100).toFixed(1)}% del total
              </p>
            </div>
            <ChartContainer
              config={{
                "Con Email": { color: "#10B981" },
                "Con Teléfono": { color: PURPLE_COLORS.primary },
                "Sin Contacto": { color: "#EF4444" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={contactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contactData.map((entry, index) => (
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
            title="Total de Clientes"
            value={totalCustomers}
            subtitle="Clientes registrados"
            icon={Users}
            change={{ value: 18.2, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Clientes Activos (30 días)"
            value={activeCustomersLast30Days}
            subtitle="Con compras recientes"
            icon={TrendingUp}
            change={{ value: 15.5, label: "vs. período anterior" }}
            color="success"
            delay={0.3}
          />
          <KPICard
            title="Clientes Nuevos (30 días)"
            value={newCustomersLast30Days}
            subtitle="Registrados este mes"
            icon={UserPlus}
            change={{ value: 22.8, label: "vs. período anterior" }}
            color="info"
            delay={0.4}
          />
          <KPICard
            title="Crecimiento de Clientes"
            value={`${totalCustomers > 0 ? Math.round((newCustomersLast30Days / totalCustomers) * 100) : 0}%`}
            subtitle="Tasa de crecimiento mensual"
            icon={TrendingUp}
            color="success"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Clientes con Email"
            value={`${totalCustomers > 0 ? Math.round((customersWithEmail / totalCustomers) * 100) : 0}%`}
            subtitle={`${customersWithEmail} de ${totalCustomers} clientes`}
            icon={MailPlus}
            change={{ value: 12.5, label: "vs. período anterior" }}
            color="success"
            delay={0.6}
          />
          <KPICard
            title="Clientes con Teléfono"
            value={`${totalCustomers > 0 ? Math.round((customersWithPhone / totalCustomers) * 100) : 0}%`}
            subtitle={`${customersWithPhone} de ${totalCustomers} clientes`}
            icon={PhoneIncoming}
            change={{ value: 8.3, label: "vs. período anterior" }}
            color="info"
            delay={0.7}
          />
          <KPICard
            title="Clientes sin Contacto"
            value={customersWithoutContact}
            subtitle="Requieren datos de contacto"
            icon={X}
            color="warning"
            delay={0.8}
          />
          <KPICard
            title="Tasa de Contacto"
            value={`${totalCustomers > 0 ? Math.round(((customersWithEmail + customersWithPhone) / totalCustomers) * 100) : 0}%`}
            subtitle="Clientes con email o teléfono"
            icon={HeartHandshake}
            change={{ value: 5.7, label: "vs. período anterior" }}
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
              Tendencias de Registro
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Total Clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Nuevos</span>
            </div>
          </div>
          <ChartContainer
            config={{
              clientes: { color: PURPLE_COLORS.primary },
              nuevos: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyCustomersData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
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
              <Line 
                type="monotone" 
                dataKey="clientes" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="nuevos" 
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

  const renderActionContent = () => {
    // Si no hay acción seleccionada, mostrar dashboard
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    // Si es "list", mostrar la lista principal
    if (selectedAction === "list") {
      return renderCustomerList()
    }
    
    switch (selectedAction) {
      case "create":
        return renderCreateCustomer()
      case "reports":
        return renderReports()
      case "engagement":
        return renderEngagementInfo()
      case "print":
        return renderPrintInfo()
      default:
        return renderEmptyState()
    }
  }

  const currentAction = actions.find((action) => action.id === selectedAction)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Clientes</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona tu cartera de clientes y su información de contacto
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

      <AnimatePresence mode="wait">{renderActionContent()}</AnimatePresence>

      <AnimatePresence>
        {editModalOpen && editCustomer && (
          <motion.div
            key="edit-customer-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-xl shadow-lg bg-white border p-6"
              style={{ borderColor: "#EDE9FE" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Editar cliente</h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Actualiza los datos de contacto y la información fiscal.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "#6B7280" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-sm">
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>Nombre *</span>
                  <input
                    type="text"
                    value={editForm.nombre ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                    className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>CI / NIT</span>
                  <input
                    type="text"
                    value={editForm.nit_ci ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nit_ci: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="font-semibold" style={{ color: "#6D28D9" }}>Teléfono</span>
                    <input
                      type="tel"
                      value={editForm.telefono ?? ""}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, telefono: event.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                      style={{ 
                        borderColor: "#EDE9FE",
                        color: "#1F2937"
                      }}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="font-semibold" style={{ color: "#6D28D9" }}>Correo</span>
                    <input
                      type="email"
                      value={editForm.correo ?? ""}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, correo: event.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                      style={{ 
                        borderColor: "#EDE9FE",
                        color: "#1F2937"
                      }}
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>Dirección</span>
                  <textarea
                    rows={3}
                    value={editForm.direccion ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, direccion: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  />
                </label>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                    style={{ 
                      borderColor: "#EDE9FE",
                      backgroundColor: "#FFFFFF",
                      color: "#8B5CF6"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                    style={{ backgroundColor: "#8B5CF6" }}
                    onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = "#6D28D9")}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#8B5CF6"}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
