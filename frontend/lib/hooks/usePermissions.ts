import { useState, useEffect } from "react"
import { authService, canViewInventory, canUpdateStock, canManageProducts } from "@/lib/services/auth-service"
import type { AdminUser } from "@/lib/types/admin"

interface UserPermissions {
  canViewInventory: boolean
  canUpdateStock: boolean
  canManageProducts: boolean
  userRoles: string[]
}

export function usePermissions(): UserPermissions & { loading: boolean; user: AdminUser | null } {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState<string[]>([])

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        
        // Obtener roles del usuario
        // El objeto AdminUser tiene un campo 'roles' que es un array de strings
        let roles: string[] = []
        if (currentUser.roles && currentUser.roles.length > 0) {
          roles = currentUser.roles
        } else {
          // Si no hay roles explícitos, usar el rol mapeado como fallback
          roles = [currentUser.role.toUpperCase()]
        }
        
        setUserRoles(roles)
      } catch (error) {
        console.error("Error cargando usuario:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [])

  const permissions: UserPermissions = {
    canViewInventory: canViewInventory(userRoles),
    canUpdateStock: canUpdateStock(userRoles),
    canManageProducts: canManageProducts(userRoles),
    userRoles,
  }

  return {
    ...permissions,
    loading,
    user,
  }
}

