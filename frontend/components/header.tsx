"use client"

import { Search, User, MapPin } from "lucide-react"
import { useState } from "react"
import MegaMenuAnimated from "./mega-menu-animated"
import { MiniCartButton } from "./cart/mini-cart-button"
import { ThemeSwitcher } from "./theme-switcher"
import { ApiHealthBadge } from "./api-health-badge"

export default function Header() {
  const [cartCount] = useState(0)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center flex items-center justify-between">
          <p className="text-sm font-medium">Compra Ahora y Retira en nuestras Tiendas</p>
          <div className="flex items-center gap-4">
            <ApiHealthBadge />
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-red-600 text-white font-bold px-3 py-2 text-xl">FU</div>
            <span className="text-neutral-900 font-bold text-xl hidden sm:inline">FERRETERÍA URKUPINA</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl">
            <form className="relative" role="search">
              <label htmlFor="search" className="sr-only">
                Buscar productos
              </label>
              <input
                id="search"
                type="search"
                placeholder="¿Qué estás buscando?"
                className="w-full px-4 py-2.5 pr-12 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-0 top-0 h-full px-4 bg-red-600 text-white rounded-r hover:bg-red-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              className="hidden md:flex items-center gap-2 text-neutral-800 hover:text-red-600 transition-colors"
              aria-label="Seleccionar tienda"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">Tienda</span>
            </button>

            <a href="/login" className="flex items-center gap-2 text-neutral-800 hover:text-red-600 transition-colors">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:inline">
                Inicia sesión <span className="text-neutral-600">o</span> regístrate
              </span>
            </a>

            <MiniCartButton />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <MegaMenuAnimated />
    </header>
  )
}
