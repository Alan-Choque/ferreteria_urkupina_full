"use client"

import { useEffect, useMemo, useState } from "react"
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
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { suppliersService, type AdminSupplier, type SupplierPayload } from "@/lib/services/suppliers-service"

const emptyPayload: SupplierPayload = {
  nombre: "",
  nit_ci: "",
  telefono: "",
  correo: "",
  direccion: "",
}

export default function SuppliersPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<SupplierPayload>({ ...emptyPayload })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<AdminSupplier | null>(null)
  const [editForm, setEditForm] = useState<SupplierPayload>({ ...emptyPayload })

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listado de proveedores",
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
        id: "import",
        label: "Importar proveedores",
        description: "Carga masiva desde planillas homologadas.",
        status: "disponible",
        icon: <Upload className="h-5 w-5" />,
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
      const data = await suppliersService.listSuppliers()
      setSuppliers(data)
    } catch (err) {
      console.error("Error loading suppliers", err)
      setError(err instanceof Error ? err.message : "No se pudo cargar el listado de proveedores.")
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadSuppliers()
  }, [])

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
      setSuppliers((prev) => [created, ...prev])
      setCreateForm({ ...emptyPayload })
      setFeedback("Proveedor registrado correctamente.")
    } catch (err) {
      console.error("Error creating supplier", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el proveedor.")
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (supplier: AdminSupplier) => {
    setEditSupplier(supplier)
    setEditForm({
      nombre: supplier.nombre,
      nit_ci: supplier.nit_ci ?? "",
      telefono: supplier.telefono ?? "",
      correo: supplier.correo ?? "",
      direccion: supplier.direccion ?? "",
    })
    setEditModalOpen(true)
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
      const updated = await suppliersService.updateSupplier(editSupplier.id, editForm)
      setSuppliers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
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

  const renderSupplierList = () => (
    <motion.div
      key="suppliers-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingList ? (
        <div className="p-6 text-center text-gray-300">Cargando proveedores...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-200">{error}</div>
      ) : suppliers.length === 0 ? (
        <div className="p-6 text-center text-gray-300">Aún no se registraron proveedores.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">NIT / CI</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Teléfono</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Correo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Dirección</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Registrado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-100">{supplier.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{supplier.nit_ci || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{supplier.telefono || "-"}</td>
                  <td className="px-6 py-4 text-sm text-blue-300">{supplier.correo || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{supplier.direccion || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(supplier.fecha_registro).toLocaleDateString("es-BO")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(supplier)}
                        className="text-gray-300 hover:text-blue-300"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(supplier.id)}
                        className="text-gray-300 hover:text-red-400"
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

  const renderCreateSupplier = () => (
    <motion.form
      key="supplier-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleCreateSubmit}
      className="space-y-5 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Nombre del proveedor *</span>
          <input
            type="text"
            value={createForm.nombre}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
            required
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">NIT o CI</span>
          <input
            type="text"
            value={createForm.nit_ci ?? ""}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, nit_ci: event.target.value }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Teléfono</span>
          <input
            type="tel"
            value={createForm.telefono ?? ""}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, telefono: event.target.value }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Correo electrónico</span>
          <input
            type="email"
            value={createForm.correo ?? ""}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, correo: event.target.value }))}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm">
        <span className="font-semibold text-gray-200">Dirección</span>
        <textarea
          rows={3}
          value={createForm.direccion ?? ""}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, direccion: event.target.value }))}
          className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
        />
      </label>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setCreateForm({ ...emptyPayload })}
          className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
        >
          Limpiar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />} Registrar proveedor
        </button>
      </div>
    </motion.form>
  )

  const renderImportInfo = () => (
    <motion.div
      key="supplier-import"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Importación masiva de proveedores</h3>
      <p className="text-sm text-gray-300">
        Muy pronto podrás cargar plantillas en formato Excel (XLSX/CSV) para crear y actualizar proveedores de manera
        masiva, validando duplicados y completando catálogos auxiliares.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Descarga la plantilla oficial con los campos obligatorios.</li>
        <li>Completa NIT/CI, contactos y dirección de cada proveedor.</li>
        <li>Sube el archivo y confirma las coincidencias antes de aplicar cambios.</li>
      </ol>
      <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
        Estamos conectando esta importación con la tabla real `dbo.proveedores` y contactos asociados.
      </div>
    </motion.div>
  )

  const renderReportsInfo = () => (
    <motion.div
      key="supplier-reports"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Reportes y análisis de proveedores</h3>
      <p className="text-sm text-gray-300">
        Próximamente verás indicadores clave como tiempos de entrega, nivel de cumplimiento, montos acumulados por
        proveedor y contratos próximos a vencer.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Ranking por puntualidad</p>
          <p className="text-xs text-gray-400">Días promedio de atraso/adelanto frente a la fecha pactada.</p>
        </div>
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Volumen de compras</p>
          <p className="text-xs text-gray-400">Monto total anual y comparación vs. presupuesto.</p>
        </div>
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Alertas de documentación</p>
          <p className="text-xs text-gray-400">Certificados y pólizas próximos a vencer.</p>
        </div>
        <div className="space-y-1 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-300">
          <p className="font-semibold text-white">Historial de incidencias</p>
          <p className="text-xs text-gray-400">Devoluciones, reclamos y penalidades asociados.</p>
        </div>
      </div>
    </motion.div>
  )

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

  const renderActionContent = () => {
    switch (selectedAction) {
      case "list":
        return renderSupplierList()
      case "create":
        return renderCreateSupplier()
      case "import":
        return renderImportInfo()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Proveedores</h1>
        </div>
        {selectedAction === "list" && (
          <button
            type="button"
            onClick={() => void loadSuppliers()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 disabled:opacity-50"
          >
            {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />} Actualizar listado
          </button>
        )}
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones con proveedores"
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
                <h2 className="text-xl font-semibold text-white">{currentAction?.label ?? "Acción"}</h2>
                {currentAction?.description && (
                  <p className="max-w-xl text-xs text-gray-400">{currentAction.description}</p>
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div className="rounded-md border border-green-600 bg-green-600/15 px-4 py-3 text-sm text-green-200">
              {feedback}
            </div>
          )}
          {error && selectedAction !== "list" && (
            <div className="rounded-md border border-red-600 bg-red-600/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">{renderActionContent()}</AnimatePresence>
        </div>
      )}

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
              className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6 text-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Editar proveedor</h3>
                  <p className="text-xs text-gray-400">Actualiza los datos de contacto y facturación.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="text-sm text-gray-300 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4 text-sm">
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Nombre *</span>
                  <input
                    type="text"
                    value={editForm.nombre ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">NIT / CI</span>
                  <input
                    type="text"
                    value={editForm.nit_ci ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, nit_ci: event.target.value }))}
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="font-semibold text-gray-200">Teléfono</span>
                    <input
                      type="tel"
                      value={editForm.telefono ?? ""}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, telefono: event.target.value }))}
                      className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="font-semibold text-gray-200">Correo</span>
                    <input
                      type="email"
                      value={editForm.correo ?? ""}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, correo: event.target.value }))}
                      className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="font-semibold text-gray-200">Dirección</span>
                  <textarea
                    rows={3}
                    value={editForm.direccion ?? ""}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, direccion: event.target.value }))}
                    className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
                  />
                </label>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
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
