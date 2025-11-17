"use client"

export default function SalesCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Registrar venta manual</h1>
        <p className="text-sm text-gray-300">
          Integraremos un punto de venta ligero para registrar ventas especiales, pedidos telefónicos o apartados.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Características previstas</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Búsqueda rápida de productos y clientes.</li>
          <li>Aplicación de promociones, cupones y reservas.</li>
          <li>Registro de pagos mixtos y emisión de comprobantes.</li>
          <li>Sincronización automática con inventario y cuentas por cobrar.</li>
        </ul>
        <p className="text-sm text-gray-300">
          Hasta entonces, registra las ventas desde el sistema principal y revisa el historial en la sección &ldquo;Ventas /
          Órdenes&rdquo;.
        </p>
      </div>
    </div>
  )
}


