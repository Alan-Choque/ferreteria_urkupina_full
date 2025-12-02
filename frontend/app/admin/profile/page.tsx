"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, User, Mail, Shield, MapPin, Edit2 } from "lucide-react"
import { authService } from "@/lib/services/auth-service"
import type { AdminUser } from "@/lib/types/admin"

export default function ProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          setCurrentUser(user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error loading user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [router])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--admin-surface-light)" }}>
        <div style={{ color: "var(--admin-text-primary)" }}>Cargando...</div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: "var(--admin-surface-medium)",
            color: "var(--admin-text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--admin-surface-light)"
            e.currentTarget.style.color = "var(--admin-text-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
            e.currentTarget.style.color = "var(--admin-text-secondary)"
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>
            Mi Perfil
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
            Información de tu cuenta de administrador
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-6"
        style={{
          backgroundColor: "var(--admin-surface-light)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--admin-text-primary)" }}>
              Información Personal
            </h2>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--admin-surface-medium)" }}>
                <User size={20} style={{ color: "var(--admin-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                  Nombre completo
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                  {currentUser.name || "No disponible"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--admin-surface-medium)" }}>
                <Mail size={20} style={{ color: "var(--admin-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                  Correo electrónico
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                  {currentUser.email || "No disponible"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--admin-surface-medium)" }}>
                <Shield size={20} style={{ color: "var(--admin-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                  Rol
                </p>
                <span
                  className="inline-block px-3 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: "var(--admin-primary)",
                    color: "#FFFFFF",
                  }}
                >
                  {currentUser.role || "No disponible"}
                </span>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--admin-text-primary)" }}>
              Información Adicional
            </h2>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--admin-surface-medium)" }}>
                <MapPin size={20} style={{ color: "var(--admin-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                  Sucursal
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                  {(currentUser as any).branch || "No asignada"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--admin-surface-medium)" }}>
                <Shield size={20} style={{ color: currentUser.active ? "var(--admin-success)" : "var(--admin-error)" }} />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                  Estado
                </p>
                <span
                  className="inline-block px-3 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: currentUser.active ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: currentUser.active ? "var(--admin-success)" : "var(--admin-error)",
                  }}
                >
                  {currentUser.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--admin-border)" }}>
          <button
            onClick={() => router.push("/admin/users?action=edit")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--admin-primary)",
              color: "#FFFFFF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1"
            }}
          >
            <Edit2 size={16} />
            Editar Perfil
          </button>
        </div>
      </motion.div>
    </div>
  )
}

