"use client"

export default function InventoryAdjustmentsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Ajustes de stock</h1>
        <p className="text-sm text-gray-300">
          Registra diferencias de inventario producto de conteos, merma, obsolescencia o regularizaciones manuales.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Tipos de ajuste contemplados</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Ajustes positivos/negativos desde conteos cíclicos.</li>
          <li>Regularización por devoluciones y garantías.</li>
          <li>Bajas por daños, pérdida o caducidad.</li>
          <li>Integración con contabilidad para respaldar movimientos.</li>
        </ul>
      </div>
    </div>
  )
}


