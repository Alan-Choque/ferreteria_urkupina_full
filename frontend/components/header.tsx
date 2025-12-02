"use client"

import { Search, User, MapPin, LogOut, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import MegaMenuAnimated from "./mega-menu-animated"
import { MiniCartButton } from "./cart/mini-cart-button"
import { ThemeSwitcher } from "./theme-switcher"
import { ApiHealthBadge } from "./api-health-badge"
import { authService } from "@/lib/services/auth-service"
import type { AdminUser } from "@/lib/types/admin"

export default function Header() {
  const [cartCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  const loadUser = async () => {
    if (!authService.isAuthenticated()) {
      setCurrentUser(null)
      setLoadingUser(false)
      return
    }
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      setCurrentUser(null)
      authService.logout()
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    loadUser()

    // Escuchar eventos de login/logout
    const handleAuthChange = () => {
      loadUser()
    }

    // Escuchar eventos personalizados de autenticación
    window.addEventListener("auth:login", handleAuthChange)
    window.addEventListener("auth:logout", handleAuthChange)
    window.addEventListener("storage", (e) => {
      if (e.key === "access_token" || e.key === "refresh_token") {
        handleAuthChange()
      }
    })

    return () => {
      window.removeEventListener("auth:login", handleAuthChange)
      window.removeEventListener("auth:logout", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [])

  // Recargar usuario cuando cambia la ruta (útil después del login)
  useEffect(() => {
    if (pathname && !pathname.startsWith("/admin")) {
      loadUser()
    }
  }, [pathname])

  const handleLogout = () => {
    setShowUserMenu(false)
    authService.logout()
  }

  const displayName = currentUser?.name || currentUser?.email

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 group">
              <div className="relative h-9 w-auto flex items-center flex-shrink-0">
                <img
                  src="/logo-urkupina.png"
                  alt="Logo Ferretería Urkupina"
                  className="object-contain h-full max-h-9"
                  onError={(e) => {
                    // Fallback si el logo no existe aún
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent && !parent.querySelector(".fallback-logo")) {
                      const fallback = document.createElement("div")
                      fallback.className = "bg-orange-600 text-white font-bold px-3 py-2 text-xl fallback-logo"
                      fallback.textContent = "FU"
                      parent.insertBefore(fallback, target)
                    }
                  }}
                />
              </div>
              <span className="text-neutral-900 font-bold text-xl hidden sm:inline whitespace-nowrap">FERRETERÍA URKUPINA</span>
            </Link>
          </motion.div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl">
            <form
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 shadow-sm"
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  router.push(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              }}
            >
              <label htmlFor="search" className="sr-only">
                Buscar productos
              </label>
              <input
                id="search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
              />
              <motion.button
                type="submit"
                aria-label="Buscar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0 text-sm">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/sucursales"
                className="hidden md:flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors"
                aria-label="Ver sucursales"
              >
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Sucursales</span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/sobre-nosotros"
                className="hidden lg:flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors"
                aria-label="Sobre nosotros"
              >
                <span className="font-medium">Sobre Nosotros</span>
              </Link>
            </motion.div>

            <div className="relative">
              {loadingUser ? (
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <div className="h-5 w-5 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="hidden lg:block h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                </div>
              ) : currentUser ? (
                <>
                  <motion.button
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <motion.div
                      className="bg-orange-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-semibold uppercase"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {(displayName ?? "U").slice(0, 1)}
                    </motion.div>
                    <span className="hidden lg:inline font-medium">{displayName}</span>
                    <motion.div
                      animate={{ rotate: showUserMenu ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50"
                      >
                        <motion.a
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <User className="w-4 h-4" />
                          Mi cuenta
                        </motion.a>
                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.a
                    href="/login"
                    className="flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium hidden lg:inline">Iniciar sesión</span>
                  </motion.a>
                  <span className="text-neutral-400 hidden lg:inline">|</span>
                  <motion.a
                    href="/register"
                    className="font-medium text-neutral-800 hover:text-orange-600 transition-colors hidden lg:inline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    Registrarse
                  </motion.a>
                </div>
              )}
            </div>

            <MiniCartButton />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <MegaMenuAnimated />
    </header>
  )
}
