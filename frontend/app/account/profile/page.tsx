"use client"

import { useState } from "react"

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@example.com",
    phone: "71234567",
  })

  const [editMode, setEditMode] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setEditMode(false)
  }

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Información Personal</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
          >
            {editMode ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Apellido</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
            >
              Guardar Cambios
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Nombre:</span>
              <span className="font-medium text-neutral-900">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Email:</span>
              <span className="font-medium text-neutral-900">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Teléfono:</span>
              <span className="font-medium text-neutral-900">{formData.phone}</span>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Cambiar Contraseña</h2>
          <button
            onClick={() => setPasswordMode(!passwordMode)}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
          >
            {passwordMode ? "Cancelar" : "Cambiar"}
          </button>
        </div>

        {passwordMode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Contraseña Actual</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Nueva Contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
              Actualizar Contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
