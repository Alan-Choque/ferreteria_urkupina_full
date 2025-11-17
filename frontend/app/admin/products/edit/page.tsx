"use client"

import Link from "next/link"

export default function ProductEditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Modificar producto</h1>
          <p className="text-sm text-gray-300">
            Selecciona un producto del catálogo y aplica los cambios necesarios en sus variantes, precios o estado de
            publicación.
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
          El editor visual está en construcción. Mientras tanto, ingresa al módulo de productos, localiza el ítem usando el
          buscador y emplea la opción “Editar” para abrir la ficha detallada en el sistema actual.
        </p>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold text-white">Acciones disponibles hoy</h2>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Actualizar nombre, descripción y categoría.</li>
            <li>Agregar o eliminar variantes y configurar unidades.</li>
            <li>Ajustar precios base y promociones asociadas.</li>
            <li>Adjuntar imágenes y especificar ficha técnica.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


