"use client"

export default function SupplierCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Registrar proveedor</h1>
        <p className="text-sm text-gray-300">
          Completa la información de contacto, condiciones comerciales y documentación necesaria para trabajar con un nuevo
          proveedor.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          El formulario mejorado estará disponible pronto. Por ahora, utiliza el botón “Nuevo Proveedor” en el listado para
          capturar los datos básicos y asignar productos asociados.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Datos principales: razón social, NIT/CI, correo y teléfono.</li>
          <li>Dirección fiscal y dirección de entrega.</li>
          <li>Contactos comerciales y de cobranza.</li>
          <li>Condiciones de pago, tiempos de entrega y notas internas.</li>
        </ul>
      </div>
    </div>
  )
}


