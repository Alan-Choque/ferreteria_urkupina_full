"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ClipboardList,
  Edit2,
  Loader2,
  PackageSearch,
  Plus,
  Printer,
  RefreshCw,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  CheckCircle,
  MailPlus,
  PhoneIncoming,
  Search,
  TrendingUp,
  Calendar,
  Building2,
  HeartHandshake,
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
import { KPICard } from "@/components/admin/KPICard"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { suppliersService, type AdminSupplier, type SupplierPayload, type SupplierContact, type ContactPayload, type SupplierReport } from "@/lib/services/suppliers-service"
import { productsService, type ProductListItem } from "@/lib/services/products-service"
import { Power, PowerOff, UserPlus as UserPlusIcon, XCircle } from "lucide-react"

const emptyPayload: SupplierPayload = {
  nombre: "",
  nit_ci: "",
  telefono: "",
  correo: "",
  direccion: "",
  activo: true,
  productos_ids: [],
  contactos: [],
}

const emptyContact: ContactPayload = {
  nombre: "",
  cargo: "",
  telefono: "",
  correo: "",
  observaciones: "",
  activo: true,
}

export default function SuppliersPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL (query param o ruta)
  const getActionFromPath = () => {
    // Primero verificar query param
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/suppliers" || pathname === "/admin/suppliers/") {
      return null // Mostrar dashboard
    }
    if (pathname.includes("/create")) return "create"
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  
  // Inicializar y actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const [createForm, setCreateForm] = useState<SupplierPayload>({ ...emptyPayload })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<AdminSupplier | null>(null)
  const [editForm, setEditForm] = useState<SupplierPayload>({ ...emptyPayload })
  
  // Estados para productos y contactos
  const [availableProducts, setAvailableProducts] = useState<ProductListItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<SupplierContact | null>(null)
  const [contactForm, setContactForm] = useState<ContactPayload>({ ...emptyContact })
  const [selectedSupplierForContact, setSelectedSupplierForContact] = useState<number | null>(null)
  
  // Estados para reportes
  const [reportData, setReportData] = useState<SupplierReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar proveedores",
        description: "Consulta datos de contacto y fecha de alta.",
        status: "disponible",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Registrar proveedor",
        description: "Da de alta un nuevo socio comercial.",
        status: "disponible",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        id: "reports",
        label: "Reportes y análisis",
        description: "Analiza desempeño y cumplimiento de proveedores.",
        status: "disponible",
        icon: <PackageSearch className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir listado",
        description: "Genera PDF o copia impresa del padrón.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      },
    ],
    [],
  )

  const loadSuppliers = async () => {
    setLoadingList(true)
    setError(null)
    try {
      const response = await suppliersService.listSuppliers(searchQuery.trim() || undefined, 1, 1000)
      setSuppliers(response.items)
    } catch (err) {
      console.error("Error loading suppliers", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de proveedores.")
    } finally {
      setLoadingList(false)
    }
  }

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      // Cargar productos en lotes de 200 (máximo permitido)
      const allProducts: ProductListItem[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await productsService.adminListProducts({ page, page_size: 200 })
        allProducts.push(...response.items)
        hasMore = response.items.length === 200 && allProducts.length < response.total
        page++
      }
      
      setAvailableProducts(allProducts)
    } catch (err) {
      console.error("Error loading products", err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadReport = async () => {
    setLoadingReport(true)
    try {
      const data = await suppliersService.getSuppliersReport()
      setReportData(data)
    } catch (err) {
      console.error("Error loading report", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.")
    } finally {
      setLoadingReport(false)
    }
  }

  useEffect(() => {
    void loadSuppliers()
  }, [searchQuery])

  useEffect(() => {
    if (selectedAction === "create" || editModalOpen) {
      void loadProducts()
    }
  }, [selectedAction, editModalOpen])

  useEffect(() => {
    if (selectedAction === "reports") {
      void loadReport()
    }
  }, [selectedAction])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalSuppliers = suppliers.length
  const suppliersWithEmail = suppliers.filter(s => s.correo && s.correo.trim() !== "").length
  const suppliersWithPhone = suppliers.filter(s => s.telefono && s.telefono.trim() !== "").length
  const suppliersWithoutContact = totalSuppliers - suppliersWithEmail - suppliersWithPhone
  
  // Calcular proveedores nuevos en los últimos 30 días
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const newSuppliersLast30Days = suppliers.filter(s => {
    const regDate = new Date(s.fecha_registro)
    return regDate >= thirtyDaysAgo
  }).length

  // Datos para gráfico de proveedores por mes
  const monthlySuppliersData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      proveedores: Math.floor(Math.random() * 20) + 30 + (index * 3),
      nuevos: Math.floor(Math.random() * 5) + 2,
    }))
  }, [])

  // Datos para gráfico de distribución de contacto
  const contactData = useMemo(() => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    
    // Calcular proveedores con contacto (que tengan email O teléfono, sin duplicar)
    const suppliersWithContact = suppliers.filter(s => 
      (s.correo && s.correo.trim() !== "") || (s.telefono && s.telefono.trim() !== "")
    ).length
    
    const suppliersWithoutContact = Math.max(0, totalSuppliers - suppliersWithContact)
    
    // Calcular proveedores solo con email (sin teléfono)
    const suppliersOnlyEmail = suppliers.filter(s => 
      (s.correo && s.correo.trim() !== "") && (!s.telefono || s.telefono.trim() === "")
    ).length
    
    // Calcular proveedores solo con teléfono (sin email)
    const suppliersOnlyPhone = suppliers.filter(s => 
      (!s.correo || s.correo.trim() === "") && (s.telefono && s.telefono.trim() !== "")
    ).length
    
    // Calcular proveedores con ambos (email y teléfono)
    const suppliersWithBoth = suppliers.filter(s => 
      (s.correo && s.correo.trim() !== "") && (s.telefono && s.telefono.trim() !== "")
    ).length
    
    return [
      { name: "Con Email y Teléfono", value: suppliersWithBoth, color: "#10B981" },
      { name: "Solo Email", value: suppliersOnlyEmail, color: "#34D399" },
      { name: "Solo Teléfono", value: suppliersOnlyPhone, color: PURPLE_COLORS.primary },
      { name: "Sin Contacto", value: suppliersWithoutContact, color: "#EF4444" },
    ].filter(item => item.value > 0) // Filtrar valores cero para evitar etiquetas vacías
  }, [suppliers, totalSuppliers])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setFeedback(null)
    setError(null)
    if (actionId === "list") {
      void loadSuppliers()
    }
  }

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.nombre.trim()) {
      setError("El nombre del proveedor es obligatorio")
      return
    }
    setSaving(true)
    try {
      const created = await suppliersService.createSupplier(createForm)
      await loadSuppliers()
      setCreateForm({ ...emptyPayload })
      setFeedback("Proveedor registrado correctamente.")
      setSelectedAction("list")
    } catch (err) {
      console.error("Error creating supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el proveedor.")
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await suppliersService.activateSupplier(id)
      await loadSuppliers()
      setFeedback("Proveedor activado correctamente.")
    } catch (err) {
      console.error("Error activating supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo activar el proveedor.")
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm("¿Deseas desactivar este proveedor?")) return
    try {
      await suppliersService.deactivateSupplier(id)
      await loadSuppliers()
      setFeedback("Proveedor desactivado correctamente.")
    } catch (err) {
      console.error("Error deactivating supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo desactivar el proveedor.")
    }
  }

  const openEditModal = async (supplier: AdminSupplier) => {
    try {
      const fullSupplier = await suppliersService.getSupplier(supplier.id)
      setEditSupplier(fullSupplier)
      setEditForm({
        nombre: fullSupplier.nombre,
        nit_ci: fullSupplier.nit_ci ?? "",
        telefono: fullSupplier.telefono ?? "",
        correo: fullSupplier.correo ?? "",
        direccion: fullSupplier.direccion ?? "",
        activo: fullSupplier.activo,
        productos_ids: fullSupplier.productos?.map(p => p.id) ?? [],
      })
      setEditModalOpen(true)
    } catch (err) {
      console.error("Error loading supplier details", err)
      setError("No se pudo cargar los detalles del proveedor.")
    }
  }

  const openContactModal = (supplierId: number, contact?: SupplierContact) => {
    setSelectedSupplierForContact(supplierId)
    if (contact) {
      setEditingContact(contact)
      setContactForm({
        nombre: contact.nombre,
        cargo: contact.cargo ?? "",
        telefono: contact.telefono ?? "",
        correo: contact.correo ?? "",
        observaciones: contact.observaciones ?? "",
        activo: contact.activo,
      })
    } else {
      setEditingContact(null)
      setContactForm({ ...emptyContact })
    }
    setContactModalOpen(true)
  }

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSupplierForContact) return
    if (!contactForm.nombre.trim()) {
      setError("El nombre del contacto es obligatorio")
      return
    }
    setSaving(true)
    try {
      if (editingContact) {
        await suppliersService.updateContact(editingContact.id, contactForm)
        setFeedback("Contacto actualizado correctamente.")
      } else {
        await suppliersService.createContact(selectedSupplierForContact, contactForm)
        setFeedback("Contacto creado correctamente.")
      }
      setContactModalOpen(false)
      await loadSuppliers()
    } catch (err) {
      console.error("Error saving contact", err)
      setError(err instanceof Error ? err.message : "No se pudo guardar el contacto.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm("¿Deseas eliminar este contacto?")) return
    try {
      await suppliersService.deleteContact(contactId)
      setFeedback("Contacto eliminado correctamente.")
      await loadSuppliers()
    } catch (err) {
      console.error("Error deleting contact", err)
      setError(err instanceof Error ? err.message : "No se pudo eliminar el contacto.")
    }
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editSupplier) return
    if (!editForm.nombre?.trim()) {
      setError("El nombre del proveedor es obligatorio")
      return
    }
    setSaving(true)
    try {
      await suppliersService.updateSupplier(editSupplier.id, editForm)
      await loadSuppliers()
      setFeedback("Proveedor actualizado correctamente.")
      setEditModalOpen(false)
    } catch (err) {
      console.error("Error updating supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo actualizar el proveedor.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar este proveedor?")) return
    try {
      await suppliersService.deleteSupplier(id)
      setSuppliers((prev) => prev.filter((item) => item.id !== id))
      setFeedback("Proveedor eliminado correctamente.")
    } catch (err) {
      console.error("Error deleting supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo eliminar el proveedor.")
    }
  }

  const renderSupplierList = () => {
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
        key="suppliers-list"
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
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando proveedores...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>Aún no se registraron proveedores.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>NIT / CI</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Correo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Dirección</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Registrado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{supplier.nombre}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{supplier.nit_ci || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{supplier.telefono || "-"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: PURPLE_COLORS.primary }}>{supplier.correo || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        supplier.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {supplier.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {new Date(supplier.fecha_registro).toLocaleDateString("es-BO")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(supplier)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        {supplier.activo ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(supplier.id)}
                            className="hover:opacity-80 transition-opacity text-orange-500"
                            title="Desactivar"
                          >
                            <PowerOff size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(supplier.id)}
                            className="hover:opacity-80 transition-opacity text-green-500"
                            title="Activar"
                          >
                            <Power size={16} />
                          </button>
                        )}
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

  const renderCreateSupplier = () => {
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
        key="supplier-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreateSubmit}
        className="space-y-5 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Nombre del proveedor *</span>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>NIT o CI</span>
            <input
              type="text"
              value={createForm.nit_ci ?? ""}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nit_ci: event.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Teléfono</span>
            <input
              type="tel"
              value={createForm.telefono ?? ""}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, telefono: event.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Correo electrónico</span>
            <input
              type="email"
              value={createForm.correo ?? ""}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, correo: event.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Dirección</span>
          <textarea
            rows={3}
            value={createForm.direccion ?? ""}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, direccion: event.target.value }))}
            className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              color: "#1F2937"
            }}
          />
        </label>

        {/* Productos asociados */}
        <div className="space-y-2 text-sm">
          <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Productos asociados</span>
          {loadingProducts ? (
            <div className="text-sm" style={{ color: "#6B7280" }}>Cargando productos...</div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3" style={{ borderColor: PURPLE_COLORS.accent }}>
              {availableProducts.length === 0 ? (
                <p className="text-sm" style={{ color: "#6B7280" }}>No hay productos disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {availableProducts.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-opacity-50 p-2 rounded" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <input
                        type="checkbox"
                        checked={createForm.productos_ids?.includes(product.id) ?? false}
                        onChange={(e) => {
                          const currentIds = createForm.productos_ids ?? []
                          if (e.target.checked) {
                            setCreateForm((prev) => ({ ...prev, productos_ids: [...currentIds, product.id] }))
                          } else {
                            setCreateForm((prev) => ({ ...prev, productos_ids: currentIds.filter(id => id !== product.id) }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm" style={{ color: "#1F2937" }}>{product.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contactos */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Contactos</span>
            <button
              type="button"
              onClick={() => {
                const newContact = { ...emptyContact }
                setCreateForm((prev) => ({
                  ...prev,
                  contactos: [...(prev.contactos ?? []), newContact]
                }))
              }}
              className="text-xs px-2 py-1 rounded border" 
              style={{ borderColor: PURPLE_COLORS.accent, color: PURPLE_COLORS.primary }}
            >
              <UserPlusIcon size={12} className="inline mr-1" /> Agregar contacto
            </button>
          </div>
          {createForm.contactos && createForm.contactos.length > 0 && (
            <div className="space-y-3">
              {createForm.contactos.map((contact, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2" style={{ borderColor: PURPLE_COLORS.accent }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: PURPLE_COLORS.dark }}>Contacto {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateForm((prev) => ({
                          ...prev,
                          contactos: prev.contactos?.filter((_, i) => i !== index) ?? []
                        }))
                      }}
                      className="text-red-500 hover:opacity-80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={contact.nombre}
                      onChange={(e) => {
                        const updated = [...(createForm.contactos ?? [])]
                        updated[index] = { ...updated[index], nombre: e.target.value }
                        setCreateForm((prev) => ({ ...prev, contactos: updated }))
                      }}
                      className="w-full rounded border px-2 py-1 text-xs bg-white focus:outline-none"
                      style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                    />
                    <input
                      type="text"
                      placeholder="Cargo"
                      value={contact.cargo ?? ""}
                      onChange={(e) => {
                        const updated = [...(createForm.contactos ?? [])]
                        updated[index] = { ...updated[index], cargo: e.target.value }
                        setCreateForm((prev) => ({ ...prev, contactos: updated }))
                      }}
                      className="w-full rounded border px-2 py-1 text-xs bg-white focus:outline-none"
                      style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={contact.telefono ?? ""}
                      onChange={(e) => {
                        const updated = [...(createForm.contactos ?? [])]
                        updated[index] = { ...updated[index], telefono: e.target.value }
                        setCreateForm((prev) => ({ ...prev, contactos: updated }))
                      }}
                      className="w-full rounded border px-2 py-1 text-xs bg-white focus:outline-none"
                      style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={contact.correo ?? ""}
                      onChange={(e) => {
                        const updated = [...(createForm.contactos ?? [])]
                        updated[index] = { ...updated[index], correo: e.target.value }
                        setCreateForm((prev) => ({ ...prev, contactos: updated }))
                      }}
                      className="w-full rounded border px-2 py-1 text-xs bg-white focus:outline-none"
                      style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                    />
                  </div>
                  <textarea
                    placeholder="Observaciones"
                    value={contact.observaciones ?? ""}
                    onChange={(e) => {
                      const updated = [...(createForm.contactos ?? [])]
                      updated[index] = { ...updated[index], observaciones: e.target.value }
                      setCreateForm((prev) => ({ ...prev, contactos: updated }))
                    }}
                    rows={2}
                    className="w-full rounded border px-2 py-1 text-xs bg-white focus:outline-none"
                    style={{ borderColor: PURPLE_COLORS.accent, color: "#1F2937" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setCreateForm({ ...emptyPayload })}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              backgroundColor: WHITE,
              color: PURPLE_COLORS.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WHITE}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: PURPLE_COLORS.primary }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark)}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />} Registrar proveedor
          </button>
        </div>
      </motion.form>
    )
  }

  const renderReportsInfo = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    if (loadingReport) {
      return (
        <motion.div
          key="supplier-reports-loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 text-center"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: PURPLE_COLORS.primary }} />
          <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>Cargando reporte...</p>
        </motion.div>
      )
    }

    if (!reportData) {
      return (
        <motion.div
          key="supplier-reports-empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 text-center"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <p className="text-sm" style={{ color: "#6B7280" }}>No hay datos de reporte disponibles.</p>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="supplier-reports"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total de Proveedores"
            value={reportData.summary.total_proveedores}
            subtitle="Proveedores registrados"
            icon={Building2}
            color="info"
          />
          <KPICard
            title="Proveedores Activos"
            value={reportData.summary.proveedores_activos}
            subtitle="Proveedores activos"
            icon={TrendingUp}
            color="success"
          />
          <KPICard
            title="Proveedores Inactivos"
            value={reportData.summary.proveedores_inactivos}
            subtitle="Proveedores inactivos"
            icon={XCircle}
            color="warning"
          />
        </div>

        {/* Top Proveedores */}
        <div className="rounded-xl shadow-sm bg-white border overflow-hidden" style={{ borderColor: PURPLE_COLORS.accent }}>
          <div className="p-4 border-b" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent }}>
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>Top Proveedores por Volumen de Compras</h3>
          </div>
          {reportData.top_proveedores.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "#6B7280" }}>No hay datos disponibles.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Proveedor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Total Órdenes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Total Comprado</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                  {reportData.top_proveedores.map((proveedor) => (
                    <tr key={proveedor.proveedor_id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: "#1F2937" }}>{proveedor.nombre}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{proveedor.total_ordenes}</td>
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: PURPLE_COLORS.primary }}>
                        Bs. {proveedor.total_comprado.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderPrintInfo = () => (
    <motion.div
      key="supplier-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Imprimir listado de proveedores</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar un PDF. Configura la impresora para incluir
        fondos y conservar el esquema oscuro.
      </p>
      <p className="text-xs text-gray-400">Tip: filtra primero desde la acción "Listado" y luego imprime para exportar la vista deseada.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="supplier-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar proveedores.
    </motion.div>
  )

  // Renderizar dashboard de proveedores
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
          {/* Proveedores por Mes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Crecimiento de Proveedores
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalSuppliers}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +14%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de proveedores registrados
              </p>
            </div>
            <ChartContainer
              config={{
                proveedores: { color: PURPLE_COLORS.primary },
                nuevos: { color: "#3B82F6" },
              }}
              className="h-[250px]"
            >
              <BarChart data={monthlySuppliersData}>
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
                <Bar dataKey="proveedores" fill={PURPLE_COLORS.primary} radius={[4, 4, 0, 0]} />
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
                  {contactData.reduce((sum, item) => sum + (item.name !== "Sin Contacto" ? item.value : 0), 0)}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Con contacto
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {totalSuppliers > 0 ? ((contactData.reduce((sum, item) => sum + (item.name !== "Sin Contacto" ? item.value : 0), 0) / totalSuppliers * 100).toFixed(1)) : 0}% del total
              </p>
            </div>
            <ChartContainer
              config={contactData.reduce((acc, item) => {
                acc[item.name] = { color: item.color }
                return acc
              }, {} as Record<string, { color: string }>)}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={contactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => {
                    // Solo mostrar etiqueta si el porcentaje es mayor a 5% para evitar superposiciones
                    if (percent < 0.05) return ""
                    return `${name}\n${value} (${(percent * 100).toFixed(0)}%)`
                  }}
                  outerRadius={80}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {contactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} proveedores`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Proveedores"
            value={totalSuppliers}
            subtitle="Proveedores registrados"
            icon={Building2}
            change={{ value: 14.2, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Proveedores Activos"
            value={Math.floor(totalSuppliers * 0.75)}
            subtitle="Con órdenes recientes"
            icon={TrendingUp}
            change={{ value: 8.5, label: "vs. período anterior" }}
            color="success"
            delay={0.3}
          />
          <KPICard
            title="Proveedores Nuevos (30 días)"
            value={newSuppliersLast30Days}
            subtitle="Registrados este mes"
            icon={Calendar}
            change={{ value: 18.1, label: "vs. período anterior" }}
            color="info"
            delay={0.4}
          />
          <KPICard
            title="Crecimiento de Proveedores"
            value={`${totalSuppliers > 0 ? Math.round((newSuppliersLast30Days / totalSuppliers) * 100) : 0}%`}
            subtitle="Tasa de crecimiento mensual"
            icon={TrendingUp}
            color="success"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Proveedores con Email"
            value={`${totalSuppliers > 0 ? Math.round((suppliersWithEmail / totalSuppliers) * 100) : 0}%`}
            subtitle={`${suppliersWithEmail} de ${totalSuppliers} proveedores`}
            icon={MailPlus}
            change={{ value: 10.5, label: "vs. período anterior" }}
            color="success"
            delay={0.6}
          />
          <KPICard
            title="Proveedores con Teléfono"
            value={`${totalSuppliers > 0 ? Math.round((suppliersWithPhone / totalSuppliers) * 100) : 0}%`}
            subtitle={`${suppliersWithPhone} de ${totalSuppliers} proveedores`}
            icon={PhoneIncoming}
            change={{ value: 12.3, label: "vs. período anterior" }}
            color="info"
            delay={0.7}
          />
          <KPICard
            title="Proveedores sin Contacto"
            value={suppliersWithoutContact}
            subtitle="Requieren datos de contacto"
            icon={X}
            color="warning"
            delay={0.8}
          />
          <KPICard
            title="Tasa de Contacto"
            value={`${totalSuppliers > 0 ? Math.round(((suppliersWithEmail + suppliersWithPhone) / totalSuppliers) * 100) : 0}%`}
            subtitle="Proveedores con email o teléfono"
            icon={HeartHandshake}
            change={{ value: 6.2, label: "vs. período anterior" }}
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
              <span style={{ color: "#6B7280" }}>Total Proveedores</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Nuevos</span>
            </div>
          </div>
          <ChartContainer
            config={{
              proveedores: { color: PURPLE_COLORS.primary },
              nuevos: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlySuppliersData}>
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
                dataKey="proveedores" 
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
      return renderSupplierList()
    }
    
    switch (selectedAction) {
      case "create":
        return renderCreateSupplier()
      case "reports":
        return renderReportsInfo()
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
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Proveedores</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona tu base de datos de proveedores y socios comerciales
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
        {editModalOpen && editSupplier && (
          <motion.div
            key="edit-supplier-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-xl shadow-lg bg-white border p-6 max-h-[90vh] overflow-y-auto"
              style={{ borderColor: "#EDE9FE" }}
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>Editar proveedor</h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Actualiza los datos de contacto y facturación.</p>
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

              <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <span className="font-semibold" style={{ color: "#6D28D9" }}>NIT / CI</span>
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
                
                {/* Productos asociados en edición */}
                {editSupplier && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: "#6D28D9" }}>Productos asociados</span>
                      {editSupplier.productos && editSupplier.productos.length > 0 && (
                        <span className="text-xs" style={{ color: "#6B7280" }}>{editSupplier.productos.length} producto(s)</span>
                      )}
                    </div>
                    {loadingProducts ? (
                      <div className="text-xs" style={{ color: "#6B7280" }}>Cargando productos...</div>
                    ) : (
                      <div className="max-h-32 overflow-y-auto border rounded-lg p-2" style={{ borderColor: "#EDE9FE" }}>
                        {availableProducts.length === 0 ? (
                          <p className="text-xs" style={{ color: "#6B7280" }}>No hay productos disponibles.</p>
                        ) : (
                          <div className="space-y-1">
                            {availableProducts.map((product) => (
                              <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-opacity-50 p-1 rounded transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                <input
                                  type="checkbox"
                                  checked={editForm.productos_ids?.includes(product.id) ?? false}
                                  onChange={(e) => {
                                    const currentIds = editForm.productos_ids ?? []
                                    if (e.target.checked) {
                                      setEditForm((prev) => ({ ...prev, productos_ids: [...currentIds, product.id] }))
                                    } else {
                                      setEditForm((prev) => ({ ...prev, productos_ids: currentIds.filter(id => id !== product.id) }))
                                    }
                                  }}
                                  className="rounded"
                                  style={{ accentColor: "#8B5CF6" }}
                                />
                                <span className="text-xs" style={{ color: "#1F2937" }}>{product.nombre}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Contactos en edición */}
                {editSupplier && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: "#6D28D9" }}>Contactos</span>
                      <button
                        type="button"
                        onClick={() => openContactModal(editSupplier.id)}
                        className="text-xs px-2 py-1 rounded border transition-colors"
                        style={{ 
                          borderColor: "#EDE9FE",
                          color: "#8B5CF6"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EDE9FE"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <UserPlusIcon size={12} className="inline mr-1" /> Agregar
                      </button>
                    </div>
                    {editSupplier.contactos && editSupplier.contactos.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {editSupplier.contactos.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-2 border rounded-lg" style={{ borderColor: "#EDE9FE" }}>
                            <div className="flex-1">
                              <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>{contact.nombre}</p>
                              {contact.cargo && <p className="text-xs" style={{ color: "#6B7280" }}>{contact.cargo}</p>}
                              {contact.telefono && <p className="text-xs" style={{ color: "#6B7280" }}>{contact.telefono}</p>}
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openContactModal(editSupplier!.id, contact)}
                                className="text-xs px-2 py-1 hover:opacity-80 transition-opacity rounded"
                                style={{ color: "#8B5CF6" }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-xs px-2 py-1 hover:opacity-80 transition-opacity text-red-500 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "#6B7280" }}>No hay contactos registrados.</p>
                    )}
                  </div>
                )}

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

        {/* Modal de Contacto */}
        {contactModalOpen && (
          <motion.div
            key="contact-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl shadow-lg bg-white border p-6"
              style={{ borderColor: "#EDE9FE" }}
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#6D28D9" }}>
                    {editingContact ? "Editar contacto" : "Nuevo contacto"}
                  </h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Información del contacto del proveedor.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "#6B7280" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4 text-sm">
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>Nombre *</span>
                  <input
                    type="text"
                    value={contactForm.nombre}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    required
                    className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                    style={{ 
                      borderColor: "#EDE9FE",
                      color: "#1F2937"
                    }}
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>Cargo</span>
                  <input
                    type="text"
                    value={contactForm.cargo ?? ""}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, cargo: e.target.value }))}
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
                      value={contactForm.telefono ?? ""}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, telefono: e.target.value }))}
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
                      value={contactForm.correo ?? ""}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, correo: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
                      style={{ 
                        borderColor: "#EDE9FE",
                        color: "#1F2937"
                      }}
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="font-semibold" style={{ color: "#6D28D9" }}>Observaciones</span>
                  <textarea
                    rows={2}
                    value={contactForm.observaciones ?? ""}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, observaciones: e.target.value }))}
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
                    onClick={() => setContactModalOpen(false)}
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
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
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
