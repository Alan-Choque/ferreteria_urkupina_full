"use client"

export default function PurchaseCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Nueva orden de compra</h1>
        <p className="text-sm text-gray-300">
          El asistente guiado permitirá seleccionar proveedor, agregar ítems y enviar órdenes con un clic. Se habilitará cuando
          finalicemos la integración con inventario y cuentas por pagar.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">En la próxima versión podrás</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Importar ítems desde el catálogo filtrando por proveedor.</li>
          <li>Definir fechas de entrega por sucursal y condiciones de pago.</li>
          <li>Enviar órdenes por correo con plantillas personalizadas.</li>
          <li>Generar recepción parcial o total directamente desde la orden.</li>
        </ul>
      </div>
    </div>
  )
}


