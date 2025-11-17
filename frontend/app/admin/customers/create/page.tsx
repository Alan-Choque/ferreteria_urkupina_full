"use client"

export default function CustomerCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Registrar cliente</h1>
        <p className="text-sm text-gray-300">
          El nuevo formulario permitirá capturar datos fiscales, direcciones, preferencias y adjuntar documentación relevante.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          Usa el botón “Nuevo Cliente” del listado para guardar registros básicos. Más adelante podrás agregar múltiples
          direcciones, contactos y configurar listas de precios personalizadas.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Identificación (CI, NIT o pasaporte).</li>
          <li>Información de contacto: correo, teléfono y dirección.</li>
          <li>Notas internas y seguimiento comercial.</li>
          <li>Asignación de listas de precios y condiciones de crédito.</li>
        </ul>
      </div>
    </div>
  )
}


