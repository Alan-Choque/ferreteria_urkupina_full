"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usersService } from "@/lib/services/users-service"
import { Plus, Edit2, Trash2, RotateCcw, X, Ban, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { AdminUser } from "@/lib/types/admin"

type FormData = Omit<AdminUser, "id" | "createdAt">

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    role: "staff",
    branch: "",
    password: "",
    active: true,
  })

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "staff",
      branch: "",
      password: "",
      active: true,
    })
    setIsFormOpen(true)
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
      } else {
        const newUser = await usersService.createUser(formData)
        setUsers([...users, newUser])
      }
      setIsFormOpen(false)
      alert(editingUser ? "Usuario actualizado" : "Usuario creado exitosamente")
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error procesando formulario")
    }
  }

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await usersService.listUsers()
        setUsers(data)
      } catch (error) {
        console.error("Error loading users:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
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

  return (
    <div className="space-y-6" style={{ color: "var(--admin-text-primary)" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          style={{
            backgroundColor: "var(--admin-primary)",
            color: "#FFFFFF",
          }}
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg overflow-hidden border"
        style={{
          backgroundColor: "var(--admin-surface-light)",
          borderColor: "var(--admin-border)",
        }}
      >
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
              className="rounded-lg p-6 w-full max-w-md border"
              style={{
                backgroundColor: "var(--admin-surface-light)",
                borderColor: "var(--admin-border)",
                color: "var(--admin-text-primary)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="transition-colors"
                  style={{ color: "var(--admin-text-tertiary)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-primary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--admin-text-tertiary)")}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded px-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
                      color: "var(--admin-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded px-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
                      color: "var(--admin-text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded px-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
                      color: "var(--admin-text-primary)",
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Gerente</option>
                    <option value="staff">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--admin-text-secondary)" }}>
                    Contraseña {!editingUser && "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
                    className="w-full rounded px-3 py-2 focus:outline-none"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      border: `1px solid var(--admin-border)`,
                      color: "var(--admin-text-primary)",
                    }}
                  />
                  {!editingUser && (
                    <p className="text-xs mt-1" style={{ color: "var(--admin-text-tertiary)" }}>
                      La contraseña es obligatoria para nuevos usuarios
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
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--admin-surface-medium)",
                      color: "var(--admin-text-primary)",
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
