"use client"

export default function InventoryRegisterPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Registrar ingreso de inventario</h1>
        <p className="text-sm text-gray-300">
          El asistente permitirá registrar compras, devoluciones y ajustes positivos de stock. Mientras tanto, usa el módulo de
          compras para impactar inventario.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Próximos pasos</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Seleccionar sucursal y almacén destino.</li>
          <li>Cargar productos escaneando código o buscando por nombre.</li>
          <li>Registrar cantidad, costo y referencia del documento.</li>
          <li>Generar comprobante y actualizar kardex automáticamente.</li>
        </ul>
      </div>
    </div>
  )
}


