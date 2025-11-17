"use client"

export default function FilesUploadPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Subir archivos</h1>
        <p className="text-sm text-gray-300">
          Arrastra imágenes, manuales o documentos contables para compartirlos con otros módulos del sistema.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-gray-300">
          Estamos habilitando el repositorio central junto a un servicio de almacenamiento seguro. Mientras tanto, continúa
          utilizando el gestor actual y sincroniza semanalmente.
        </p>
        <div className="border-2 border-dashed border-gray-600 rounded-lg h-48 flex items-center justify-center text-gray-400">
          Zona de carga drag &amp; drop (en construcción)
        </div>
      </div>
    </div>
  )
}


