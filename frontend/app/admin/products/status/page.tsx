"use client"

import Link from "next/link"

export default function ProductStatusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cambio de estado de producto</h1>
          <p className="text-sm text-gray-300">
            Activa o desactiva productos del catálogo cuando estén disponibles o deban ocultarse temporalmente.
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
        <p className="text-gray-300">
          La automatización de estado estará disponible junto al motor de inventario. Por ahora, ubica el producto en el
          listado y utiliza la acción “Activar / Inactivar” para actualizar su visibilidad en el ecommerce.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Estados disponibles</h2>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>
                <span className="font-semibold text-green-400">Activo:</span> Visible en catálogo y disponible para venta.
              </li>
              <li>
                <span className="font-semibold text-yellow-400">En revisión:</span> Oculto mientras se actualiza la ficha.
              </li>
              <li>
                <span className="font-semibold text-red-400">Inactivo:</span> Retirado temporalmente o descontinuado.
              </li>
            </ul>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Próximamente</h2>
            <p className="text-sm text-gray-300">
              El motor permitirá programar estados según stock, campañas y reglas de disponibilidad por sucursal. Te avisaremos
              cuando esté listo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


