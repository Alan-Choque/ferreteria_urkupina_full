"use client"

export default function PromotionCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Crear promoción</h1>
        <p className="text-sm text-gray-300">
          Diseña campañas con reglas flexibles: descuentos, combos, happy hours y promociones por cliente.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          Actualmente puedes registrar promociones desde el listado (botón “Nueva Promoción”). El constructor avanzado llegará
          con la integración al ecommerce.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Programar vigencia, público objetivo y canales.</li>
          <li>Aplicar reglas por montos, unidades o mix de productos.</li>
          <li>Definir beneficios: descuentos, cupones, regalos.</li>
          <li>Simular impacto y exportar resultados.</li>
        </ul>
      </div>
    </div>
  )
}


