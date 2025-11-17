"use client"

export default function PurchaseReportsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Reportes de compras</h1>
        <p className="text-sm text-gray-300">
          Analiza el comportamiento de proveedores, tiempos de entrega y evolución de costos. Los tableros interactivos estarán
          disponibles cuando se publiquen los pipelines de BI.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">KPIs previstos</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Compras vs presupuesto por período y sucursal.</li>
          <li>Niveles de cumplimiento por proveedor y categoría.</li>
          <li>Evolución de costos promedio y descuentos aplicados.</li>
          <li>Órdenes abiertas, parcialmente recibidas y cerradas.</li>
        </ul>
      </div>
    </div>
  )
}


