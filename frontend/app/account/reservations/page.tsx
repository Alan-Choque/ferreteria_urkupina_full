"use client"

interface Reservation {
  id: string
  product: string
  quantity: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  deposit: number
  depositDate: string
}

export default function ReservationsPage() {
  const reservations: Reservation[] = [
    {
      id: "RES-001",
      product: "Taladro Bosch GSB 20-2",
      quantity: 2,
      status: "pending",
      deposit: 50000,
      depositDate: "2024-11-15",
    },
    {
      id: "RES-002",
      product: "Esmeril Angular Bosch",
      quantity: 1,
      status: "confirmed",
      deposit: 75000,
      depositDate: "2024-11-10",
    },
  ]

  const statusLabel = {
    pending: "Depósito Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  }

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mis Reservaciones</h2>

      {reservations.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600">No tienes reservaciones aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div key={res.id} className="p-4 border border-neutral-200 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-neutral-900">{res.id}</h3>
                  <p className="text-sm text-neutral-600">{res.product}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-bold ${statusColor[res.status]}`}>
                  {statusLabel[res.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-neutral-600">Cantidad:</span>
                  <p className="font-bold text-neutral-900">{res.quantity} unidad(es)</p>
                </div>
                <div>
                  <span className="text-neutral-600">Depósito:</span>
                  <p className="font-bold text-neutral-900">Bs. {res.deposit.toLocaleString("es-BO")}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Fecha:</span>
                  <p className="font-bold text-neutral-900">{new Date(res.depositDate).toLocaleDateString("es-BO")}</p>
                </div>
              </div>

              <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">
                Ver Detalles
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
