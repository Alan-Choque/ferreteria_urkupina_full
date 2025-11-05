// Mock authentication service
import type { AdminUser, UserRole } from "@/lib/types/admin"

const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@ferretek.com",
    role: "admin",
    branch: "Matriz",
    active: true,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Manager",
    email: "manager@ferretek.com",
    role: "manager",
    branch: "Sucursal 1",
    active: true,
    createdAt: new Date(),
  },
]

export const authService = {
  async login(email: string, password: string) {
    // Mock: just check email exists
    await new Promise((r) => setTimeout(r, 300))
    const user = mockUsers.find((u) => u.email === email)
    if (user) return user
    throw new Error("Invalid credentials")
  },

  async getCurrentUser() {
    // Mock: return first admin for demo
    await new Promise((r) => setTimeout(r, 200))
    return mockUsers[0]
  },

  hasPermission(role: UserRole, module: string, action: string) {
    if (role === "admin") return true
    if (role === "manager") return !action.includes("delete")
    if (role === "staff") return action === "view"
    return false
  },
}
