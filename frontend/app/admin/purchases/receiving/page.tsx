"use client"

export default function PurchaseReceivingPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Recepción de mercancía</h1>
        <p className="text-sm text-gray-300">
          Controla la entrada de productos asociada a órdenes de compra, validando cantidades y estados antes de ingresar al
          inventario.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Flujo planificado</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Escanear la orden, verificar fechas y proveedor.</li>
          <li>Registrar cantidades recibidas, pendientes y rechazos.</li>
          <li>Generar acta de recepción con firma digital.</li>
          <li>Actualizar inventario y cuentas por pagar en una sola acción.</li>
        </ul>
      </div>
    </div>
  )
}


