"use client"

import { useState, useEffect } from "react"
import { customersService, type CustomerPayload } from "@/lib/services/customers-service"
import { Loader2, CheckCircle, X } from "lucide-react"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<CustomerPayload>({
    nombre: "",
    nit_ci: "",
    telefono: "",
    correo: "",
    direccion: "",
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const customer = await customersService.getMyCustomer()
        setFormData({
          nombre: customer.nombre,
          nit_ci: customer.nit_ci ?? "",
          telefono: customer.telefono ?? "",
          correo: customer.correo ?? "",
          direccion: customer.direccion ?? "",
        })
      } catch (err) {
        console.error("Error loading profile:", err)
        if (err instanceof Error && (err as any).status === 404) {
          setError("No se encontró un cliente asociado a tu cuenta. Por favor, contacta con soporte.")
        } else {
          setError(err instanceof Error ? err.message : "Error al cargar tu perfil")
        }
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre?.trim()) {
      setError("El nombre es obligatorio")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await customersService.updateMyCustomer(formData)
      setSuccess("Datos actualizados correctamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar los datos")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Datos Personales</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Datos Personales</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X size={20} className="text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-neutral-200">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              CI / NIT
            </label>
            <input
              type="text"
              value={formData.nit_ci ?? ""}
              onChange={(e) => setFormData(prev => ({ ...prev, nit_ci: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono ?? ""}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.correo ?? ""}
              readOnly
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-neutral-500">
              El correo no se puede cambiar (está vinculado a tu cuenta)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Dirección
          </label>
          <textarea
            rows={3}
            value={formData.direccion ?? ""}
            onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
