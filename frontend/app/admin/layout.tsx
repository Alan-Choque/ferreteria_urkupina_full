"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, X, LogOut, Search, Bell, User, Palette } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { authService } from "@/lib/services/auth-service"
import type { AdminUser } from "@/lib/types/admin"
import { Suspense } from "react"

type ThemeType = "steel" | "graphite" | "evergreen"

type SecondaryTask = {
  label: string
  description: string
  status: "disponible" | "en desarrollo" | "planificado"
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [theme, setTheme] = useState<ThemeType>("steel")
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user.role !== "admin") {
          setAccessDenied(true)
          authService.logout()
          return
        }
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

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

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

  if (accessDenied) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "var(--admin-surface-light)" }}
      >
        <div className="text-center" style={{ color: "var(--admin-text-primary)" }}>
          <h1 className="text-2xl font-bold mb-4">Acceso restringido</h1>
          <p className="mb-6">
            Tu cuenta no tiene permisos de administrador. Inicia sesión con un usuario autorizado.
          </p>
          <Link href="/login" style={{ color: "var(--admin-error)" }} className="hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
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
  type SecondaryAction = {
    label: string
    description?: string
    href?: string
    command?: "print"
    message?: string
  }

  const currentNav = navItems.find((item) => pathname.startsWith(item.href))

  const secondaryTaskMap: Record<string, SecondaryTask[]> = {
    "/admin": [
      {
        label: "Panel general",
        description: "Indicadores y actividad reciente del negocio.",
        status: "disponible",
      },
    ],
    "/admin/users": [
      {
        label: "Listado y búsqueda",
        description: "Consulta usuarios y su estado de acceso.",
        status: "disponible",
      },
      {
        label: "Registrar usuario",
        description: "Crear nuevas cuentas para colaboradores.",
        status: "planificado",
      },
      {
        label: "Asignar roles",
        description: "Configurar permisos y áreas asignadas.",
        status: "en desarrollo",
      },
      {
        label: "Importar usuarios",
        description: "Carga masiva desde CSV corporativo.",
        status: "planificado",
      },
    ],
    "/admin/products": [
      {
        label: "Listar productos",
        description: "Visualiza productos, variantes y precios.",
        status: "disponible",
      },
      {
        label: "Registrar nuevo producto",
        description: "Alta rápida con variantes y stock inicial.",
        status: "planificado",
      },
      {
        label: "Modificar producto",
        description: "Actualiza fichas, imágenes y estados.",
        status: "en desarrollo",
      },
      {
        label: "Cambio de estado",
        description: "Activa, desactiva o programa disponibilidad.",
        status: "planificado",
      },
      {
        label: "Buscar producto",
        description: "Filtra por SKU, categoría o proveedor.",
        status: "en desarrollo",
      },
    ],
    "/admin/inventory": [
      {
        label: "Stock por almacén",
        description: "Resumen de existencias por variante.",
        status: "disponible",
      },
      {
        label: "Registrar ingreso",
        description: "Ajustes positivos por compra o devolución.",
        status: "planificado",
      },
      {
        label: "Transferencias",
        description: "Movimientos entre sucursales o depósitos.",
        status: "en desarrollo",
      },
      {
        label: "Ajustes y mermas",
        description: "Regulariza diferencias de inventario.",
        status: "planificado",
      },
    ],
    "/admin/purchases": [
      {
        label: "Órdenes de compra",
        description: "Seguimiento de pedidos a proveedores.",
        status: "disponible",
      },
      {
        label: "Nueva orden",
        description: "Asistente para generar pedidos.",
        status: "planificado",
      },
      {
        label: "Recepciones",
        description: "Control de ingreso de mercancía.",
        status: "en desarrollo",
      },
      {
        label: "Reportes de compra",
        description: "Indicadores de proveedores y entregas.",
        status: "planificado",
      },
    ],
    "/admin/suppliers": [
      {
        label: "Listado de proveedores",
        description: "Consulta y gestiona información clave.",
        status: "disponible",
      },
      {
        label: "Registrar proveedor",
        description: "Alta de nuevos socios comerciales.",
        status: "planificado",
      },
      {
        label: "Importar proveedores",
        description: "Carga masiva desde planillas homologadas.",
        status: "planificado",
      },
    ],
    "/admin/customers": [
      {
        label: "Listado de clientes",
        description: "Información de contacto y estado.",
        status: "disponible",
      },
      {
        label: "Registrar cliente",
        description: "Crear fichas con múltiples direcciones.",
        status: "planificado",
      },
      {
        label: "Importar clientes",
        description: "Sincroniza la cartera desde archivos CSV.",
        status: "planificado",
      },
    ],
    "/admin/sales": [
      {
        label: "Ventas y órdenes",
        description: "Historial de transacciones y totales.",
        status: "disponible",
      },
      {
        label: "Registrar venta",
        description: "Captura manual para ventas especiales.",
        status: "en desarrollo",
      },
      {
        label: "Pagos y cobranzas",
        description: "Seguimiento de abonos y saldos.",
        status: "planificado",
      },
      {
        label: "Reportes comerciales",
        description: "KPIs por vendedor, sucursal y período.",
        status: "planificado",
      },
    ],
    "/admin/promotions": [
      {
        label: "Cupones y campañas",
        description: "Gestiona promociones activas.",
        status: "disponible",
      },
      {
        label: "Crear promoción",
        description: "Diseña descuentos y reglas avanzadas.",
        status: "en desarrollo",
      },
      {
        label: "Historial de campañas",
        description: "Analiza resultados de campañas pasadas.",
        status: "planificado",
      },
    ],
    "/admin/reservations": [
      {
        label: "Listado de reservas",
        description: "Clientes, fechas y depósitos registrados.",
        status: "disponible",
      },
      {
        label: "Registrar reserva",
        description: "Aparta productos con fecha de retiro.",
        status: "planificado",
      },
      {
        label: "Entregas y retiros",
        description: "Confirma retiros y procesa devoluciones.",
        status: "en desarrollo",
      },
      {
        label: "Reportes de reservas",
        description: "Control de vencimientos y conversiones.",
        status: "planificado",
      },
    ],
    "/admin/files": [
      {
        label: "Biblioteca documentos",
        description: "Archivos disponibles por módulo.",
        status: "disponible",
      },
      {
        label: "Subir archivos",
        description: "Carga drag & drop con metadatos.",
        status: "en desarrollo",
      },
      {
        label: "Compartidos",
        description: "Gestiona enlaces públicos o privados.",
        status: "planificado",
      },
    ],
    "/admin/reports": [
      {
        label: "Dashboard general",
        description: "Indicadores clave del negocio.",
        status: "disponible",
      },
      {
        label: "Exportaciones",
        description: "Descarga informes en CSV o PDF.",
        status: "planificado",
      },
    ],
    "/admin/settings": [
      {
        label: "Datos de empresa",
        description: "Nombre, dirección, NIT y metadatos.",
        status: "disponible",
      },
      {
        label: "Sucursales",
        description: "Agregar y mantener sedes comerciales.",
        status: "disponible",
      },
      {
        label: "Plantillas de email",
        description: "Configura comunicaciones oficiales.",
        status: "en desarrollo",
      },
    ],
  }

  const secondaryTasks = currentNav ? secondaryTaskMap[currentNav.href] ?? [] : []

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
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.backgroundColor = "var(--admin-surface-medium)"
                    el.style.color = "var(--admin-text-primary)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.backgroundColor = "transparent"
                    el.style.color = "var(--admin-text-secondary)"
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
              <div className="relative border-l pl-4 user-menu-container" style={{ borderColor: "var(--admin-border)" }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  style={{ color: "var(--admin-text-secondary)" }}
                >
                  <User size={20} />
                  <div className="text-left">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs">{currentUser.role}</p>
                  </div>
                </button>
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-2 z-50"
                    style={{
                      backgroundColor: "var(--admin-surface-light)",
                      border: "1px solid var(--admin-border)",
                    }}
                  >
                    <div className="px-4 py-2 border-b" style={{ borderColor: "var(--admin-border)" }}>
                      <p className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                        {currentUser.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                        {currentUser.email || currentUser.role}
                      </p>
                    </div>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{ color: "var(--admin-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
                        e.currentTarget.style.color = "var(--admin-text-primary)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "var(--admin-text-secondary)"
                      }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{ color: "var(--admin-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
                        e.currentTarget.style.color = "var(--admin-text-primary)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "var(--admin-text-secondary)"
                      }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      Configuración
                    </Link>
                    <button
                      onClick={async () => {
                        await authService.logout()
                        router.push("/login")
                      }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                      style={{ color: "var(--admin-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
                        e.currentTarget.style.color = "#ef4444"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "var(--admin-text-secondary)"
                      }}
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6 space-y-4">
            {secondaryTasks.length > 0 && (
              <div className="border border-gray-700 bg-gray-900/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Acciones del módulo</p>
                  <span className="text-xs text-gray-400">
                    {secondaryTasks.filter((task) => task.status === "disponible").length} disponibles ·{" "}
                    {secondaryTasks.filter((task) => task.status === "en desarrollo").length} en desarrollo ·{" "}
                    {secondaryTasks.filter((task) => task.status === "planificado").length} planificadas
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {secondaryTasks.map((task) => (
                    <div
                      key={task.label}
                      className="px-4 py-3 rounded-lg border border-gray-700 bg-gray-900/70 text-sm text-gray-100 w-full sm:w-auto sm:min-w-[220px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{task.label}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            task.status === "disponible"
                              ? "bg-green-600/30 text-green-300"
                              : task.status === "en desarrollo"
                                ? "bg-yellow-600/30 text-yellow-300"
                                : "bg-gray-600/30 text-gray-300"
                          }`}
                        >
                          {task.status === "disponible"
                            ? "Disponible"
                            : task.status === "en desarrollo"
                              ? "En desarrollo"
                              : "Planificado"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
