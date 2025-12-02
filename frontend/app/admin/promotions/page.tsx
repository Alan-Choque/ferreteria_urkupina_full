"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  ClipboardList,
  Edit2,
  History,
  Loader2,
  Printer,
  Sparkles,
  ToggleLeft as Toggle2,
  Trash2,
  X,
  CheckCircle,
  Search,
  TrendingUp,
  Percent,
  Calendar,
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

import type { ActionItem } from "@/components/admin/ActionsGrid"
import { promotionsService } from "@/lib/services/promotions-service"
import type { Coupon } from "@/lib/types/admin"

const DEFAULT_CREATE_FORM = {
  code: "",
  type: "percentage" as const,
  value: 0,
  usageLimit: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
  enabled: true,
}

const DEFAULT_EDIT_FORM = {
  code: "",
  type: "percentage" as const,
  value: 0,
  usageLimit: 0,
  validFrom: "",
  validTo: "",
  enabled: true,
}

export default function PromotionsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/promotions" || pathname === "/admin/promotions/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [historyCoupons, setHistoryCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  const [createForm, setCreateForm] = useState<typeof DEFAULT_CREATE_FORM>({ ...DEFAULT_CREATE_FORM })
  const [editForm, setEditForm] = useState<typeof DEFAULT_EDIT_FORM>({ ...DEFAULT_EDIT_FORM })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter(c => c.enabled).length
  const inactiveCoupons = coupons.filter(c => !c.enabled).length
  const historyCount = historyCoupons.length
  const averageDiscount = coupons.length > 0 
    ? coupons.reduce((sum, c) => sum + (c.value || 0), 0) / coupons.length 
    : 0

  // Datos para gráfico de promociones por tipo
  const typeData = useMemo(() => {
    const percentageCoupons = coupons.filter(c => c.type === "percentage").length
    const fixedCoupons = coupons.filter(c => c.type === "fixed").length
    return [
      { name: "Porcentaje", value: percentageCoupons, color: "#8B5CF6" },
      { name: "Fijo", value: fixedCoupons, color: "#3B82F6" },
    ]
  }, [coupons])

  // Datos para gráfico de promociones por estado
  const statusData = useMemo(() => [
    { name: "Activas", value: activeCoupons, color: "#10B981" },
    { name: "Inactivas", value: inactiveCoupons, color: "#6B7280" },
  ], [activeCoupons, inactiveCoupons])

  // Datos para gráfico de tendencias mensuales
  const monthlyPromotionsData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      promociones: Math.floor(Math.random() * 10) + 5 + (index * 1),
      usos: Math.floor(Math.random() * 100) + 50 + (index * 10),
    }))
  }, [])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listar y buscar promociones",
        description: "Consulta promociones activas con sus reglas.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Crear promoción",
        description: "Diseña descuentos y campañas especiales.",
        status: "disponible",
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        id: "history",
        label: "Historial de campañas",
        description: "Revisa promociones finalizadas y reutiliza configuraciones.",
        status: "disponible",
        icon: <History className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir listado",
        description: "Genera una versión imprimible del catálogo actual.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
      },
    ],
    [],
  )

  const loadCoupons = useCallback(
    async (active?: boolean) => {
      if (active === false) {
        setHistoryLoading(true)
      } else {
        setLoading(true)
      }
      setError(null)
      try {
        const data = await promotionsService.listCoupons(active, searchQuery.trim() || undefined)
        if (active === false) {
          setHistoryCoupons(data)
        } else {
          setCoupons(data)
        }
      } catch (err) {
        console.error("Error loading promotions", err)
        setError(err instanceof Error ? err.message : "No se pudieron cargar las promociones")
      } finally {
        if (active === false) {
          setHistoryLoading(false)
        } else {
          setLoading(false)
        }
      }
    },
    [searchQuery],
  )

  useEffect(() => {
    if (selectedAction === "list") {
      void loadCoupons()
    } else if (selectedAction === "history") {
      void loadCoupons(false)
    } else if (selectedAction === "create") {
      setCreateForm({ ...DEFAULT_CREATE_FORM })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction, searchQuery])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleToggle = async (coupon: Coupon) => {
    setError(null)
    try {
      await promotionsService.updateCoupon(coupon.id, {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        enabled: !coupon.enabled,
      })
      setFeedback("Promoción actualizada correctamente.")
      await loadCoupons()
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar la promoción")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar esta promoción?")) return
    setError(null)
    try {
      await promotionsService.deleteCoupon(id)
      setFeedback("Promoción eliminada correctamente.")
      await loadCoupons()
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar la promoción")
    }
  }

  const handleEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setEditForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      usageLimit: coupon.usageLimit || 0,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : "",
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().slice(0, 10) : "",
      enabled: coupon.enabled,
    })
    setIsEditModalOpen(true)
  }

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await promotionsService.createCoupon({
        code: createForm.code,
        type: createForm.type,
        value: createForm.value,
        validFrom: createForm.validFrom,
        validTo: createForm.validTo || null,
        enabled: createForm.enabled,
      })
      setFeedback("Promoción creada correctamente.")
      setCreateForm({ ...DEFAULT_CREATE_FORM })
      setSelectedAction("list")
      await loadCoupons()
    } catch (err: any) {
      setError(err?.message || "No se pudo crear la promoción")
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingCoupon) return
    setSaving(true)
    setError(null)
    try {
      await promotionsService.updateCoupon(editingCoupon.id, {
        code: editForm.code,
        type: editForm.type,
        value: editForm.value,
        validFrom: editForm.validFrom || null,
        validTo: editForm.validTo || null,
        enabled: editForm.enabled,
      })
      setFeedback("Promoción actualizada correctamente.")
      setIsEditModalOpen(false)
      setEditingCoupon(null)
      await loadCoupons()
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar la promoción")
    } finally {
      setSaving(false)
    }
  }

  const renderList = () => {
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
        key="promotions-list"
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
              placeholder="Buscar por código de promoción..."
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
        {loading ? (
          <div className="p-6 text-center" style={{ color: PURPLE_COLORS.secondary }}>Cargando promociones...</div>
        ) : coupons.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>Aún no se registraron promociones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: PURPLE_COLORS.accent, borderColor: PURPLE_COLORS.accent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Código</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Usos</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Válido hasta</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: PURPLE_COLORS.primary }}>{coupon.code}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: PURPLE_COLORS.accent, color: PURPLE_COLORS.primary }}>
                        {coupon.type === "percentage" ? "%" : "Bs."}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#1F2937" }}>
                      {coupon.type === "percentage" ? `${coupon.value}%` : `Bs. ${coupon.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {coupon.usageCount}/{coupon.usageLimit || "∞"}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString("es-BO") : "Sin fecha"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="rounded px-2 py-1 text-xs font-medium"
                        style={coupon.enabled ? { backgroundColor: "#D1FAE5", color: "#10B981" } : { backgroundColor: "#F3F4F6", color: "#6B7280" }}
                      >
                        {coupon.enabled ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(coupon)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: "#F59E0B" }}
                        >
                          <Toggle2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditModal(coupon)}
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: PURPLE_COLORS.primary }}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon.id)}
                          className="hover:opacity-80 transition-opacity text-red-500"
                        >
                          <Trash2 size={18} />
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

  const renderCreateForm = () => {
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
        key="promotions-create"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 rounded-xl shadow-sm bg-white border p-6"
        style={{ borderColor: PURPLE_COLORS.accent }}
        onSubmit={handleCreateSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Código *</span>
            <input
              type="text"
              value={createForm.code}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, code: event.target.value }))}
              required
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Tipo</span>
            <select
              value={createForm.type}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value as "percentage" | "fixed" }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            >
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo (Bs.)</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Valor *</span>
            <input
              type="number"
              step="0.01"
              value={createForm.value}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, value: Number.parseFloat(event.target.value) }))}
              required
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Límite de usos (0 = Ilimitado)</span>
            <input
              type="number"
              value={createForm.usageLimit}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, usageLimit: Number.parseInt(event.target.value || "0", 10) }))
              }
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Válido desde</span>
            <input
              type="date"
              value={createForm.validFrom}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, validFrom: event.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-semibold" style={{ color: PURPLE_COLORS.dark }}>Válido hasta</span>
            <input
              type="date"
              value={createForm.validTo}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, validTo: event.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none"
              style={{ 
                borderColor: PURPLE_COLORS.accent,
                color: "#1F2937"
              }}
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="create-enabled"
            type="checkbox"
            checked={createForm.enabled}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            className="h-4 w-4 rounded"
            style={{ 
              borderColor: PURPLE_COLORS.accent,
              accentColor: PURPLE_COLORS.primary
            }}
          />
          <label htmlFor="create-enabled" className="text-sm" style={{ color: PURPLE_COLORS.dark }}>
            Activar promoción al guardar
          </label>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setCreateForm({ ...DEFAULT_CREATE_FORM })}
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear promoción"}
          </button>
        </div>
      </motion.form>
    )
  }

  const renderHistory = () => {
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
        key="promotions-history"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl shadow-sm bg-white border overflow-hidden"
        style={{ borderColor: PURPLE_COLORS.accent }}
      >
        {historyLoading ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>
            <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" style={{ color: PURPLE_COLORS.primary }} />
            Cargando historial...
          </div>
        ) : historyCoupons.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "#6B7280" }}>No hay campañas históricas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: PURPLE_COLORS.accent + "40" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Código</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: PURPLE_COLORS.dark }}>Vigencia</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PURPLE_COLORS.accent }}>
                {historyCoupons.map((coupon) => (
                  <tr key={`history-${coupon.id}`} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent + "40"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937" }}>{coupon.code}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>{coupon.type === "percentage" ? "Porcentaje" : "Monto"}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#1F2937", fontWeight: 600 }}>
                      {coupon.type === "percentage" ? `${coupon.value}%` : `Bs. ${coupon.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#6B7280" }}>
                      {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString("es-BO") : "-"} →{" "}
                      {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString("es-BO") : "-"}
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

  const renderPrintInfo = () => (
    <motion.div
      key="promotions-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Imprimir listado de promociones</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar un PDF con el listado activo.
        Antes de imprimir, navega al listado para aplicar los filtros que necesites.
      </p>
      <p className="text-xs text-gray-400">Recomendación: activa la opción "Fondos" en la impresora para preservar el tema oscuro.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="promotions-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar las promociones.
    </motion.div>
  )

  // Renderizar dashboard de promociones
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
          {/* Promociones por Tipo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Promociones por Tipo
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalCoupons}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +12%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de promociones creadas
              </p>
            </div>
            <ChartContainer
              config={{
                "Porcentaje": { color: PURPLE_COLORS.primary },
                "Fijo": { color: "#3B82F6" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
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

          {/* Distribución por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Estado de Promociones
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {activeCoupons}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Activas
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {((activeCoupons / totalCoupons) * 100).toFixed(1)}% del total
              </p>
            </div>
            <ChartContainer
              config={{
                "Activas": { color: "#10B981" },
                "Inactivas": { color: "#6B7280" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
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

        {/* Fila Media: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Total Promociones
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <ClipboardList size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {totalCoupons}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+12.5%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Promociones Activas
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <Sparkles size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {activeCoupons}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+18.3%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Descuento Promedio
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <Percent size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {averageDiscount.toFixed(1)}%
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+2.1%</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-xl p-5 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
                Historial
              </p>
              <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <History size={18} style={{ color: PURPLE_COLORS.primary }} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
              {historyCount}
            </p>
            <p className="text-xs" style={{ color: "#10B981" }}>
              vs. Período anterior <span className="font-semibold">+25.7%</span>
            </p>
          </motion.div>
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
              Tendencias de Promociones
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Promociones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Usos</span>
            </div>
          </div>
          <ChartContainer
            config={{
              promociones: { color: PURPLE_COLORS.primary },
              usos: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyPromotionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
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
                yAxisId="left"
                type="monotone" 
                dataKey="promociones" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="usos" 
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

  const renderContent = () => {
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    switch (selectedAction) {
      case "list":
        return renderList()
      case "create":
        return renderCreateForm()
      case "history":
        return renderHistory()
      case "print":
        return renderPrintInfo()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Promociones</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona cupones, descuentos y campañas promocionales
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

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && editingCoupon && (
          <motion.div
            key="edit-coupon-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6 text-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Editar promoción</h3>
                  <p className="text-xs text-gray-400">Actualiza valores y vigencia del descuento.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-sm">
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Código *</span>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, code: event.target.value }))}
                    required
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Tipo</span>
                  <select
                    value={editForm.type}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, type: event.target.value as "percentage" | "fixed" }))}
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo (Bs.)</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Valor *</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.value}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, value: Number.parseFloat(event.target.value) }))}
                    required
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Límite de usos (0 = ilimitado)</span>
                  <input
                    type="number"
                    value={editForm.usageLimit}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, usageLimit: Number.parseInt(event.target.value || "0", 10) }))
                    }
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="font-semibold text-gray-200">Válido desde</span>
                    <input
                      type="date"
                      value={editForm.validFrom}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, validFrom: event.target.value }))}
                      className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="font-semibold text-gray-200">Válido hasta</span>
                    <input
                      type="date"
                      value={editForm.validTo}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, validTo: event.target.value }))}
                      className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-enabled"
                    type="checkbox"
                    checked={editForm.enabled}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="edit-enabled" className="text-sm text-gray-200">
                    Promoción activa
                  </label>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
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
