"use client"

export default function ReservationCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Registrar reserva</h1>
        <p className="text-sm text-gray-300">
          Reserva productos para clientes y asegura disponibilidad por un tiempo determinado. La integración completa se
          habilitará con el módulo de caja.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Flujo planeado</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Buscar cliente y productos disponibles.</li>
          <li>Definir fecha límite, depósito y sucursal de entrega.</li>
          <li>Generar comprobante con QR para retiro rápido.</li>
          <li>Notificar vencimientos y liberar stock automáticamente.</li>
        </ul>
      </div>
    </div>
  )
}


