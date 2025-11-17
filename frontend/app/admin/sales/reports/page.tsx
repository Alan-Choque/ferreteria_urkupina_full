"use client"

export default function SalesReportsPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Reportes de ventas</h1>
        <p className="text-sm text-gray-300">
          Analiza el desempeño comercial por período, canal y vendedor. El dashboard final estará alineado con Power BI.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Indicadores principales</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Ventas netas, margen y ticket promedio.</li>
          <li>Top productos, categorías y proveedores.</li>
          <li>Metas vs cumplimiento por sucursal y vendedor.</li>
          <li>Comparativo interanual y pronósticos.</li>
        </ul>
      </div>
    </div>
  )
}


