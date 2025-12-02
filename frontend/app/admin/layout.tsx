"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, X, LogOut, Bell, User, Palette, Home, ChevronRight, Package, ShoppingCart, Users, FileText, BarChart3, Settings, Zap, Search, Share2, Filter, ArrowUpDown, LayoutGrid, Download, Crown, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react"

// Colores morado y blanco para CRM
const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}
const WHITE = "#FFFFFF"
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
  const [showNotifications, setShowNotifications] = useState(false)
  const [isFirstEntry, setIsFirstEntry] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Inicializar searchQuery desde la URL
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get("q") || "")
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        // Permitir acceso a usuarios con roles válidos (ADMIN, INVENTARIOS, SUPERVISOR, VENTAS)
        const userRoles = user.roles || []
        const validRoles = ["ADMIN", "INVENTARIOS", "SUPERVISOR", "VENTAS"]
        const hasValidRole = validRoles.includes(user.role) || 
          userRoles.some(r => validRoles.includes(r.toUpperCase()))
        
        if (!hasValidRole) {
          setAccessDenied(true)
          authService.logout()
          return
        }
        setCurrentUser(user)
        
        // Verificar si es la primera entrada al admin en esta sesión
        const hasEnteredAdmin = sessionStorage.getItem("admin-entered")
        if (!hasEnteredAdmin) {
          setIsFirstEntry(true)
          sessionStorage.setItem("admin-entered", "true")
          // Desactivar después de la animación
          setTimeout(() => {
            setIsFirstEntry(false)
          }, 1000)
        }
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Load theme from localStorage - Force CRM theme
    const savedTheme = "steel" // Always use CRM theme (steel now has purple colors)
    setTheme(savedTheme as ThemeType)
    document.documentElement.setAttribute("data-admin-theme", savedTheme)
  }, [router])

  // Actualizar searchQuery cuando cambia el parámetro de la URL (solo desde navegación, no al escribir)
  useEffect(() => {
    if (isTyping) return // No actualizar mientras el usuario está escribiendo
    
    const urlSearch = searchParams?.get("q") || ""
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isTyping])

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
      if (showNotifications && !target.closest('.notification-menu-container')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu, showNotifications])

  // Función para obtener icono del módulo
  const getModuleIcon = (href: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "/admin/users": <Users size={16} />,
      "/admin/products": <Package size={16} />,
      "/admin/inventory": <Package size={16} />,
      "/admin/purchases": <ShoppingCart size={16} />,
      "/admin/suppliers": <Users size={16} />,
      "/admin/customers": <Users size={16} />,
      "/admin/sales": <ShoppingCart size={16} />,
      "/admin/promotions": <Zap size={16} />,
      "/admin/reservations": <FileText size={16} />,
      "/admin/files": <FileText size={16} />,
      "/admin/reports": <BarChart3 size={16} />,
      "/admin/settings": <Settings size={16} />,
    }
    return iconMap[href] || <Home size={16} />
  }

  // Función para obtener el nombre de la acción actual
  const getCurrentAction = (currentPath: string, searchParams: URLSearchParams | null): string | null => {
    const actionParam = searchParams?.get("action")
    if (!actionParam) return null

    // Mapeo de acciones a nombres legibles
    const actionMap: Record<string, Record<string, string>> = {
      "/admin/products": {
        list: "Listar y buscar productos",
        create: "Registrar nuevo producto",
        edit: "Modificar producto",
        status: "Cambio de estado",
        print: "Imprimir",
      },
      "/admin/users": {
        list: "Listado y búsqueda",
        create: "Registrar usuario",
        roles: "Asignar roles",
      },
      "/admin/customers": {
        list: "Listar y buscar clientes",
        create: "Registrar cliente",
        engagement: "Campañas y fidelización",
        print: "Imprimir listado",
      },
      "/admin/suppliers": {
        list: "Listar y buscar proveedores",
        create: "Registrar proveedor",
        reports: "Reportes y análisis",
        print: "Imprimir listado",
      },
      "/admin/sales": {
        list: "Listar y buscar ventas",
        create: "Registrar venta",
        payments: "Pagos y cobranzas",
        logistics: "Envíos y entregas",
        reports: "Reportes comerciales",
        print: "Imprimir listado",
      },
      "/admin/purchases": {
        list: "Listar y buscar órdenes de compra",
        create: "Nueva orden de compra",
        receiving: "Recepciones de mercancía",
        reports: "Reportes de compras",
        print: "Imprimir listado",
      },
      "/admin/reservations": {
        list: "Listar y buscar reservas",
        create: "Registrar reserva",
        pickups: "Entregas y retiros",
        print: "Imprimir listado",
      },
      "/admin/promotions": {
        list: "Listar y buscar promociones",
        create: "Crear promoción",
        history: "Historial de campañas",
        print: "Imprimir listado",
      },
      "/admin/inventory": {
        stock: "Stock por almacén",
        register: "Registrar ingreso",
        transfer: "Transferencias",
        adjustments: "Ajustes y mermas",
        print: "Imprimir listado",
      },
      "/admin/files": {
        library: "Biblioteca",
        upload: "Subir archivos",
        shared: "Compartidos",
        collections: "Colecciones",
        print: "Imprimir catálogo",
      },
      "/admin/reports": {
        export: "Exportaciones",
      },
    }

    // Buscar el módulo actual
    const modulePath = currentNav?.href || currentPath
    const moduleActions = actionMap[modulePath]
    
    if (moduleActions && moduleActions[actionParam]) {
      return moduleActions[actionParam]
    }

    // Si no está en el mapa, devolver el nombre capitalizado
    return actionParam.charAt(0).toUpperCase() + actionParam.slice(1)
  }

  // Definir navItems antes de los returns tempranos
  // IMPORTANTE: /admin debe estar al principio pero se ordena al final para detección de rutas
  const navItems = [
    { href: "/admin", label: "Módulos disponibles" }, // Al principio del menú, pero se ordena al final para detección
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
  ]

  const currentNav = useMemo(() => {
    // Buscar primero las rutas más específicas (más largas)
    const sortedItems = [...navItems].sort((a, b) => b.href.length - a.href.length)
    return sortedItems.find((item) => pathname.startsWith(item.href))
  }, [pathname])

  // Definir secondaryTaskMap antes de los returns tempranos
  const secondaryTaskMap: Record<string, SecondaryTask[]> = useMemo(() => ({
    "/admin": [
      {
        label: "Panel general",
        description: "Indicadores y actividad reciente del negocio.",
        status: "disponible",
      },
    ],
    "/admin/users": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de usuarios.",
        status: "disponible",
      },
      {
        label: "Listado y búsqueda",
        description: "Consulta usuarios y su estado de acceso.",
        status: "disponible",
      },
      {
        label: "Registrar usuario",
        description: "Crear nuevas cuentas para colaboradores.",
        status: "disponible",
      },
      {
        label: "Asignar roles",
        description: "Configurar permisos y áreas asignadas.",
        status: "disponible",
      },
    ],
    "/admin/products": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de productos.",
        status: "disponible",
      },
      {
        label: "Listar y buscar productos",
        description: "Visualiza productos, variantes y precios.",
        status: "disponible",
      },
      {
        label: "Registrar nuevo producto",
        description: "Alta rápida con variantes y stock inicial.",
        status: "disponible",
      },
      {
        label: "Modificar producto",
        description: "Actualiza fichas, imágenes y estados.",
        status: "disponible",
      },
      {
        label: "Cambio de estado",
        description: "Activa, desactiva o programa disponibilidad.",
        status: "disponible",
      },
      {
        label: "Imprimir",
        description: "Genera PDF del catálogo de productos.",
        status: "disponible",
      },
    ],
    "/admin/inventory": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de inventario.",
        status: "disponible",
      },
      {
        label: "Stock por almacén",
        description: "Resumen de existencias por variante.",
        status: "disponible",
      },
      {
        label: "Registrar ingreso",
        description: "Ajustes positivos por compra o devolución.",
        status: "disponible",
      },
      {
        label: "Transferencias",
        description: "Movimientos entre sucursales o depósitos.",
        status: "disponible",
      },
      {
        label: "Ajustes y mermas",
        description: "Regulariza diferencias de inventario.",
        status: "disponible",
      },
    ],
    "/admin/purchases": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de compras.",
        status: "disponible",
      },
      {
        label: "Órdenes de compra",
        description: "Seguimiento de pedidos a proveedores.",
        status: "disponible",
      },
      {
        label: "Nueva orden",
        description: "Asistente para generar pedidos.",
        status: "disponible",
      },
      {
        label: "Recepciones",
        description: "Control de ingreso de mercancía.",
        status: "disponible",
      },
      {
        label: "Reportes de compra",
        description: "Indicadores de proveedores y entregas.",
        status: "disponible",
      },
    ],
    "/admin/suppliers": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de proveedores.",
        status: "disponible",
      },
      {
        label: "Listado de proveedores",
        description: "Consulta y gestiona información clave.",
        status: "disponible",
      },
      {
        label: "Registrar proveedor",
        description: "Alta de nuevos socios comerciales.",
        status: "disponible",
      },
    ],
    "/admin/customers": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de clientes.",
        status: "disponible",
      },
      {
        label: "Listado de clientes",
        description: "Información de contacto y estado.",
        status: "disponible",
      },
      {
        label: "Registrar cliente",
        description: "Crear fichas con múltiples direcciones.",
        status: "disponible",
      },
    ],
    "/admin/sales": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de ventas.",
        status: "disponible",
      },
      {
        label: "Ventas y órdenes",
        description: "Historial de transacciones y totales.",
        status: "disponible",
      },
      {
        label: "Registrar venta",
        description: "Captura manual para ventas especiales.",
        status: "disponible",
      },
      {
        label: "Pagos y cobranzas",
        description: "Seguimiento de abonos y saldos.",
        status: "disponible",
      },
      {
        label: "Reportes comerciales",
        description: "KPIs por vendedor, sucursal y período.",
        status: "disponible",
      },
    ],
    "/admin/promotions": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de promociones.",
        status: "disponible",
      },
      {
        label: "Cupones y campañas",
        description: "Gestiona promociones activas.",
        status: "disponible",
      },
      {
        label: "Crear promoción",
        description: "Diseña descuentos y reglas avanzadas.",
        status: "disponible",
      },
      {
        label: "Historial de campañas",
        description: "Analiza resultados de campañas pasadas.",
        status: "disponible",
      },
    ],
    "/admin/reservations": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de reservaciones.",
        status: "disponible",
      },
      {
        label: "Listado de reservas",
        description: "Clientes, fechas y depósitos registrados.",
        status: "disponible",
      },
      {
        label: "Registrar reserva",
        description: "Aparta productos con fecha de retiro.",
        status: "disponible",
      },
      {
        label: "Entregas y retiros",
        description: "Confirma retiros y procesa devoluciones.",
        status: "disponible",
      },
      {
        label: "Reportes de reservas",
        description: "Control de vencimientos y conversiones.",
        status: "disponible",
      },
    ],
    "/admin/files": [
      {
        label: "Panel",
        description: "Vista general con estadísticas de archivos.",
        status: "disponible",
      },
      {
        label: "Biblioteca documentos",
        description: "Archivos disponibles por módulo.",
        status: "disponible",
      },
      {
        label: "Subir archivos",
        description: "Carga drag & drop con metadatos.",
        status: "disponible",
      },
      {
        label: "Compartidos",
        description: "Gestiona enlaces públicos o privados.",
        status: "disponible",
      },
    ],
    "/admin/reports": [
      {
        label: "Panel",
        description: "Vista general con indicadores clave del negocio.",
        status: "disponible",
      },
      {
        label: "Exportaciones",
        description: "Gráficas y reportes detallados de usuarios, clientes, productos y más.",
        status: "disponible",
      },
    ],
    "/admin/settings": [
      {
        label: "Opciones de configuración",
        description: "Selecciona una opción para gestionar la configuración del sistema.",
        status: "disponible",
      },
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
        status: "disponible",
      },
    ],
  }), [])

  // Obtener las opciones secundarias del módulo actual
  const secondaryTasks = useMemo((): SecondaryTask[] => {
    // Si estamos en /admin exacto, mostrar solo Panel general
    if (pathname === "/admin") {
      return secondaryTaskMap["/admin"] ?? []
    }
    
    // Buscar el módulo que coincide con la ruta actual
    if (!currentNav) {
      // Si no hay currentNav pero estamos en una ruta de admin, intentar detectar el módulo manualmente
      for (const item of navItems) {
        if (pathname.startsWith(item.href) && item.href !== "/admin") {
          const tasks = secondaryTaskMap[item.href] ?? []
          console.log("Detected module manually:", item.href, "Tasks:", tasks)
          return tasks
        }
      }
      return []
    }
    
    const basePath = currentNav.href
    const tasks = secondaryTaskMap[basePath] ?? []
    // Debug: verificar que se están obteniendo las opciones
    console.log("Current pathname:", pathname)
    console.log("Current nav:", currentNav)
    console.log("Base path:", basePath)
    console.log("Secondary tasks for", basePath, ":", tasks)
    return tasks
  }, [currentNav, secondaryTaskMap, pathname, navItems])

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  type SecondaryAction = {
    label: string
    description?: string
    href?: string
    command?: "print"
    message?: string
  }


  // Mapeo de secondaryTasks a rutas
  const getTaskRoute = (taskLabel: string, basePath: string): string => {
    // Si es "Panel" o "Opciones de configuración", retornar la ruta base del módulo
    if (taskLabel === "Panel" || taskLabel === "Opciones de configuración") {
      return basePath
    }
    
    const routeMap: Record<string, string> = {
      "Panel general": "/admin",
      "Listar y buscar productos": "/admin/products?action=list",
      "Registrar nuevo producto": "/admin/products?action=create",
      "Modificar producto": "/admin/products?action=edit",
      "Cambio de estado": "/admin/products?action=status",
      "Imprimir": "/admin/products?action=print",
      "Listado y búsqueda": "/admin/users?action=list",
      "Registrar usuario": "/admin/users?action=create",
      "Asignar roles": "/admin/users?action=roles",
      "Stock por almacén": "/admin/inventory?action=stock",
      "Registrar ingreso": "/admin/inventory?action=register",
      "Transferencias": "/admin/inventory?action=transfer",
      "Ajustes y mermas": "/admin/inventory?action=adjustments",
      "Órdenes de compra": "/admin/purchases?action=list",
      "Nueva orden": "/admin/purchases?action=create",
      "Recepciones": "/admin/purchases?action=receiving",
      "Reportes de compra": "/admin/purchases?action=reports",
      "Listado de proveedores": "/admin/suppliers?action=list",
      "Registrar proveedor": "/admin/suppliers?action=create",
      "Listado de clientes": "/admin/customers?action=list",
      "Registrar cliente": "/admin/customers?action=create",
      "Ventas y órdenes": "/admin/sales?action=list",
      "Registrar venta": "/admin/sales?action=create",
      "Pagos y cobranzas": "/admin/sales?action=payments",
      "Reportes comerciales": "/admin/sales?action=reports",
      "Cupones y campañas": "/admin/promotions?action=list",
      "Crear promoción": "/admin/promotions?action=create",
      "Historial de campañas": "/admin/promotions?action=history",
      "Listado de reservas": "/admin/reservations?action=list",
      "Registrar reserva": "/admin/reservations?action=create",
      "Entregas y retiros": "/admin/reservations?action=pickups",
      "Reportes de reservas": "/admin/reservations?action=reports",
      "Biblioteca documentos": "/admin/files?action=library",
      "Subir archivos": "/admin/files?action=upload",
      "Compartidos": "/admin/files?action=shared",
      "Exportaciones": "/admin/reports?action=export",
      "Datos de empresa": "/admin/settings?action=company",
      "Sucursales": "/admin/settings?action=branches",
      "Plantillas de email": "/admin/settings?action=templates",
      "Panel general": "/admin",
    }
    return routeMap[taskLabel] || basePath
  }

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Navegar a la página de búsqueda correspondiente según el módulo actual
    const currentPath = pathname || "/admin"
    
    if (currentPath.startsWith("/admin/products")) {
      router.push(`/admin/products?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/users")) {
      router.push(`/admin/users?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/customers")) {
      router.push(`/admin/customers?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/suppliers")) {
      router.push(`/admin/suppliers?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/inventory")) {
      router.push(`/admin/inventory?action=stock&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/purchases")) {
      router.push(`/admin/purchases?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/sales")) {
      router.push(`/admin/sales?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/promotions")) {
      router.push(`/admin/promotions?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/reservations")) {
      router.push(`/admin/reservations?action=list&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/files")) {
      router.push(`/admin/files?action=library&q=${encodeURIComponent(searchQuery)}`)
    } else if (currentPath.startsWith("/admin/reports")) {
      router.push(`/admin/reports?action=dashboard&q=${encodeURIComponent(searchQuery)}`)
    } else {
      // Búsqueda global - ir al panel principal
      router.push(`/admin?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen" style={{ backgroundColor: "var(--admin-bg)", color: "var(--admin-text-primary)" }}>
        {/* Sidebar */}
        <motion.aside
          key="sidebar"
          initial={isFirstEntry ? { 
            x: [0, -4, 4, -3, 3, 0],
            y: [0, 3, -3, 4, -4, 0],
            rotate: [0, -1, 1, -0.5, 0.5, 0],
            opacity: 0,
          } : { x: -300, opacity: 1 }}
          animate={isFirstEntry ? { 
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
          } : { x: 0, opacity: 1 }}
          transition={isFirstEntry ? {
            duration: 0.6,
            ease: "easeOut",
          } : { duration: 0.2 }}
          className={`fixed lg:relative z-40 h-screen transition-all duration-200 ${
            sidebarOpen ? "w-72" : "w-0 lg:w-72"
          } overflow-hidden flex flex-col`}
          style={{
            backgroundColor: WHITE,
            borderRight: `1px solid ${PURPLE_COLORS.accent}`,
            boxShadow: "2px 0 10px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Logo Section */}
          <div className="p-6 border-b" style={{ borderColor: PURPLE_COLORS.accent }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src="/logo-cyber-serpents.png"
                  alt="Cyber Serpents Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold leading-tight" style={{ color: PURPLE_COLORS.dark }}>
                  SIGEF
                </h2>
                <p className="text-xs leading-tight" style={{ color: PURPLE_COLORS.secondary }}>
                  Sistema de Gestión
                </p>
              </div>
            </div>
            
            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: PURPLE_COLORS.secondary }} />
              <input
                type="text"
                placeholder="Buscar"
                className="w-full pl-10 pr-8 py-2.5 rounded-lg border text-sm"
                style={{
                  borderColor: PURPLE_COLORS.accent,
                  backgroundColor: "#F9FAFB",
                  color: PURPLE_COLORS.dark,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = PURPLE_COLORS.primary
                  e.target.style.backgroundColor = WHITE
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = PURPLE_COLORS.accent
                  e.target.style.backgroundColor = "#F9FAFB"
                }}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: PURPLE_COLORS.accent, color: PURPLE_COLORS.secondary, backgroundColor: WHITE }}>
                K
              </span>
            </div>
          </div>
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {/* Main Navigation Items */}
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive("/admin") ? PURPLE_COLORS.accent : "transparent",
                color: isActive("/admin") ? PURPLE_COLORS.primary : "#6B7280",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <BarChart3 size={18} />
              <span>Panel</span>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive("/admin/users") ? PURPLE_COLORS.accent : "transparent",
                color: isActive("/admin/users") ? PURPLE_COLORS.primary : "#6B7280",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin/users")) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin/users")) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <Users size={18} />
              <span>Usuarios</span>
            </Link>

            <Link
              href="/admin/customers"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive("/admin/customers") ? PURPLE_COLORS.accent : "transparent",
                color: isActive("/admin/customers") ? PURPLE_COLORS.primary : "#6B7280",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin/customers")) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin/customers")) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <Users size={18} />
              <span>Clientes</span>
            </Link>

            <Link
              href="/admin/suppliers"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
              style={{
                backgroundColor: isActive("/admin/suppliers") ? PURPLE_COLORS.accent : "transparent",
                color: isActive("/admin/suppliers") ? PURPLE_COLORS.primary : "#6B7280",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin/suppliers")) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin/suppliers")) {
                  e.currentTarget.style.backgroundColor = "transparent"
                }
              }}
            >
              <Users size={18} />
              <span>Proveedores</span>
            </Link>

            {/* Records Section - Expandible */}
            <div className="mt-4">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: PURPLE_COLORS.secondary }}>
                Registros
              </div>
              <Link
                href="/admin/products"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/products") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/products") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/products")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/products")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <Package size={18} />
                <span>Productos</span>
              </Link>
              <Link
                href="/admin/sales"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/sales") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/sales") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/sales")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/sales")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <ShoppingCart size={18} />
                <span>Ventas</span>
              </Link>
              <Link
                href="/admin/purchases"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/purchases") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/purchases") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/purchases")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/purchases")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <ShoppingCart size={18} />
                <span>Compras</span>
              </Link>
            </div>

            {/* Channels Section */}
            <div className="mt-4">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: PURPLE_COLORS.secondary }}>
                Canales
              </div>
              <Link
                href="/admin/promotions"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/promotions") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/promotions") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/promotions")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/promotions")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <Zap size={18} />
                <span>Promociones</span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: PURPLE_COLORS.primary, color: WHITE }}>
                  5
                </span>
              </Link>
              <Link
                href="/admin/reservations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/reservations") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/reservations") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/reservations")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/reservations")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <FileText size={18} />
                <span>Reservaciones</span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: PURPLE_COLORS.primary, color: WHITE }}>
                  4
                </span>
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm"
                style={{
                  backgroundColor: isActive("/admin/reports") ? PURPLE_COLORS.accent : "transparent",
                  color: isActive("/admin/reports") ? PURPLE_COLORS.primary : "#6B7280",
                }}
                onMouseEnter={(e) => {
                  if (!isActive("/admin/reports")) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive("/admin/reports")) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <BarChart3 size={18} />
                <span>Reportes</span>
              </Link>
            </div>
          </nav>

        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar - Estilo Floxen */}
          <header
            className="px-6 py-4 flex items-center justify-between"
            style={{
              backgroundColor: WHITE,
              borderBottom: `1px solid ${PURPLE_COLORS.accent}`,
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                {currentNav?.label || "Panel"}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Barra de Búsqueda */}
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: PURPLE_COLORS.secondary }} />
                <input
                  type="text"
                  placeholder="Buscar"
                  className="pl-10 pr-8 py-2 rounded-lg border text-sm w-64"
                  style={{
                    borderColor: PURPLE_COLORS.accent,
                    backgroundColor: "#F9FAFB",
                    color: PURPLE_COLORS.dark,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PURPLE_COLORS.primary
                    e.target.style.backgroundColor = WHITE
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = PURPLE_COLORS.accent
                    e.target.style.backgroundColor = "#F9FAFB"
                  }}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: PURPLE_COLORS.accent, color: PURPLE_COLORS.secondary, backgroundColor: WHITE }}>
                  K
                </span>
              </div>
              
              {/* Share Button */}
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Compartir"
              >
                <Share2 size={20} style={{ color: PURPLE_COLORS.primary }} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="relative notification-menu-container">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative transition-all hover:scale-110 p-2 rounded-lg"
                    style={{ 
                      color: PURPLE_COLORS.primary,
                      backgroundColor: "transparent"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                    title="Notificaciones"
                  >
                    <Bell size={20} />
                  </button>
                  {showNotifications && (
                    <div
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl py-2 z-50"
                      style={{
                        backgroundColor: WHITE,
                        border: `2px solid ${PURPLE_COLORS.accent}`,
                      }}
                    >
                      <div className="px-4 py-2 border-b" style={{ borderColor: "var(--admin-border)" }}>
                        <p className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                          Notificaciones
                        </p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 text-sm text-center" style={{ color: "var(--admin-text-secondary)" }}>
                          <p>No hay notificaciones nuevas</p>
                          <p className="text-xs mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
                            Las notificaciones del sistema aparecerán aquí
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative border-l pl-4 user-menu-container" style={{ borderColor: PURPLE_COLORS.accent }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:opacity-80 transition-all p-2 rounded-lg"
                  style={{ 
                    color: PURPLE_COLORS.primary,
                    backgroundColor: "transparent"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <User size={20} />
                  <div className="text-left">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs">{currentUser.role}</p>
                  </div>
                </button>
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl py-2 z-50"
                    style={{
                      backgroundColor: WHITE,
                      border: `2px solid ${PURPLE_COLORS.accent}`,
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
                      href="/admin/profile"
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
                        sessionStorage.removeItem("admin-entered")
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
            </div>
          </header>

          {/* Barra de Acciones - Estilo Floxen */}
          {pathname === "/admin" && (
            <div className="px-6 py-3 flex items-center gap-2 border-b" style={{ borderColor: PURPLE_COLORS.accent, backgroundColor: WHITE }}>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors" style={{ color: PURPLE_COLORS.dark }}>
                <ArrowUpDown size={16} />
                Ordenar
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors" style={{ color: PURPLE_COLORS.dark }}>
                <Filter size={16} />
                Filtrar
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors" style={{ color: PURPLE_COLORS.dark }}>
                <LayoutGrid size={16} />
                Resumen
                <ChevronDown size={14} />
              </button>
              <div className="ml-auto">
                <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: PURPLE_COLORS.primary }}>
                  <Download size={16} className="inline mr-2" />
                  Exportar
                </button>
              </div>
            </div>
          )}

          {/* Barra de menú horizontal - Estilo CRM */}
          {secondaryTasks.length > 0 && pathname !== "/admin/settings" && pathname !== "/admin" && (
            <div
              className="border-b shadow-sm"
              style={{ 
                borderColor: PURPLE_COLORS.accent, 
                backgroundColor: WHITE
              }}
            >
              <nav className="flex items-center overflow-x-auto">
                {secondaryTasks.map((task, index) => {
                  const taskRoute = getTaskRoute(task.label, currentNav?.href || "/admin")
                  const isAvailable = task.status === "disponible"
                  
                  // Extraer la ruta base y el query param de taskRoute
                  const [taskPath, taskQuery] = taskRoute.split("?")
                  const taskAction = taskQuery?.split("=")[1]
                  
                  // Obtener el action actual de la URL
                  const currentAction = searchParams?.get("action")
                  
                  // Verificar si la ruta actual coincide con la tarea
                  let isActive = false
                  if (taskRoute.includes("?")) {
                    // Si la ruta tiene query params, comparar pathname y action
                    isActive = pathname === taskPath && currentAction === taskAction
                  } else {
                    // Si no tiene query params (Panel), solo está activo si no hay action en la URL
                    // Panel está activo solo cuando no hay action seleccionado
                    if (task.label === "Panel" || task.label === "Opciones de configuración") {
                      isActive = pathname === taskRoute && !currentAction
                    } else {
                      // Para otras opciones sin query params
                      isActive = pathname === taskRoute || 
                                 (taskRoute && pathname?.startsWith(taskRoute + "/"))
                    }
                  }
                  
                  return (
                    <Link
                      key={task.label}
                      href={isAvailable ? taskRoute : "#"}
                      onClick={(e) => {
                        if (!isAvailable) {
                          e.preventDefault()
                          alert(`${task.label} está ${task.status === "en desarrollo" ? "en desarrollo" : "planificado"}. Próximamente disponible.`)
                        }
                      }}
                      className={`px-5 py-3 text-sm font-medium transition-all whitespace-nowrap relative ${
                        isActive 
                          ? "text-white font-semibold shadow-lg" 
                          : "hover:bg-purple-50 text-gray-700 hover:text-purple-600"
                      } ${!isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} rounded-t-xl`}
                      style={{
                        backgroundColor: isActive ? PURPLE_COLORS.primary : "transparent",
                        borderTopLeftRadius: "0.75rem",
                        borderTopRightRadius: "0.75rem",
                        borderBottom: isActive ? `3px solid ${PURPLE_COLORS.primary}` : "3px solid transparent",
                        borderRight: index < secondaryTasks.length - 1 ? `1px solid ${PURPLE_COLORS.accent}` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && isAvailable) {
                          e.currentTarget.style.backgroundColor = PURPLE_COLORS.accent
                          e.currentTarget.style.transform = "translateY(-2px)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && isAvailable) {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.transform = "translateY(0)"
                        }
                      }}
                      title={!isAvailable ? `${task.description} (${task.status === "en desarrollo" ? "En desarrollo" : "Planificado"})` : task.description}
                    >
                      {task.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ 
                  opacity: 0, 
                  x: [0, -4, 4, -3, 3, 0],
                  y: [0, 3, -3, 4, -4, 0],
                  rotate: [0, -1, 1, -0.5, 0.5, 0],
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  y: 0,
                  rotate: 0,
                }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
          <footer className="border-t border-neutral-200 py-4 px-6 text-center text-sm text-neutral-600">
            <p>© 2025 Ferretería Urkupina. Todos los derechos reservados.</p>
          </footer>
        </div>
      </div>
    </Suspense>
  )
}

