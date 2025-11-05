"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogOut, Search, Bell, User, Palette } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { authService } from "@/lib/services/auth-service"
import type { AdminUser } from "@/lib/types/admin"
import { Suspense } from "react"

type ThemeType = "steel" | "graphite" | "evergreen"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<ThemeType>("steel")
  const [showThemePicker, setShowThemePicker] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Load theme from localStorage
    const savedTheme = (localStorage.getItem("admin-theme") as ThemeType) || "steel"
    setTheme(savedTheme)
    document.documentElement.setAttribute("data-admin-theme", savedTheme)
  }, [router])

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme)
    localStorage.setItem("admin-theme", newTheme)
    document.documentElement.setAttribute("data-admin-theme", newTheme)
    setShowThemePicker(false)
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--admin-surface-light)" }}
      >
        <div style={{ color: "var(--admin-text-primary)" }}>Cargando...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--admin-surface-light)" }}
      >
        <div className="text-center" style={{ color: "var(--admin-text-primary)" }}>
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="mb-6">No tiene permiso para acceder a esta área.</p>
          <Link href="/login" style={{ color: "var(--admin-error)" }} className="hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/products", label: "Productos" },
    { href: "/admin/inventory", label: "Inventario" },
    { href: "/admin/purchases", label: "Compras" },
    { href: "/admin/suppliers", label: "Proveedores" },
    { href: "/admin/customers", label: "Clientes" },
    { href: "/admin/sales", label: "Ventas" },
    { href: "/admin/promotions", label: "Promociones" },
    { href: "/admin/reservations", label: "Reservaciones" },
    { href: "/admin/files", label: "Archivos" },
    { href: "/admin/reports", label: "Reportes" },
    { href: "/admin/settings", label: "Configuración" },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen" style={{ backgroundColor: "var(--admin-bg)", color: "var(--admin-text-primary)" }}>
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className={`fixed lg:relative z-40 h-screen transition-all duration-200 ${
            sidebarOpen ? "w-64" : "w-0 lg:w-64"
          } overflow-hidden flex flex-col`}
          style={{
            backgroundColor: "var(--admin-surface-light)",
            borderRight: "1px solid var(--admin-border)",
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: "var(--admin-border)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--admin-primary)" }}>
              Ferretería Admin
            </h2>
          </div>
          <nav className="p-4 space-y-2 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive(item.href) ? "var(--admin-primary)" : "transparent",
                  color: isActive(item.href) ? "#FFFFFF" : "var(--admin-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--admin-surface-medium)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  color: "var(--admin-text-secondary)",
                }}
              >
                <Palette size={16} />
                <span className="text-sm">Tema</span>
              </button>
              {showThemePicker && (
                <div
                  className="absolute bottom-12 left-0 right-0 rounded-lg shadow-lg p-3 space-y-2"
                  style={{
                    backgroundColor: "var(--admin-surface-light)",
                    border: "1px solid var(--admin-border)",
                  }}
                >
                  {(["steel", "graphite", "evergreen"] as ThemeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className="w-full text-left px-3 py-2 rounded text-sm transition-colors capitalize"
                      style={{
                        backgroundColor: theme === t ? "var(--admin-primary)" : "var(--admin-surface-medium)",
                        color: theme === t ? "#FFFFFF" : "var(--admin-text-secondary)",
                      }}
                    >
                      {t === "steel" ? "Steel & Yellow" : t === "graphite" ? "Graphite & Orange" : "Evergreen & Green"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header
            className="px-6 py-4 flex items-center justify-between"
            style={{
              backgroundColor: "var(--admin-bg)",
              borderBottom: "1px solid var(--admin-border)",
            }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div
                className="hidden sm:flex items-center rounded-lg px-3 py-2"
                style={{ backgroundColor: "var(--admin-surface-light)" }}
              >
                <Search size={20} style={{ color: "var(--admin-text-tertiary)" }} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent ml-2 outline-none text-sm w-48"
                  style={{ color: "var(--admin-text-primary)" }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button style={{ color: "var(--admin-text-secondary)" }}>
                <Bell size={20} />
              </button>
              <div
                className="flex items-center gap-3 border-l pl-4"
                style={{ borderColor: "var(--admin-border)", color: "var(--admin-text-secondary)" }}
              >
                <User size={20} />
                <div>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs">{currentUser.role}</p>
                </div>
              </div>
              <button style={{ color: "var(--admin-text-secondary)" }}>
                <LogOut size={20} />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Suspense>
  )
}
