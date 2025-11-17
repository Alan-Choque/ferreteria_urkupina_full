"use client"

export default function CustomerImportPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Importar clientes</h1>
        <p className="text-sm text-gray-300">
          Carga tu cartera de clientes desde un archivo CSV/Excel. El asistente validará duplicados y campos obligatorios antes
          de guardar.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Plantilla sugerida</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>nombre, nit_ci, correo, telefono, direccion.</li>
          <li>Campos opcionales: lista_precio, notas, vendedor asignado.</li>
          <li>Utiliza UTF-8 y delimita por comas. Descarga de ejemplo disponible pronto.</li>
        </ul>
        <p className="text-sm text-gray-300">
          Hasta que el proceso esté activo, mantén tus importaciones desde el sistema anterior y sincroniza semanalmente.
        </p>
      </div>
    </div>
  )
}


