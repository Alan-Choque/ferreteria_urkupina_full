"use client"

import { useEffect, useMemo, useState } from "react"
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
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { customersService, type AdminCustomer, type CustomerPayload } from "@/lib/services/customers-service"

const emptyPayload: CustomerPayload = {
  nombre: "",
  nit_ci: "",
  telefono: "",
  correo: "",
  direccion: "",
}

export default function CustomersPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState<CustomerPayload>({ ...emptyPayload })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<AdminCustomer | null>(null)
  const [editForm, setEditForm] = useState<CustomerPayload>({ ...emptyPayload })

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "list",
        label: "Listado de clientes",
        description: "Consulta datos de contacto y fecha de registro.",
        status: "disponible",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "create",
        label: "Registrar cliente",
        description: "Crea fichas con datos fiscales y múltiples contactos.",
        status: "disponible",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        id: "import",
        label: "Importar clientes",
        description: "Carga masiva desde planillas homologadas.",
        status: "disponible",
        icon: <Upload className="h-5 w-5" />,
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
      const data = await customersService.listCustomers()
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
      void loadCustomers()
    }
  }

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.nombre.trim()) {
      setError("El nombre del cliente es obligatorio")
      return
    }
    setSaving(true)
    try {
      const created = await customersService.createCustomer(createForm)
      setCustomers((prev) => [created, ...prev])
      setCreateForm({ ...emptyPayload })
      setFeedback("Cliente registrado correctamente.")
    } catch (err) {
      console.error("Error creating customer", err)
      setError(err instanceof Error ? err.message : "No se pudo registrar el cliente.")
    } finally {
      setSaving(false)
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

  const renderCustomerList = () => (
    <motion.div
      key="customers-list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden text-white"
    >
      {loadingList ? (
        <div className="p-6 text-center text-gray-300">Cargando clientes...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-200">{error}</div>
      ) : customers.length === 0 ? (
        <div className="p-6 text-center text-gray-300">Aún no se registraron clientes.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">CI / NIT</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Teléfono</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Correo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Dirección</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">Registrado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-100">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-100">{customer.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{customer.nit_ci || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{customer.telefono || "-"}</td>
                  <td className="px-6 py-4 text-sm text-blue-300">{customer.correo || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{customer.direccion || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(customer.fecha_registro).toLocaleDateString("es-BO")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(customer)}
                        className="text-gray-300 hover:text-blue-300"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(customer.id)}
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

  const renderCreateCustomer = () => (
    <motion.form
      key="customer-create"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleCreateSubmit}
      className="space-y-5 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">Nombre completo *</span>
          <input
            type="text"
            value={createForm.nombre}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
            required
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-gray-200">CI / NIT</span>
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
          className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-50"
        >
          Limpiar formulario
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />} Registrar cliente
        </button>
      </div>
    </motion.form>
  )

  const renderImportInfo = () => (
    <motion.div
      key="customer-import"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Importación masiva de clientes</h3>
      <p className="text-sm text-gray-300">
        Estamos preparando la importación desde archivos CSV/XLSX con validación de duplicados, normalización de
        direcciones y asociación automática a sucursales.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-300">
        <li>Descarga la plantilla con columnas obligatorias y ejemplos.</li>
        <li>Completa datos fiscales, teléfonos y direcciones.</li>
        <li>Carga el archivo y confirma los registros antes de guardarlos.</li>
      </ol>
      <div className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
        Esta funcionalidad se conectará con las tablas reales `dbo.clientes` y `dbo.direcciones`.
      </div>
    </motion.div>
  )

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

  const renderActionContent = () => {
    switch (selectedAction) {
      case "list":
        return renderCustomerList()
      case "create":
        return renderCreateCustomer()
      case "import":
        return renderImportInfo()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
        </div>
        {selectedAction === "list" && (
          <button
            type="button"
            onClick={() => void loadCustomers()}
            disabled={loadingList}
            className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 disabled:opacity-50"
          >
            {loadingList ? <Loader2 className="h-4 ónica animate-spin" /> : <RefreshCw size={16} />} Actualizar listado
          </button>
        )}
      </div>

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de clientes"
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
              className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6 text-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Editar cliente</h3>
                  <p className="text-xs text-gray-400">Actualiza los datos de contacto y la información fiscal.</p>
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
                  <span className="font-semibold text-gray-200">CI / NIT</span>
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
                    className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-red-500 hover:bg-gray-800"
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
