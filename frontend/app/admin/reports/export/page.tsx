"use client"

export default function ReportsExportPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Exportar reportes</h1>
        <p className="text-sm text-gray-300">
          Genera informes personalizados en CSV o PDF para compartir resultados con tu equipo de trabajo.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          Muy pronto podrás seleccionar rangos de fechas, filtrar por sucursal y recibir los reportes directamente en tu correo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Formatos disponibles</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>CSV delimitado por comas.</li>
              <li>Excel (.xlsx) con pestañas por KPI.</li>
              <li>PDF con visualizaciones gráficas.</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-2">Automatizaciones</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Programar envíos diarios, semanales o mensuales.</li>
              <li>Compartir reportes con grupos de usuarios.</li>
              <li>Historial de exportaciones recientes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


