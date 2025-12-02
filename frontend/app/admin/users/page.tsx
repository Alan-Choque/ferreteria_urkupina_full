"use client"

import type React from "react"

import { useEffect, useState, useMemo } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { usersService } from "@/lib/services/users-service"
import { Plus, Edit2, Trash2, RotateCcw, X, Ban, CheckCircle, Users, UserCheck, UserX, Search, TrendingUp, Shield, Calendar, ShoppingCart, Package, Eye, BarChart3 } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { KPICard } from "@/components/admin/KPICard"
import { motion, AnimatePresence } from "framer-motion"
import type { AdminUser } from "@/lib/types/admin"

type FormData = Omit<AdminUser, "id" | "createdAt">

// Colores del diseño CRM
const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

// Configuración de roles con iconos y colores
const ROLE_CONFIG = {
  ADMIN: {
    label: "Administrador",
    icon: Shield,
    color: PURPLE_COLORS.primary,
    bgColor: "#F3F4F6",
    borderColor: PURPLE_COLORS.primary,
    description: "Acceso completo al sistema",
  },
  VENTAS: {
    label: "Ventas",
    icon: ShoppingCart,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#3B82F6",
    description: "Gestionar ventas y clientes",
  },
  INVENTARIOS: {
    label: "Inventarios",
    icon: Package,
    color: "#10B981",
    bgColor: "#ECFDF5",
    borderColor: "#10B981",
    description: "Ver y actualizar inventario",
  },
  SUPERVISOR: {
    label: "Supervisor",
    icon: Eye,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#F59E0B",
    description: "Solo consulta de inventario",
  },
}

export default function UsersPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Detectar la acción desde la URL
  const getActionFromPath = () => {
    const actionParam = searchParams?.get("action")
    if (actionParam) return actionParam
    
    // Si estamos en la ruta base sin action, mostrar dashboard (null)
    if (pathname === "/admin/users" || pathname === "/admin/users/") {
      return null // Mostrar dashboard
    }
    return null // Por defecto mostrar dashboard
  }
  
  const [selectedAction, setSelectedAction] = useState<string | null>(getActionFromPath())
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    role: "SUPERVISOR",
    branch: "",
    password: "",
    active: true,
  })
  
  // Actualizar selectedAction cuando cambia la ruta o query params
  useEffect(() => {
    const action = getActionFromPath()
    setSelectedAction(action)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "SUPERVISOR",
      branch: "",
      password: "",
      active: true,
    })
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    // Limpiar el formulario y volver al dashboard
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "SUPERVISOR",
      branch: "",
      password: "",
      active: true,
    })
    // Volver al dashboard
    router.replace(pathname)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "SUPERVISOR",
      branch: "",
      password: "",
      active: true,
    })
  }

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      password: "",
      active: user.active,
    })
    setIsFormOpen(true)
  }

  const handleResetPassword = async (id: number) => {
    if (confirm("¿Enviar enlace de restablecimiento de contraseña?")) {
      try {
        await usersService.resetUserPassword(id)
        alert("Enlace de restablecimiento enviado")
      } catch (error) {
        console.error("Error resetting password:", error)
      }
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar contraseña para nuevos usuarios
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      alert("La contraseña es obligatoria y debe tener al menos 8 caracteres")
      return
    }
    
    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, formData)
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)))
        alert("Usuario actualizado")
        // Cerrar modal de edición
        setIsFormOpen(false)
        setEditingUser(null)
      } else {
        const newUser = await usersService.createUser(formData)
        setUsers([...users, newUser])
        alert("Usuario creado exitosamente")
        // Volver al dashboard
        handleCancel()
      }
    } catch (error: any) {
      console.error("Error submitting form:", error)
      // Mostrar el mensaje de error del backend si está disponible
      const errorMessage = error?.message || error?.detail?.error?.message || "Error procesando formulario"
      alert(errorMessage)
    }
  }

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await usersService.listUsers(searchQuery.trim() || undefined)
        setUsers(data)
      } catch (error: any) {
        console.error("Error loading users:", error)
        // Mostrar mensaje de error más claro
        if (error?.isNetworkError || error?.message?.includes("Failed to fetch")) {
          console.error("Error de conexión: Verifica que el backend esté corriendo en http://127.0.0.1:8000")
        }
        setError(error?.message || "Error al cargar usuarios")
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [searchQuery])
  
  // Inicializar formulario cuando se selecciona "create"
  useEffect(() => {
    if (selectedAction === "create" && editingUser === null) {
      setFormData({
        name: "",
        email: "",
        role: "SUPERVISOR",
        branch: "",
        password: "",
        active: true,
      })
    }
    // Si no hay acción seleccionada, limpiar el formulario
    if (selectedAction === null) {
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        role: "SUPERVISOR",
        branch: "",
        password: "",
        active: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction])

  // Calcular métricas para el dashboard (siempre se ejecutan)
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.active).length
  const inactiveUsers = users.filter(u => !u.active).length
  const adminUsers = users.filter(u => u.role === "ADMIN").length
  const ventasUsers = users.filter(u => u.role === "VENTAS").length
  const inventariosUsers = users.filter(u => u.role === "INVENTARIOS").length
  const supervisorUsers = users.filter(u => u.role === "SUPERVISOR").length
  
  // Calcular usuarios nuevos en los últimos 30 días
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const newUsersLast30Days = users.filter(u => {
    const regDate = new Date(u.createdAt)
    return regDate >= thirtyDaysAgo
  }).length

  // Datos para gráfico de usuarios por rol
  const roleData = useMemo(() => [
    { name: "Admin", value: adminUsers, color: "#8B5CF6" },
    { name: "Ventas", value: ventasUsers, color: "#3B82F6" },
    { name: "Inventarios", value: inventariosUsers, color: "#10B981" },
    { name: "Supervisor", value: supervisorUsers, color: "#F59E0B" },
  ], [adminUsers, ventasUsers, inventariosUsers, supervisorUsers, totalUsers])

  // Datos para gráfico de usuarios por estado
  const statusData = useMemo(() => [
    { name: "Activos", value: activeUsers, color: "#10B981" },
    { name: "Inactivos", value: inactiveUsers, color: "#6B7280" },
  ], [activeUsers, inactiveUsers])

  // Datos para gráfico de tendencias mensuales
  const monthlyUsersData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"]
    return months.map((month, index) => ({
      month,
      usuarios: Math.floor(Math.random() * 10) + 20 + (index * 1),
      nuevos: Math.floor(Math.random() * 3) + 1,
    }))
  }, [])

  const handleToggleStatus = async (user: AdminUser) => {
    const action = user.active ? "deshabilitar" : "habilitar"
    const message = user.active 
      ? "¿Desea deshabilitar este usuario? El usuario no podrá iniciar sesión."
      : "¿Desea habilitar este usuario? El usuario podrá iniciar sesión nuevamente."
    
    if (confirm(message)) {
      try {
        await usersService.updateUser(user.id, { active: !user.active })
        setUsers(users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)))
        alert(`Usuario ${action === "deshabilitar" ? "deshabilitado" : "habilitado"} exitosamente`)
      } catch (error) {
        console.error(`Error ${action} user:`, error)
        alert(`Error al ${action} el usuario`)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-BO")
  }

  // Renderizar dashboard de usuarios
  const renderDashboard = () => {
    const PURPLE_COLORS = {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      light: "#C4B5FD",
      dark: "#6D28D9",
      accent: "#EDE9FE",
    }
    const WHITE = "#FFFFFF"

    return (
      <div className="space-y-6 p-6" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Fila Superior: Widgets Grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usuarios por Rol */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Usuarios por Rol
              </h3>
              <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
                <option>Último Mes</option>
                <option>Último Año</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {totalUsers}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  +6%
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Total de usuarios registrados
              </p>
            </div>
            <ChartContainer
              config={{
                "Admin": { color: PURPLE_COLORS.primary },
                "Staff": { color: "#3B82F6" },
                "Otros": { color: "#6B7280" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>

          {/* Distribución por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm bg-white border"
            style={{ borderColor: PURPLE_COLORS.accent }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
                Estado de Usuarios
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: PURPLE_COLORS.dark }}>
                  {activeUsers}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
                  Activos
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {((activeUsers / totalUsers) * 100).toFixed(1)}% del total
              </p>
            </div>
            <ChartContainer
              config={{
                "Activos": { color: "#10B981" },
                "Inactivos": { color: "#6B7280" },
              }}
              className="h-[250px]"
            >
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: WHITE,
                    border: `1px solid ${PURPLE_COLORS.accent}`,
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ChartContainer>
          </motion.div>
        </div>

        {/* Fila Media: KPI Cards - Primera Fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Usuarios"
            value={totalUsers}
            subtitle="Usuarios del sistema"
            icon={Users}
            change={{ value: 6.2, label: "vs. período anterior" }}
            color="success"
            delay={0.2}
          />
          <KPICard
            title="Usuarios Activos"
            value={activeUsers}
            subtitle="Usuarios activos"
            icon={UserCheck}
            change={{ value: 8.5, label: "vs. período anterior" }}
            color="success"
            delay={0.3}
          />
          <KPICard
            title="Usuarios Inactivos"
            value={inactiveUsers}
            subtitle="Usuarios desactivados"
            icon={UserX}
            color="warning"
            delay={0.4}
          />
          <KPICard
            title="Usuarios Nuevos (30 días)"
            value={newUsersLast30Days}
            subtitle="Registrados este mes"
            icon={Calendar}
            change={{ value: 12.1, label: "vs. período anterior" }}
            color="info"
            delay={0.5}
          />
        </div>

        {/* Segunda Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Administradores"
            value={adminUsers}
            subtitle="Rol ADMIN"
            icon={Shield}
            color="primary"
            delay={0.6}
          />
          <KPICard
            title="Ventas"
            value={ventasUsers}
            subtitle="Rol VENTAS"
            icon={ShoppingCart}
            color="info"
            delay={0.7}
          />
          <KPICard
            title="Inventarios"
            value={inventariosUsers}
            subtitle="Rol INVENTARIOS"
            icon={Package}
            color="success"
            delay={0.8}
          />
          <KPICard
            title="Supervisores"
            value={supervisorUsers}
            subtitle="Rol SUPERVISOR"
            icon={Eye}
            color="warning"
            delay={0.9}
          />
        </div>

        {/* Tercera Fila de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tasa de Actividad"
            value={`${totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%`}
            subtitle="Usuarios activos vs. total"
            icon={TrendingUp}
            change={{ value: 3.5, label: "vs. período anterior" }}
            color="success"
            delay={1.0}
          />
          <KPICard
            title="Distribución por Rol"
            value={`${totalUsers > 0 ? Math.round((adminUsers / totalUsers) * 100) : 0}% Admin`}
            subtitle="Mayoría: ADMIN"
            icon={BarChart3}
            color="info"
            delay={1.1}
          />
        </div>

        {/* Fila Inferior: Tendencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl p-6 shadow-sm bg-white border"
          style={{ borderColor: PURPLE_COLORS.accent }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: PURPLE_COLORS.dark }}>
              Tendencias de Usuarios
            </h3>
            <select className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: PURPLE_COLORS.accent }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PURPLE_COLORS.primary }}></div>
              <span style={{ color: "#6B7280" }}>Total Usuarios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
              <span style={{ color: "#6B7280" }}>Nuevos</span>
            </div>
          </div>
          <ChartContainer
            config={{
              usuarios: { color: PURPLE_COLORS.primary },
              nuevos: { color: "#3B82F6" },
            }}
            className="h-[300px]"
          >
            <LineChart data={monthlyUsersData}>
              <CartesianGrid strokeDasharray="3 3" stroke={PURPLE_COLORS.accent} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: WHITE,
                  border: `1px solid ${PURPLE_COLORS.accent}`,
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="usuarios" 
                stroke={PURPLE_COLORS.primary} 
                strokeWidth={2}
                dot={{ fill: PURPLE_COLORS.primary, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="nuevos" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </motion.div>
      </div>
    )
  }

  // Renderizar lista de usuarios
  const renderUsersList = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg overflow-hidden border"
        style={{
          backgroundColor: "var(--admin-surface-light)",
          borderColor: "var(--admin-border)",
        }}
      >
        {/* Barra de búsqueda */}
        <div className="p-4 border-b" style={{ borderColor: "var(--admin-border)" }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              size={18} 
              style={{ color: "var(--admin-text-tertiary)" }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                borderColor: "var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center" style={{ color: "var(--admin-text-tertiary)" }}>
            Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  borderBottom: `1px solid var(--admin-border)`,
                }}
              >
                <tr style={{ color: "var(--admin-text-secondary)" }}>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Sucursal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ color: "var(--admin-text-primary)" }}>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{
                      borderBottom: `1px solid var(--admin-border)`,
                    }}
                  >
                    <td className="px-6 py-4 text-sm">{user.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: "var(--admin-surface-medium)",
                          color: "var(--admin-primary)",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.branch || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: user.active ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                          color: user.active ? "var(--admin-success)" : "var(--admin-text-tertiary)",
                        }}
                      >
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="transition-colors"
                          style={{ color: "var(--admin-text-tertiary)" }}
                          title="Editar"
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-primary)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-tertiary)")}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="transition-colors"
                          style={{ color: "var(--admin-text-tertiary)" }}
                          title="Restablecer contraseña"
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-warning)")
                          }
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-tertiary)")}
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="transition-colors"
                          style={{ color: "var(--admin-text-tertiary)" }}
                          title={user.active ? "Deshabilitar usuario" : "Habilitar usuario"}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = user.active ? "var(--admin-error)" : "var(--admin-success)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-tertiary)")}
                        >
                          {user.active ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    )
  }

  const renderCreateForm = () => {
    return (
      <motion.div
        key="create-user-form"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-6"
        style={{
          backgroundColor: "var(--admin-surface-light)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--admin-text-primary)" }}>
            Nuevo Usuario
          </h2>
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  border: `1px solid var(--admin-border)`,
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  border: `1px solid var(--admin-border)`,
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
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
                Rol *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((roleKey) => {
                  const config = ROLE_CONFIG[roleKey]
                  const Icon = config.icon
                  const isSelected = formData.role === roleKey
                  
                  return (
                    <motion.button
                      key={roleKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: roleKey })}
                      className="relative rounded-lg p-2.5 transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? config.bgColor : "var(--admin-surface-medium)",
                        border: `2px solid ${isSelected ? config.borderColor : "var(--admin-border)"}`,
                        boxShadow: isSelected ? `0 0 0 2px ${config.borderColor}20` : "none",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: isSelected ? config.color : "var(--admin-surface-light)",
                            color: isSelected ? "#FFFFFF" : config.color,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p
                            className="font-semibold text-xs"
                            style={{ color: isSelected ? config.color : "var(--admin-text-primary)" }}
                          >
                            {config.label}
                          </p>
                          <p
                            className="text-[10px] mt-0.5 leading-tight"
                            style={{ color: "var(--admin-text-tertiary)" }}
                          >
                            {config.description}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                            style={{ color: config.color }}
                          >
                            <CheckCircle size={16} fill="currentColor" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                Contraseña *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mín. 8 caracteres"
                className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  border: `1px solid var(--admin-border)`,
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
              <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
                Mínimo 8 caracteres
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                Sucursal
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full rounded px-3 py-2 focus:outline-none"
                style={{
                  backgroundColor: "var(--admin-surface-medium)",
                  border: `1px solid var(--admin-border)`,
                  color: "var(--admin-text-primary)",
                }}
              >
                <option value="">Seleccionar sucursal</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="La Paz">La Paz</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="active-create"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active-create" className="text-sm font-medium" style={{ color: "var(--admin-text-primary)" }}>
                Usuario activo
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--admin-surface-medium)",
                color: "var(--admin-text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--admin-surface-light)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg transition-colors"
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
              Crear Usuario
            </button>
          </div>
        </form>
      </motion.div>
    )
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await usersService.updateUser(userId, { role: newRole as "ADMIN" | "VENTAS" | "INVENTARIOS" | "SUPERVISOR" })
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as "ADMIN" | "VENTAS" | "INVENTARIOS" | "SUPERVISOR" } : u)))
      alert("Rol actualizado exitosamente")
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Error al actualizar el rol")
    }
  }

  const renderRolesForm = () => {
    return (
      <motion.div
        key="roles-form"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="rounded-lg p-6" style={{
          backgroundColor: "var(--admin-surface-light)",
          border: "1px solid var(--admin-border)",
        }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>
            Asignar Roles
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--admin-text-secondary)" }}>
            Configura los permisos y roles de los usuarios del sistema. Los cambios se aplican inmediatamente.
          </p>

          {loading ? (
            <div className="text-center py-8" style={{ color: "var(--admin-text-secondary)" }}>
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--admin-text-secondary)" }}>
              No hay usuarios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid var(--admin-border)` }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--admin-text-secondary)" }}>
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--admin-text-secondary)" }}>
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--admin-text-secondary)" }}>
                      Rol Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--admin-text-secondary)" }}>
                      Nuevo Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--admin-text-secondary)" }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{
                        borderBottom: `1px solid var(--admin-border)`,
                      }}
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--admin-text-primary)" }}>
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--admin-text-secondary)" }}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: "var(--admin-surface-medium)",
                            color: "var(--admin-primary)",
                          }}
                        >
                          {user.role === "ADMIN" ? "Administrador" : 
                           user.role === "VENTAS" ? "Ventas" : 
                           user.role === "INVENTARIOS" ? "Inventarios" : 
                           user.role === "SUPERVISOR" ? "Supervisor" : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-3 py-2 rounded text-sm focus:outline-none"
                          style={{
                            backgroundColor: "var(--admin-surface-medium)",
                            border: `1px solid var(--admin-border)`,
                            color: "var(--admin-text-primary)",
                          }}
                        >
                          <option value="ADMIN">Administrador</option>
                          <option value="VENTAS">Ventas</option>
                          <option value="INVENTARIOS">Inventarios</option>
                          <option value="SUPERVISOR">Supervisor</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: user.active ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                            color: user.active ? "var(--admin-success)" : "var(--admin-text-tertiary)",
                          }}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderContent = () => {
    if (selectedAction === null) {
      return renderDashboard()
    }
    if (selectedAction === "list") {
      return renderUsersList()
    }
    if (selectedAction === "create") {
      return renderCreateForm()
    }
    if (selectedAction === "roles") {
      return renderRolesForm()
    }
    return renderUsersList()
  }

  return (
    <div className="space-y-6" style={{ color: "var(--admin-text-primary)" }}>
      <div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--admin-text-primary)" }}>Usuarios</h1>
        <p className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>
          Gestiona los usuarios del sistema y sus permisos
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-4 border border-red-500 bg-red-50">
          <p className="text-red-700 font-semibold mb-1">Error al cargar usuarios</p>
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <div className="text-red-500 text-xs mb-3">
            <p className="mb-1">Verifica que:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>El backend esté corriendo en http://127.0.0.1:8000</li>
              <li>Tengas permisos de administrador</li>
              <li>Tu sesión esté activa</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setError(null)
              window.location.reload()
            }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--admin-primary)" }}></div>
        </div>
      )}

      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="rounded-lg p-5 w-full max-w-md border"
              style={{
                backgroundColor: "var(--admin-surface-light)",
                borderColor: "var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                <button
                  onClick={handleCloseForm}
                  type="button"
                  className="transition-colors"
                  style={{ color: "var(--admin-text-tertiary)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-primary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-tertiary)")}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
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
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--admin-text-secondary)" }}>
                    Rol
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map((roleKey) => {
                      const config = ROLE_CONFIG[roleKey]
                      const Icon = config.icon
                      const isSelected = formData.role === roleKey
                      
                      return (
                        <motion.button
                          key={roleKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: roleKey })}
                          className="relative rounded-lg p-2.5 transition-all cursor-pointer"
                          style={{
                            backgroundColor: isSelected ? config.bgColor : "var(--admin-surface-medium)",
                            border: `2px solid ${isSelected ? config.borderColor : "var(--admin-border)"}`,
                            boxShadow: isSelected ? `0 0 0 2px ${config.borderColor}20` : "none",
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center text-center space-y-1.5">
                            <div
                              className="p-2 rounded-md"
                              style={{
                                backgroundColor: isSelected ? config.color : "var(--admin-surface-light)",
                                color: isSelected ? "#FFFFFF" : config.color,
                              }}
                            >
                              <Icon size={18} />
                            </div>
                            <div>
                              <p
                                className="font-semibold text-xs"
                                style={{ color: isSelected ? config.color : "var(--admin-text-primary)" }}
                              >
                                {config.label}
                              </p>
                              <p
                                className="text-[10px] mt-0.5 leading-tight"
                                style={{ color: "var(--admin-text-tertiary)" }}
                              >
                                {config.description}
                              </p>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1"
                                style={{ color: config.color }}
                              >
                                <CheckCircle size={16} fill="currentColor" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--admin-text-secondary)" }}>
                    Contraseña {!editingUser && "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Dejar vacío para mantener" : "Mín. 8 caracteres"}
                    className="w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
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
                  {!editingUser && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
                      Mínimo 8 caracteres
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                    Sucursal
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full rounded px-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
                      color: "var(--admin-text-primary)",
                    }}
                  >
                    <option value="">Seleccionar sucursal</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="La Paz">La Paz</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Activo
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      color: "var(--admin-text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--admin-surface-light)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--admin-surface-medium)"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--admin-primary)",
                      color: "#FFFFFF",
                    }}
                  >
                    {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
