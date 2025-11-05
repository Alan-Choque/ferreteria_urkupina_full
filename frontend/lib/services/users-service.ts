// Mock users and roles service
import type { User, ID } from "@/lib/contracts"

let users: User[] = [
  {
    id: "user-1",
    email: "admin@ferretek.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    active: true,
  },
  {
    id: "user-2",
    email: "manager@ferretek.com",
    firstName: "Manager",
    lastName: "User",
    role: "manager",
    branchId: "branch-1",
    active: true,
  },
]

let nextId = 3

export const usersService = {
  async listUsers() {
    await new Promise((r) => setTimeout(r, 300))
    return users
  },

  async getUser(id: ID) {
    await new Promise((r) => setTimeout(r, 200))
    return users.find((u) => u.id === id)
  },

  async createUser(data: Omit<User, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newUser: User = {
      ...data,
      id: `user-${nextId++}`,
    }
    users.push(newUser)
    return newUser
  },

  async updateUser(id: ID, data: Partial<User>) {
    await new Promise((r) => setTimeout(r, 400))
    const user = users.find((u) => u.id === id)
    if (!user) throw new Error("Usuario no encontrado")
    Object.assign(user, data)
    return user
  },

  async deleteUser(id: ID) {
    await new Promise((r) => setTimeout(r, 300))
    users = users.filter((u) => u.id !== id)
  },
}
