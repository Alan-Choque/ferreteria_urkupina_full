"use client"

export default function SalesPaymentsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Pagos y cobranzas</h1>
        <p className="text-sm text-gray-300">
          Controla los pagos recibidos, saldos pendientes y conciliaciones. La vista estará enlazada con cuentas por cobrar y
          caja.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Próximamente podrás</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Registrar abonos parciales y métodos de pago combinados.</li>
          <li>Aplicar notas de crédito y devoluciones.</li>
          <li>Generar estados de cuenta por cliente.</li>
          <li>Exportar reportes para conciliación bancaria.</li>
        </ul>
      </div>
    </div>
  )
}


