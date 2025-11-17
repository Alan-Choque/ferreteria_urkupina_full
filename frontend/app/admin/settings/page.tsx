"use client"

import { useEffect, useState } from "react"
import { settingsService } from "@/lib/services/settings-service"
import { Plus, Trash2, Save } from "lucide-react"
import { motion } from "framer-motion"
import type { CompanySettings } from "@/lib/types/admin"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type TabType = "company" | "branches" | "email"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>("company")

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await settingsService.getSettings()
        setSettings(data)
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (settings) {
      try {
        await settingsService.updateSettings(settings)
        alert("Configuración guardada exitosamente")
      } catch (error) {
        console.error("Error saving settings:", error)
      }
    }
  }

  const handleAddBranch = async () => {
    if (settings) {
      const newBranch = {
        id: Math.max(...settings.branches.map((b) => b.id), 0) + 1,
        name: "Nueva Sucursal",
        address: "",
        phone: "",
        email: "",
        manager: "",
      }
      const updated = { ...settings, branches: [...settings.branches, newBranch] }
      setSettings(updated)
      try {
        await settingsService.updateSettings(updated)
      } catch (error) {
        console.error("Error adding branch:", error)
      }
    }
  }

  const handleDeleteBranch = async (branchId: number) => {
    if (confirm("¿Desea eliminar esta sucursal?") && settings) {
      const updated = { ...settings, branches: settings.branches.filter((b) => b.id !== branchId) }
      setSettings(updated)
      try {
        await settingsService.updateSettings(updated)
      } catch (error) {
        console.error("Error deleting branch:", error)
      }
    }
  }

  const handleEditBranch = (branchId: number, field: string, value: string) => {
    if (settings) {
      const updated = {
        ...settings,
        branches: settings.branches.map((b) => (b.id === branchId ? { ...b, [field]: value } : b)),
      }
      setSettings(updated)
    }
  }

  useEffect(() => {
    const value = searchParams.get("tab")
    if (value === "company" || value === "branches" || value === "email") {
      setTab(value)
    } else {
      setTab("company")
    }
  }, [searchParams])

  const changeTab = (value: TabType) => {
    setTab(value)
    router.replace(`${pathname}?tab=${value}`, { scroll: false })
  }

  if (loading) return <div className="text-gray-400">Cargando...</div>
  if (!settings) return <div className="text-gray-400">Error cargando configuración</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Save size={20} />
          Guardar Cambios
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        {(["company", "branches", "email"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-4 py-2 font-medium rounded transition-colors ${
              tab === t
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-400 hover:text-gray-100 hover:bg-gray-700/60"
            }`}
          >
            {t === "company" ? "Empresa" : t === "branches" ? "Sucursales" : "Plantillas Email"}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">Nombre Empresa</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">NIT</label>
            <input
              type="text"
              value={settings.nit}
              onChange={(e) => setSettings({ ...settings, nit: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tasa de IVA (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.taxRate * 100}
              onChange={(e) => setSettings({ ...settings, taxRate: Number.parseFloat(e.target.value) / 100 })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </motion.div>
      )}

      {tab === "branches" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {settings.branches.map((branch) => (
            <div key={branch.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={branch.name}
                  onChange={(e) => handleEditBranch(branch.id, "name", e.target.value)}
                  className="text-lg font-bold bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleSave()} className="text-gray-400 hover:text-green-400 transition-colors">
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div>
                  <span className="font-medium">Dirección:</span>
                  <input
                    type="text"
                    value={branch.address}
                    onChange={(e) => handleEditBranch(branch.id, "address", e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-red-500 mt-1"
                  />
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span>
                  <input
                    type="text"
                    value={branch.phone}
                    onChange={(e) => handleEditBranch(branch.id, "phone", e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-red-500 mt-1"
                  />
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <input
                    type="email"
                    value={branch.email}
                    onChange={(e) => handleEditBranch(branch.id, "email", e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-red-500 mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddBranch}
            className="w-full bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 text-gray-300 hover:bg-gray-700/60 hover:text-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Agregar Sucursal
          </button>
        </motion.div>
      )}
    </div>
  )
}
