"use client"

export default function PromotionHistoryPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Historial de promociones</h1>
        <p className="text-sm text-gray-300">
          Consulta campañas pasadas, resultados y reutiliza configuraciones exitosas en nuevos periodos.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Lo que verás pronto</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Listado de promociones finalizadas con métricas clave.</li>
          <li>Duplicado rápido de campañas exitosas.</li>
          <li>Registro de auditoría: quién creó, editó o cerró una promoción.</li>
          <li>Exportación a CSV/PDF con resultados por producto y sucursal.</li>
        </ul>
      </div>
    </div>
  )
}


