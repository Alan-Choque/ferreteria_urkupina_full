"use client"

export default function UserRolesPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Gestión de roles y permisos</h1>
        <p className="text-sm text-gray-300">
          Define qué módulos puede ver cada usuario y qué acciones puede realizar dentro del sistema administrativo.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          El editor granular estará disponible pronto. Mientras tanto, mantén los perfiles actualizados desde la opción “Editar”
          del módulo de usuarios.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Roles base: Administrador, Supervisor, Ventas, Inventario.</li>
          <li>Permisos específicos por módulo (lectura, edición, aprobación).</li>
          <li>Historial de cambios y auditoría de accesos.</li>
          <li>Sincronización con autenticación SSO (futuro).</li>
        </ul>
      </div>
    </div>
  )
}


