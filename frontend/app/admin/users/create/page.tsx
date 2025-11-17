"use client"

export default function UserCreatePage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Crear usuario</h1>
        <p className="text-sm text-gray-300">
          El nuevo flujo permitirá invitar colaboradores, asignar roles y enviar credenciales desde un solo lugar.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          Por ahora, utiliza el botón “Nuevo usuario” en el listado para crear cuentas básicas. Luego ajusta permisos en la
          sección de roles.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Registrar datos personales y correo corporativo.</li>
          <li>Asignar rol inicial y sucursal de trabajo.</li>
          <li>Configurar autenticación de dos factores (próximamente).</li>
          <li>Enviar invitación automática por correo.</li>
        </ul>
      </div>
    </div>
  )
}


