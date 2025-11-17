"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
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
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
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
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [historyCoupons, setHistoryCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [createForm, setCreateForm] = useState<typeof DEFAULT_CREATE_FORM>({ ...DEFAULT_CREATE_FORM })
  const [editForm, setEditForm] = useState<typeof DEFAULT_EDIT_FORM>({ ...DEFAULT_EDIT_FORM })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listado de promociones",
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
        const data = await promotionsService.listCoupons(active)
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
    [],
  )

  useEffect(() => {
    void loadCoupons()
  }, [loadCoupons])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    setError(null)
    setFeedback(null)

    if (actionId === "list") {
      void loadCoupons()
    } else if (actionId === "history") {
      setHistoryLoading(true)
      void loadCoupons(false)
    } else if (actionId === "create") {
      setCreateForm({ ...DEFAULT_CREATE_FORM })
    }
  }

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

  const renderList = () => (
    <motion.div
      key="promotions-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loading ? (
        <div className="p-6 text-center text-gray-300">Cargando promociones...</div>
      ) : coupons.length === 0 ? (
        <div className="p-6 text-center text-gray-300">Aún no se registraron promociones.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Código</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Usos</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Válido hasta</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-blue-300">{coupon.code}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded text-xs bg-blue-600/20 text-blue-300">
                      {coupon.type === "percentage" ? "%" : "Bs."}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-100">
                    {coupon.type === "percentage" ? `${coupon.value}%` : `Bs. ${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {coupon.usageCount}/{coupon.usageLimit || "∞"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString("es-BO") : "Sin fecha"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        coupon.enabled ? "bg-green-600/20 text-green-300" : "bg-gray-600/20 text-gray-400"
                      }`}
                    >
                      {coupon.enabled ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon)}
                        className="text-gray-300 hover:text-yellow-400"
                      >
                        <Toggle2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditModal(coupon)}
                        className="text-gray-300 hover:text-blue-400"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon.id)}
                        className="text-gray-300 hover:text-red-500"
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

  const renderCreateForm = () => (
    <motion.form
      key="promotions-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
      onSubmit={handleCreateSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Código *</span>
          <input
            type="text"
            value={createForm.code}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, code: event.target.value }))}
            required
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Tipo</span>
          <select
            value={createForm.type}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value as "percentage" | "fixed" }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto fijo (Bs.)</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Valor *</span>
          <input
            type="number"
            step="0.01"
            value={createForm.value}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, value: Number.parseFloat(event.target.value) }))}
            required
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Límite de usos (0 = Ilimitado)</span>
          <input
            type="number"
            value={createForm.usageLimit}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, usageLimit: Number.parseInt(event.target.value || "0", 10) }))
            }
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Válido desde</span>
          <input
            type="date"
            value={createForm.validFrom}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, validFrom: event.target.value }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Válido hasta</span>
          <input
            type="date"
            value={createForm.validTo}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, validTo: event.target.value }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="create-enabled"
          type="checkbox"
          checked={createForm.enabled}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
          className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-red-500 focus:ring-red-500"
        />
        <label htmlFor="create-enabled" className="text-sm text-gray-200">
          Activar promoción al guardar
        </label>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setCreateForm({ ...DEFAULT_CREATE_FORM })}
          className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
        >
          Limpiar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear promoción"}
        </button>
      </div>
    </motion.form>
  )

  const renderHistory = () => (
    <motion.div
      key="promotions-history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {historyLoading ? (
        <div className="p-6 text-center text-gray-300">Cargando historial...</div>
      ) : historyCoupons.length === 0 ? (
        <div className="p-6 text-center text-gray-300">No hay campañas históricas registradas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Código</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Vigencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {historyCoupons.map((coupon) => (
                <tr key={`history-${coupon.id}`} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-200">{coupon.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{coupon.type === "percentage" ? "Porcentaje" : "Monto"}</td>
                  <td className="px-6 py-4 text-sm text-gray-100">
                    {coupon.type === "percentage" ? `${coupon.value}%` : `Bs. ${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
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

  const renderActionContent = () => {
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
        return renderEmptyState()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-white">Promociones</h1>
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de promociones"
            subtitle="Panel general"
            actions={actions}
            selectedAction={selectedAction}
            onSelect={handleActionSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
              >
                <ArrowLeft size={16} /> Volver al menú de acciones
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {actions.find((action) => action.id === selectedAction)?.label ?? "Acción"}
                </h2>
                <p className="text-xs text-gray-400">
                  {actions.find((action) => action.id === selectedAction)?.description ?? ""}
                </p>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="rounded-md border border-green-600 bg-green-600/15 px-4 py-3 text-sm text-green-200">
              {feedback}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-600 bg-red-600/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">{renderActionContent()}</AnimatePresence>
        </div>
      )}

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
