// Mock settings service
import type { CompanySettings, Branch } from "@/lib/types/admin"

const settings: CompanySettings = {
  name: "Ferretería Urkupina",
  address: "Av. Camacho 1234, La Paz",
  nit: "12345678-0",
  branches: [
    {
      id: 1,
      name: "Matriz",
      address: "Av. Camacho 1234, La Paz",
      phone: "+591 2 1234567",
      email: "matriz@ferretek.com",
      manager: "Carlos López",
    },
  ],
  taxRate: 0.13,
  numberingSequence: {
    po: 1000,
    so: 2000,
    reservation: 3000,
  },
}

export const settingsService = {
  async getSettings() {
    await new Promise((r) => setTimeout(r, 200))
    return settings
  },

  async updateSettings(data: Partial<CompanySettings>) {
    await new Promise((r) => setTimeout(r, 400))
    Object.assign(settings, data)
    return settings
  },

  async createBranch(data: Omit<Branch, "id">) {
    await new Promise((r) => setTimeout(r, 400))
    const newBranch: Branch = {
      ...data,
      id: Math.max(...settings.branches.map((b) => b.id), 0) + 1,
    }
    settings.branches.push(newBranch)
    return newBranch
  },

  async updateBranch(id: number, data: Partial<Branch>) {
    await new Promise((r) => setTimeout(r, 400))
    const branch = settings.branches.find((b) => b.id === id)
    if (!branch) throw new Error("Branch not found")
    Object.assign(branch, data)
    return branch
  },

  async deleteBranch(id: number) {
    await new Promise((r) => setTimeout(r, 300))
    settings.branches = settings.branches.filter((b) => b.id !== id)
  },
}
