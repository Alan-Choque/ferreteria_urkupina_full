"use client"

export default function UserImportPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Importar usuarios</h1>
        <p className="text-sm text-gray-300">
          Carga colaboradores de forma masiva desde un archivo CSV o integra tus datos con el directorio corporativo.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Requisitos de la plantilla</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>nombre, apellido, correo, rol, sucursal.</li>
          <li>Opcional: documento, teléfono, fecha de ingreso.</li>
          <li>Formato CSV en UTF-8, delimitado por comas.</li>
        </ul>
        <p className="text-sm text-gray-300">
          El importador se lanzará junto al módulo de auditoría. Recibirás un aviso cuando esté listo para usar.
        </p>
      </div>
    </div>
  )
}


