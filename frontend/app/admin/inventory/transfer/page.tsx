"use client"

export default function InventoryTransferPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Transferencias entre almacenes</h1>
        <p className="text-sm text-gray-300">
          Controla el movimiento de stock entre sucursales y almacenes internos. La automatización se habilitará en la próxima
          fase del proyecto.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Qué podrás hacer</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Elegir almacén origen y destino con disponibilidad en tiempo real.</li>
          <li>Validar picking y recepción con responsables asignados.</li>
          <li>Documentar transporte y observaciones en cada movimiento.</li>
          <li>Impactar kardex y costos promedio automáticamente.</li>
        </ul>
      </div>
    </div>
  )
}


