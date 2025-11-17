"use client"

export default function ReservationReportsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Reportes de reservas</h1>
        <p className="text-sm text-gray-300">
          Analiza reservas activas, vencidas y canceladas. Identifica productos con mayor demanda y planifica la reposición.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Métricas previstas</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Reservas por estado y sucursal.</li>
          <li>Productos más reservados por temporada.</li>
          <li>Clientes con mayor recurrencia.</li>
          <li>Depósitos pendientes vs convertidos en venta.</li>
        </ul>
      </div>
    </div>
  )
}


