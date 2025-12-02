"use client"

import { useEffect, useState } from "react"
import { settingsService } from "@/lib/services/settings-service"
import { authService } from "@/lib/services/auth-service"
import { Plus, Trash2, Save, User, Mail, Shield, MapPin, Edit2, Database, AlertTriangle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import type { CompanySettings } from "@/lib/types/admin"
import type { AdminUser } from "@/lib/types/admin"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMockData } from "@/lib/hooks/useMockData"
import { api } from "@/lib/apiClient"

// Colores del diseño CRM
const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

type TabType = "profile" | "company" | "branches" | "email" | "development"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>("profile")
  const { enabled: mockDataEnabled, toggleMockData } = useMockData()
  const [mockDataInDB, setMockDataInDB] = useState(false)
  const [loadingMockDB, setLoadingMockDB] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, userData] = await Promise.all([
          settingsService.getSettings(),
          authService.getCurrentUser().catch(() => null)
        ])
        setSettings(settingsData)
        setCurrentUser(userData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Verificar estado de datos mock en BD
  useEffect(() => {
    const checkMockDataStatus = async () => {
      try {
        const status = await api.get<{ has_mock_data: boolean; counts: any }>("/admin/mock-data/status")
        setMockDataInDB(status.has_mock_data)
      } catch (error) {
        console.error("Error checking mock data status:", error)
      } finally {
        setCheckingStatus(false)
      }
    }
    checkMockDataStatus()
  }, [])

  const handleInsertMockData = async () => {
    const mockDataEnabled = localStorage.getItem("mockDataEnabled") === "true"
    const confirmMessage = mockDataEnabled
      ? "⚠️ IMPORTANTE: Tienes activado el toggle de 'Datos Mock en Frontend'. Los datos insertados en la BD NO se mostrarán mientras esté activado.\n\n¿Deseas continuar insertando datos en la BD? (Recomendado: Desactiva primero el toggle de Frontend)"
      : "¿Insertar datos de prueba en la base de datos? Esto creará usuarios, clientes, productos y otros registros de prueba realistas."
    
    if (!confirm(confirmMessage)) {
      return
    }
    setLoadingMockDB(true)
    try {
      const result = await api.post<{ message: string; inserted: any }>("/admin/mock-data/insert")
      const message = `✅ Datos insertados exitosamente:\n\n` +
        `• ${result.inserted.users} usuarios\n` +
        `• ${result.inserted.customers} clientes\n` +
        `• ${result.inserted.suppliers} proveedores\n` +
        `• ${result.inserted.products} productos\n` +
        `• ${result.inserted.variants} variantes\n` +
        `• ${result.inserted.sales} órdenes de venta\n` +
        `• ${result.inserted.purchases} órdenes de compra\n\n` +
        (mockDataEnabled 
          ? "⚠️ RECUERDA: Desactiva el toggle 'Datos Mock en Frontend' para ver estos datos en el sistema."
          : "Los datos ya están disponibles en el sistema.")
      alert(message)
      setMockDataInDB(true)
    } catch (error: any) {
      console.error("Error inserting mock data:", error)
      const errorMessage = error?.detail || error?.message || "Error desconocido"
      alert(`❌ Error al insertar datos de prueba:\n\n${errorMessage}`)
    } finally {
      setLoadingMockDB(false)
    }
  }

  const handleRemoveMockData = async () => {
    if (!confirm("¿Eliminar todos los datos de prueba de la base de datos? Esta acción no se puede deshacer.")) {
      return
    }
    setLoadingMockDB(true)
    try {
      const result = await api.delete<{ message: string; removed: any }>("/admin/mock-data/remove")
      alert(`Datos eliminados: ${result.removed.users} usuarios, ${result.removed.customers} clientes`)
      setMockDataInDB(false)
    } catch (error) {
      console.error("Error removing mock data:", error)
      alert("Error al eliminar datos de prueba")
    } finally {
      setLoadingMockDB(false)
    }
  }

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
    if (value === "profile" || value === "company" || value === "branches" || value === "email" || value === "development") {
      setTab(value)
    } else {
      setTab("profile")
    }
  }, [searchParams])

  const changeTab = (value: TabType) => {
    setTab(value)
    router.replace(`${pathname}?tab=${value}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: PURPLE_COLORS.primary }}></div>
      </div>
    )
  }
  if (!settings) {
    return (
      <div className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
        <p className="text-sm" style={{ color: "#EF4444" }}>Error cargando configuración</p>
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{ color: "var(--admin-text-primary)" }}>
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Configuración</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona la configuración del sistema y datos de prueba
        </p>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: "#EDE9FE" }}>
        {(["profile", "company", "branches", "email", "development"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              tab === t
                ? "text-white border-b-2"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
            style={tab === t ? { 
              backgroundColor: PURPLE_COLORS.primary,
              borderBottomColor: PURPLE_COLORS.primary 
            } : {}}
          >
            {t === "profile" ? "Perfil" : 
             t === "company" ? "Empresa" : 
             t === "branches" ? "Sucursales" : 
             t === "email" ? "Plantillas Email" : 
             "Datos de Prueba"}
          </button>
        ))}
      </div>

      {tab === "profile" && currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 space-y-6"
          style={{ borderColor: "#EDE9FE" }}
        >
          <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: "#EDE9FE" }}>
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: PURPLE_COLORS.primary }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>{currentUser.name}</h2>
              <p style={{ color: "var(--admin-text-secondary)" }}>{currentUser.email}</p>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-tertiary)" }}>Rol: {currentUser.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2" style={{ color: PURPLE_COLORS.dark }}>
                <User size={20} />
                <h3 className="font-semibold">Información Personal</h3>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Nombre</label>
                <input
                  type="text"
                  value={currentUser.name}
                  readOnly
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--admin-surface-medium)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  readOnly
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--admin-surface-medium)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Rol</label>
                <input
                  type="text"
                  value={currentUser.role}
                  readOnly
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--admin-surface-medium)",
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text-primary)",
                  }}
                />
              </div>
              {currentUser.branch && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Sucursal</label>
                  <input
                    type="text"
                    value={currentUser.branch}
                    readOnly
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text-primary)",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2" style={{ color: PURPLE_COLORS.dark }}>
                <Shield size={20} />
                <h3 className="font-semibold">Estado de Cuenta</h3>
              </div>
              <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: PURPLE_COLORS.accent }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--admin-text-secondary)" }}>Estado</span>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: currentUser.active ? "#D1FAE5" : "#FEE2E2",
                      color: currentUser.active ? "#065F46" : "#991B1B",
                      border: `1px solid ${currentUser.active ? "#10B981" : "#EF4444"}`,
                    }}
                  >
                    {currentUser.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {currentUser.createdAt && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--admin-text-secondary)" }}>Fecha de Registro</span>
                    <span style={{ color: "var(--admin-text-primary)" }}>
                      {new Date(currentUser.createdAt).toLocaleDateString("es-BO")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "profile" && !currentUser && !loading && (
        <div className="rounded-xl shadow-sm bg-white border p-6 text-center" style={{ borderColor: "#EDE9FE" }}>
          <p style={{ color: "var(--admin-text-tertiary)" }}>No se pudo cargar la información del perfil</p>
        </div>
      )}

      {tab === "company" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 space-y-4"
          style={{ borderColor: "#EDE9FE" }}
        >
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Nombre Empresa</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Dirección</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>NIT</label>
            <input
              type="text"
              value={settings.nit}
              onChange={(e) => setSettings({ ...settings, nit: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>Tasa de IVA (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.taxRate * 100}
              onChange={(e) => setSettings({ ...settings, taxRate: Number.parseFloat(e.target.value) / 100 })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-white font-medium"
              style={{ backgroundColor: PURPLE_COLORS.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = PURPLE_COLORS.dark
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = PURPLE_COLORS.primary
              }}
            >
              <Save size={18} />
              Guardar Cambios
            </button>
          </div>
        </motion.div>
      )}

      {tab === "branches" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {settings.branches.map((branch) => (
            <div key={branch.id} className="rounded-xl shadow-sm bg-white border p-6" style={{ borderColor: "#EDE9FE" }}>
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={branch.name}
                  onChange={(e) => handleEditBranch(branch.id, "name", e.target.value)}
                  className="text-lg font-bold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: "var(--admin-surface-medium)",
                    border: "1px solid var(--admin-border)",
                    color: PURPLE_COLORS.dark,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--admin-border)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSave()} 
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#10B981" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ECFDF5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "#EF4444" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEE2E2"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium mb-1.5 block" style={{ color: "var(--admin-text-secondary)" }}>Dirección</span>
                  <input
                    type="text"
                    value={branch.address}
                    onChange={(e) => handleEditBranch(branch.id, "address", e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--admin-border)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-medium mb-1.5 block" style={{ color: "var(--admin-text-secondary)" }}>Teléfono</span>
                  <input
                    type="text"
                    value={branch.phone}
                    onChange={(e) => handleEditBranch(branch.id, "phone", e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--admin-border)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-medium mb-1.5 block" style={{ color: "var(--admin-text-secondary)" }}>Email</span>
                  <input
                    type="email"
                    value={branch.email}
                    onChange={(e) => handleEditBranch(branch.id, "email", e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text-primary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = PURPLE_COLORS.primary
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${PURPLE_COLORS.primary}20`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--admin-border)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddBranch}
            className="w-full rounded-xl border-2 border-dashed p-4 transition-colors flex items-center justify-center gap-2"
            style={{ 
              borderColor: PURPLE_COLORS.light,
              backgroundColor: PURPLE_COLORS.accent,
              color: PURPLE_COLORS.dark,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = PURPLE_COLORS.primary
              e.currentTarget.style.backgroundColor = PURPLE_COLORS.light
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = PURPLE_COLORS.light
              e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent
            }}
          >
            <Plus size={20} />
            Agregar Sucursal
          </button>
        </motion.div>
      )}

      {tab === "development" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-sm bg-white border p-6 space-y-6"
          style={{ borderColor: "#EDE9FE" }}
        >
          <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "#EDE9FE" }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: PURPLE_COLORS.accent }}>
              <Database size={24} style={{ color: PURPLE_COLORS.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: PURPLE_COLORS.dark }}>Datos de Prueba</h2>
              <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>Activa datos mock para desarrollo y demostración</p>
            </div>
          </div>

          <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}>
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold mb-1" style={{ color: "#92400E" }}>⚠️ Advertencia</p>
              <p style={{ color: "#78350F" }}>
                Los datos de prueba son solo para desarrollo y demostración. Cuando estén activados, 
                las gráficas y estadísticas mostrarán información falsa. Desactívalos antes de usar 
                el sistema en producción.
              </p>
            </div>
          </div>

          {/* Toggle para datos mock en memoria */}
          <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: PURPLE_COLORS.accent }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: PURPLE_COLORS.dark }}>Datos Mock en Memoria</h3>
                <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                  {mockDataEnabled 
                    ? "Los datos mock están activados. Las gráficas mostrarán información de prueba."
                    : "Los datos mock están desactivados. Se mostrarán datos reales de la base de datos."}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(
                    mockDataEnabled 
                      ? "¿Desactivar datos de prueba? Esto recargará la página y mostrará datos reales."
                      : "¿Activar datos de prueba? Esto recargará la página y mostrará datos falsos para desarrollo."
                  )) {
                    toggleMockData()
                  }
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  mockDataEnabled ? "" : "bg-gray-300"
                }`}
                style={mockDataEnabled ? { backgroundColor: PURPLE_COLORS.primary } : {}}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    mockDataEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {mockDataEnabled && (
              <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: PURPLE_COLORS.light }}>
                <div className="rounded-lg p-3" style={{ backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#991B1B" }}>⚠️ IMPORTANTE</p>
                  <p className="text-xs" style={{ color: "#7F1D1D" }}>
                    Con este toggle activado, el sistema mostrará datos mock del frontend en lugar de los datos reales de la base de datos. 
                    Si insertaste datos en la BD, desactiva este toggle para verlos.
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: PURPLE_COLORS.dark }}>Datos de prueba incluyen:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: "var(--admin-text-secondary)" }}>
                    <li>5 órdenes de venta de ejemplo</li>
                    <li>Resumen de reportes con datos simulados</li>
                    <li>5 usuarios de prueba</li>
                    <li>4 clientes de ejemplo</li>
                    <li>5 productos de muestra</li>
                    <li>Gráficas con datos realistas</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sección para insertar/eliminar datos en BD */}
          <div className="rounded-lg p-6 space-y-4 border" style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }}>
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: PURPLE_COLORS.dark }}>Datos de Prueba en Base de Datos</h3>
              <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                Inserta datos de prueba directamente en la base de datos para que las gráficas muestren información real.
                Puedes eliminarlos después fácilmente.
              </p>
            </div>

            {checkingStatus ? (
              <div className="flex items-center gap-2" style={{ color: "var(--admin-text-secondary)" }}>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Verificando estado...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "white" }}>
                <div>
                  <p className="font-medium mb-1" style={{ color: "var(--admin-text-primary)" }}>
                    Estado: {mockDataInDB ? "Datos de prueba presentes" : "Sin datos de prueba"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
                    {mockDataInDB 
                      ? "Hay datos de prueba en la base de datos. Puedes eliminarlos cuando ya no los necesites."
                      : "No hay datos de prueba en la base de datos. Puedes insertarlos para pruebas."}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!mockDataInDB ? (
                    <button
                      onClick={handleInsertMockData}
                      disabled={loadingMockDB}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: "#10B981" }}
                      onMouseEnter={(e) => {
                        if (!loadingMockDB) e.currentTarget.style.backgroundColor = "#059669"
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingMockDB) e.currentTarget.style.backgroundColor = "#10B981"
                      }}
                    >
                      {loadingMockDB ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Insertando...
                        </>
                      ) : (
                        <>
                          <Database size={16} />
                          Insertar en BD
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleRemoveMockData}
                      disabled={loadingMockDB}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: "#EF4444" }}
                      onMouseEnter={(e) => {
                        if (!loadingMockDB) e.currentTarget.style.backgroundColor = "#DC2626"
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingMockDB) e.currentTarget.style.backgroundColor = "#EF4444"
                      }}
                    >
                      {loadingMockDB ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Eliminar de BD
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {mockDataInDB && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                <p className="text-sm mb-2 font-medium" style={{ color: PURPLE_COLORS.dark }}>Datos insertados en BD:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                  <div>• 10 Usuarios de prueba</div>
                  <div>• 30 Clientes de prueba</div>
                  <div>• 15 Proveedores de prueba</div>
                  <div>• 50 Productos con variantes</div>
                  <div>• 80 Órdenes de venta</div>
                  <div>• 40 Órdenes de compra</div>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--admin-text-tertiary)" }}>
                  Estos datos aparecerán en las gráficas y listados del sistema. Las órdenes están distribuidas en los últimos 90 días.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
