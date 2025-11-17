"use client"

export default function SupplierImportPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Importar proveedores</h1>
        <p className="text-sm text-gray-300">
          Carga masivamente proveedores desde una plantilla CSV o Excel. Valida la información antes de integrarla con compras.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Formato esperado</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Nombre, NIT/CI, correo principal, teléfono y dirección.</li>
          <li>Datos opcionales: contacto comercial, crédito autorizado, notas.</li>
          <li>Guarda el archivo en UTF-8 y separa columnas con coma o punto y coma.</li>
        </ul>
        <p className="text-sm text-gray-300">
          El importador se encuentra en desarrollo. Recibirás una notificación cuando el flujo esté disponible dentro del
          sistema.
        </p>
      </div>
    </div>
  )
}


