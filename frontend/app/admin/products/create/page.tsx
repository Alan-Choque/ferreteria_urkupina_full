"use client"

import Link from "next/link"

export default function ProductCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Registrar nuevo producto</h1>
          <p className="text-sm text-gray-300">
            Completa la información básica y asigna variantes para publicar un producto en el catálogo.
          </p>
        </div>
        <Link
          href="/admin/products/list"
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700/70 transition-colors text-sm"
        >
          Volver al listado
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4 text-white">
        <p className="text-gray-300">
          El formulario completo estará disponible cuando finalicemos la migración de atributos, variantes y medios. Mientras
          tanto, utiliza el sistema actual para registrar productos y luego sincroniza desde <span className="font-semibold">Archivo &gt; Importar</span>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Checklist previo</h2>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>Confirmar categoría y marca existentes.</li>
              <li>Preparar SKU y códigos de barras si aplica.</li>
              <li>Definir al menos una variante con unidad y precio.</li>
              <li>Revisar inventario inicial para cada almacén.</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Integración futura</h2>
            <p className="text-sm text-gray-300">
              El nuevo flujo permitirá alta masiva desde CSV, carga de imágenes drag &amp; drop y publicación inmediata en el
              ecommerce. Recibirás una notificación cuando esté disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


