"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Grid, List, Loader2, Printer, Trash2, Upload, ArrowLeft, Share2, FolderPlus, CheckCircle, X } from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { filesService, type MediaFile } from "@/lib/services/files-service"

export default function FilesPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/files" || pathname === "/admin/files/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(getActionFromPath())
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])
  
  const [files, setFiles] = useState<MediaFile[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "library",
        label: "Biblioteca",
        description: "Explora, filtra y descarga los archivos disponibles.",
        status: "disponible",
        icon: <Grid className="h-5 w-5" />,
      },
      {
        id: "upload",
        label: "Subir archivos",
        description: "Carga documentos, imágenes o manuales para tu equipo.",
        status: "disponible",
        icon: <Upload className="h-5 w-5" />,
      },
      {
        id: "shared",
        label: "Compartidos",
        description: "Gestiona enlaces compartidos y fechas de caducidad.",
        status: "disponible",
        icon: <Share2 className="h-5 w-5" />,
      },
      {
        id: "collections",
        label: "Colecciones",
        description: "Organiza archivos en carpetas temáticas (próximamente).",
        status: "disponible",
        icon: <FolderPlus className="h-5 w-5" />,
      },
      {
        id: "print",
        label: "Imprimir catálogo",
        description: "Genera un PDF con el listado actual de archivos.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
        onClick: () => window.print(),
      },
    ],
    [],
  )

  // Cargar datos cuando cambia la acción
  useEffect(() => {
    if (selectedAction === "library") {
      void loadFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await filesService.list({})
      setFiles(result.files)
    } catch (err) {
      console.error("Error cargando archivos", err)
      // Si el error es 500 o el endpoint no existe, mostrar un mensaje más amigable
      const errorMessage = err instanceof Error 
        ? (err.message.includes("500") || err.message.includes("Internal Server Error")
          ? "El servicio de archivos no está disponible en este momento. Por favor, intenta más tarde."
          : err.message)
        : "No se pudieron cargar los archivos"
      setError(errorMessage)
      // No establecer archivos vacíos, mantener el estado anterior si existe
      if (files.length === 0) {
        setFiles([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (input: HTMLInputElement | null) => {
    if (!input?.files?.length) return
    const uploadedFiles = Array.from(input.files)
    setLoading(true)
    try {
      const newFiles = await filesService.upload(uploadedFiles)
      setFiles((prev) => [...newFiles, ...prev])
      setSelectedAction("library")
    } catch (err) {
      console.error("Error subiendo archivos", err)
    } finally {
      setLoading(false)
      input.value = ""
    }
  }

  const handleDelete = async () => {
    if (!selectedFiles.size) return
    setLoading(true)
    try {
      await filesService.remove(Array.from(selectedFiles))
      setFiles((prev) => prev.filter((file) => !selectedFiles.has(file.id)))
      setSelectedFiles(new Set())
    } catch (err) {
      console.error("Error eliminando archivos", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map((file) => file.id)))
    }
  }

  const renderLibrary = () => (
    <motion.div
      key="files-library"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-300"}`}
            aria-label="Vista en cuadrícula"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-300"}`}
            aria-label="Vista en lista"
          >
            <List size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadFiles()}
            disabled={loading}
            className="rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
          </button>
          {selectedFiles.size > 0 && (
            <button
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
            >
              <Trash2 size={16} /> Eliminar ({selectedFiles.size})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center text-gray-300">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-3 text-sm">Cargando biblioteca...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-center text-gray-300">
          No hay archivos cargados todavía. Usa "Subir archivos" para comenzar.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-lg border p-4 transition ${selectedFiles.has(file.id) ? "border-orange-500 bg-orange-600/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}
              onClick={() => toggleSelection(file.id)}
            >
              {file.type === "image" ? (
                <img
                  src={file.previewUrl || "/placeholder.svg"}
                  alt={file.alt || file.filename}
                  className="mb-3 h-32 w-full rounded-md object-cover"
                />
              ) : (
                <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-gray-900 text-sm text-gray-400">
                  {file.type.toUpperCase()}
                </div>
              )}
              <p className="truncate text-sm font-semibold text-gray-100" title={file.filename}>
                {file.filename}
              </p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-800">
          <table className="w-full text-sm text-gray-200">
            <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left">Archivo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Tamaño</th>
                <th className="px-4 py-3 text-left">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {files.map((file) => (
                <tr key={file.id} className={selectedFiles.has(file.id) ? "bg-gray-700/70" : "hover:bg-gray-700/40"}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleSelection(file.id)}
                    />
                  </td>
                  <td className="px-4 py-3">{file.filename}</td>
                  <td className="px-4 py-3 uppercase text-gray-300">{file.type}</td>
                  <td className="px-4 py-3 text-gray-300">{(file.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-gray-400">{file.createdAt.toLocaleDateString("es-BO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  const renderUploadInfo = () => (
    <motion.div
      key="files-upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Subir nuevos archivos</h3>
      <p className="text-sm text-gray-300">
        Selecciona archivos desde tu computadora o haz clic en el botón principal para elegir múltiples archivos.
      </p>
      <p className="text-sm text-gray-300">
        Tipos soportados: imágenes (JPG, PNG, WEBP), PDF, documentos de Office y archivos comprimidos. Cada archivo debe
        pesar menos de 25 MB.
      </p>
      <button
        onClick={() => document.getElementById("file-input")?.click()}
        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
      >
        <Upload size={16} /> Elegir archivos
      </button>
      <input
        id="file-input"
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleUpload(event.target)}
      />
    </motion.div>
  )

  const renderSharedInfo = () => (
    <motion.div
      key="files-shared"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Archivos compartidos</h3>
      <p className="text-sm text-gray-300">
        Próximamente podrás generar enlaces temporales, definir expiraciones y proteger descargas con contraseña.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-300">
        <li>Define la vigencia de cada enlace compartido.</li>
        <li>Restringe descargas con tokens o contraseñas.</li>
        <li>Consulta el historial de accesos y revoca permisos al instante.</li>
      </ul>
    </motion.div>
  )

  const renderCollectionsInfo = () => (
    <motion.div
      key="files-collections"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Colecciones de archivos</h3>
      <p className="text-sm text-gray-300">
        Estamos planificando carpetas temáticas para agrupar materiales (manuales, fichas de productos, campañas, etc.).
      </p>
      <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-300">
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Carpetas dinámicas</p>
          <p className="text-xs text-gray-400">Agrupa por categoría, campaña o público objetivo.</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
          <p className="font-semibold text-white">Compartir colecciones</p>
          <p className="text-xs text-gray-400">Genera enlaces que incluyan múltiples archivos a la vez.</p>
        </div>
      </div>
    </motion.div>
  )

  const renderPrintInfo = () => (
    <motion.div
      key="files-print"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6 text-white"
    >
      <h3 className="text-lg font-semibold">Imprimir catálogo de archivos</h3>
      <p className="text-sm text-gray-300">
        Usa <span className="font-semibold text-white">Ctrl + P</span> (o <span className="font-semibold text-white">⌘ + P</span>) para generar un PDF con el listado actual.
      </p>
      <p className="text-xs text-gray-400">Recomendación: filtra desde la vista "Biblioteca" antes de imprimir.</p>
    </motion.div>
  )

  const renderEmptyState = () => (
    <motion.div
      key="files-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para gestionar tus archivos.
    </motion.div>
  )

  // Renderizar dashboard de archivos
  const renderDashboard = () => {
    const totalFiles = files.length
    const imageFiles = files.filter(f => f.type === "image").length
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg p-6"
            style={{
              backgroundColor: "var(--admin-surface-light)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                  Total Archivos
                </p>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--admin-text-primary)" }}>
                  {totalFiles}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--admin-primary)" }}>
                <List size={24} color="#FFFFFF" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg p-6"
            style={{
              backgroundColor: "var(--admin-surface-light)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                  Imágenes
                </p>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--admin-success)" }}>
                  {imageFiles}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--admin-success)" }}>
                <Grid size={24} color="#FFFFFF" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg p-6"
            style={{
              backgroundColor: "var(--admin-surface-light)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                  Espacio Usado
                </p>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--admin-accent)" }}>
                  {sizeInMB} MB
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--admin-accent)" }}>
                <Upload size={24} color="#FFFFFF" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const renderContent = () => {
    if (selectedAction === null) {
      return renderDashboard()
    }
    
    switch (selectedAction) {
      case "library":
        return renderLibrary()
      case "upload":
        return renderUploadInfo()
      case "shared":
        return renderSharedInfo()
      case "print":
        return renderPrintInfo()
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Archivos</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona tus archivos, imágenes y documentos
        </p>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      <input
        id="file-input-refresh"
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleUpload(event.target)}
      />

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
    </div>
  )
}
