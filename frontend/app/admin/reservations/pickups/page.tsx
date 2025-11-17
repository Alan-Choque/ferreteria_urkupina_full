"use client"

export default function ReservationPickupsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Entregas y retiros</h1>
        <p className="text-sm text-gray-300">
          Controla los retiros de reservas, registra quién entrega y confirma el pago restante para cerrar la operación.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Acciones planificadas</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Escanear el comprobante o buscar por código de reserva.</li>
          <li>Verificar depósito y saldo pendiente antes de entregar.</li>
          <li>Registrar responsable y observaciones.</li>
          <li>Actualizar inventario y cuentas por cobrar en tiempo real.</li>
        </ul>
      </div>
    </div>
  )
}


