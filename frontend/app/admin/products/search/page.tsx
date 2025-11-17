"use client"

import Link from "next/link"

export default function ProductSearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Buscar producto</h1>
          <p className="text-sm text-gray-300">
            Localiza productos por código, nombre, categoría o estado. El buscador avanzado se integrará con filtros y
            exportaciones.
          </p>
        </div>
        <Link
          href="/admin/products/list"
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700/70 transition-colors text-sm"
        >
          Volver al listado
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-white space-y-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Buscador en desarrollo</h2>
          <p className="text-sm text-gray-300 mb-4">
            Estamos construyendo un buscador unificado con filtros combinables (texto, categorías, marcas, disponibilidad,
            etiquetas). Mientras tanto, usa el buscador rápido del listado para encontrar productos por nombre o SKU.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Filtro por código interno y códigos de barra.</li>
            <li>Segmentación por estado (activo, en revisión, inactivo).</li>
            <li>Compatibilidad con exportación a CSV o PDF.</li>
            <li>Integración con inventario para conocer stock por sucursal.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


