"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"

const navigationItems = [
  { label: "Perfil", href: "/account/profile" },
  { label: "Documentos", href: "/account/documents" },
  { label: "Direcciones", href: "/account/addresses" },
  { label: "Pedidos", href: "/account/orders" },
  { label: "Reservaciones", href: "/account/reservations" },
  { label: "Lista de Deseos", href: "/account/wishlist" },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Mi Cuenta</h1>

          <div className="grid grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <nav className="col-span-1">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      pathname === item.href ? "bg-red-600 text-white" : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Main Content */}
            <div className="col-span-3">{children}</div>
          </div>
        </div>
      </main>

      <footer className="bg-neutral-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-400 text-sm">
          <p>&copy; 2025 Ferretería Urkupina. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  )
}
