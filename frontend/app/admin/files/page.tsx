"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Trash2, Grid, List } from "lucide-react"
import { filesService, type MediaFile } from "@/lib/services/files-service"
import { motion } from "framer-motion"

export default function FilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await filesService.list({})
      setFiles(result.files)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || [])
    if (!uploadedFiles.length) return

    setLoading(true)
    try {
      const newFiles = await filesService.upload(uploadedFiles)
      setFiles([...newFiles, ...files])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFiles.size) return
    setLoading(true)
    try {
      await filesService.remove(Array.from(selectedFiles))
      setFiles(files.filter((f) => !selectedFiles.has(f.id)))
      setSelectedFiles(new Set())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestor de Archivos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => document.getElementById("file-input")?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <Upload size={18} />
            Subir Archivos
          </button>
          <input id="file-input" type="file" multiple onChange={handleUpload} className="hidden" />
          {selectedFiles.size > 0 && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition"
            >
              <Trash2 size={18} />
              Eliminar ({selectedFiles.size})
            </button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-lg transition ${
            viewMode === "grid" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"
          }`}
        >
          <Grid size={20} />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-lg transition ${
            viewMode === "list" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"
          }`}
        >
          <List size={20} />
        </button>
      </div>

      {/* Files Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                selectedFiles.has(file.id)
                  ? "border-red-600 bg-red-600/10"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
              onClick={() => {
                const newSelected = new Set(selectedFiles)
                if (newSelected.has(file.id)) {
                  newSelected.delete(file.id)
                } else {
                  newSelected.add(file.id)
                }
                setSelectedFiles(newSelected)
              }}
            >
              {file.type === "image" && (
                <img
                  src={file.previewUrl || "/placeholder.svg"}
                  alt={file.alt || file.filename}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <p className="text-sm font-medium truncate">{file.filename}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Files List */}
      {viewMode === "list" && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles(new Set(files.map((f) => f.id)))
                      } else {
                        setSelectedFiles(new Set())
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Archivo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className={`hover:bg-gray-700 transition ${selectedFiles.has(file.id) ? "bg-gray-700" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => {
                        const newSelected = new Set(selectedFiles)
                        if (newSelected.has(file.id)) {
                          newSelected.delete(file.id)
                        } else {
                          newSelected.add(file.id)
                        }
                        setSelectedFiles(newSelected)
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">{file.filename}</td>
                  <td className="px-4 py-3 text-sm uppercase">{file.type}</td>
                  <td className="px-4 py-3 text-sm">{(file.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-sm">{file.createdAt.toLocaleDateString("es-BO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
