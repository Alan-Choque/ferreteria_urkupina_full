"use client"

import { Search, User, MapPin, LogOut, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      if (!authService.isAuthenticated()) {
        setLoadingUser(false)
        return
      }
      try {
        const user = await authService.getCurrentUser()
        if (active) {
          setCurrentUser(user)
        }
      } catch (error) {
        authService.logout()
      } finally {
        if (active) {
          setLoadingUser(false)
        }
      }
    }

    loadUser()
    return () => {
      active = false
    }
  }, [])

  const handleLogout = () => {
    setShowUserMenu(false)
    authService.logout()
  }

  const displayName = currentUser?.name || currentUser?.email

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top banner - estilo FERRETEK */}
      <div className="bg-gradient-to-r from-purple-600 via-red-600 to-red-500 text-white py-0.5">
        <div className="max-w-7xl mx-auto px-3 text-center text-[12px] leading-5">
          <Link href="/sucursales" className="font-medium hover:underline">
            Haz Seguimiento de tu Compra. ¡AQUÍ!
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
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
              <button
                type="submit"
                aria-label="Buscar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-500 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0 text-sm">
            <Link
              href="/sucursales"
              className="hidden md:flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors"
              aria-label="Ver sucursales"
            >
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Sucursales</span>
            </Link>
            <Link
              href="/sobre-nosotros"
              className="hidden lg:flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors"
              aria-label="Sobre nosotros"
            >
              <span className="font-medium">Sobre Nosotros</span>
            </Link>

            <div className="relative">
              {loadingUser ? (
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <div className="h-5 w-5 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="hidden lg:block h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                </div>
              ) : currentUser ? (
                <>
                  <button
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-800 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm"
                  >
                    <div className="bg-orange-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-semibold uppercase">
                      {(displayName ?? "U").slice(0, 1)}
                    </div>
                    <span className="hidden lg:inline font-medium">{displayName}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-50">
                      <a
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Mi cuenta
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <a href="/login" className="flex items-center gap-1.5 text-neutral-800 hover:text-orange-600 transition-colors">
                    <User className="w-4 h-4" />
                    <span className="font-medium hidden lg:inline">Iniciar sesión</span>
                  </a>
                  <span className="text-neutral-400 hidden lg:inline">|</span>
                  <a href="/register" className="font-medium text-neutral-800 hover:text-orange-600 transition-colors hidden lg:inline">
                    Registrarse
                  </a>
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
