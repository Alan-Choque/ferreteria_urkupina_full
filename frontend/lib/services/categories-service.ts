// lib/services/categories-service.ts
import { api } from "@/lib/apiClient"

export interface Category {
  id: number
  nombre: string
  descripcion: string | null
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    return api.get<Category[]>("/categories", { requireAuth: false })
  },

  async getCategoryById(id: number): Promise<Category> {
    return api.get<Category>(`/categories/${id}`, { requireAuth: false })
  },
}

