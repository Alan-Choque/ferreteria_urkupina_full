"use client"

import { useState } from "react"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState({
    documentType: "CI",
    documentNumber: "12345678",
  })

  const [editMode, setEditMode] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setDocuments((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Mis Documentos</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
        >
          {editMode ? "Cancelar" : "Editar"}
        </button>
      </div>

      <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Tipo de Documento</label>
              <select
                value={documents.documentType}
                onChange={(e) => handleInputChange("documentType", e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="CI">Cédula de Identidad</option>
                <option value="NIT">NIT</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Número de Documento</label>
              <input
                type="text"
                value={documents.documentNumber}
                onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button
              onClick={() => setEditMode(false)}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
            >
              Guardar Cambios
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Tipo:</span>
              <span className="font-medium text-neutral-900">
                {documents.documentType === "CI" && "Cédula de Identidad"}
                {documents.documentType === "NIT" && "NIT"}
                {documents.documentType === "PASSPORT" && "Pasaporte"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Número:</span>
              <span className="font-medium text-neutral-900">{documents.documentNumber}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
