"use client"

export default function FilesSharedPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Archivos compartidos</h1>
        <p className="text-sm text-gray-300">
          Consulta documentos compartidos con proveedores, clientes o colaboradores internos. Controla vigencia y permisos de
          acceso.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Características planeadas</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Links públicos con expiración automática.</li>
          <li>Historial de descargas y actividad.</li>
          <li>Categorización por módulos (compras, ventas, inventario).</li>
          <li>Integración con firmas digitales para acuerdos.</li>
        </ul>
      </div>
    </div>
  )
}


