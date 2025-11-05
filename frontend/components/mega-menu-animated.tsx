"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const CATEGORIES = [
  {
    name: "Herramientas de Construcción",
    href: "/categorias/herramientas-construccion",
    items: [
      { name: "Herramientas de Carpintería", href: "/categorias/herramientas-construccion/carpinteria" },
      {
        name: "Herramientas Eléctricas",
        href: "/categorias/herramientas-construccion/electricas",
        hasSubmenu: true,
        submenu: [
          { name: "Taladros", href: "/categorias/herramientas-construccion/taladros" },
          { name: "Atornilladores", href: "/categorias/herramientas-construccion/atornilladores" },
          { name: "Sierras Eléctricas", href: "/categorias/herramientas-construccion/sierras" },
        ],
      },
      {
        name: "Herramientas Inalámbricas",
        href: "/categorias/herramientas-construccion/inalambricas",
        hasSubmenu: true,
        submenu: [
          { name: "Esmeriles", href: "/categorias/herramientas-construccion/esmeriles" },
          { name: "Taladros", href: "/categorias/herramientas-construccion/taladros" },
          { name: "Atornilladores", href: "/categorias/herramientas-construccion/atornilladores" },
        ],
      },
      {
        name: "Herramientas Manuales",
        href: "/categorias/herramientas-construccion/manuales",
        hasSubmenu: true,
        submenu: [
          { name: "Martillos", href: "/categorias/herramientas-construccion/martillos" },
          { name: "Destornilladores", href: "/categorias/herramientas-construccion/destornilladores" },
          { name: "Llaves", href: "/categorias/herramientas-construccion/llaves" },
        ],
      },
      { name: "Medición y Nivelación", href: "/categorias/herramientas-construccion/medicion" },
      { name: "Herramientas Dremel", href: "/categorias/herramientas-construccion/dremel" },
      { name: "Herramientas Varias", href: "/categorias/herramientas-construccion/varias" },
    ],
  },
  {
    name: "Equipos de Industria y Taller",
    href: "/categorias/equipos-industria",
    items: [
      {
        name: "Bombas de Agua y Motobombas",
        href: "/categorias/equipos-industria/bombas",
        hasSubmenu: true,
        submenu: [
          { name: "Bombas Centrífugas", href: "/categorias/equipos-industria/centrifugas" },
          { name: "Bombas Sumergibles", href: "/categorias/equipos-industria/sumergibles" },
          { name: "Motobombas", href: "/categorias/equipos-industria/motobombas" },
        ],
      },
      {
        name: "Equipos de Generación",
        href: "/categorias/equipos-industria/generacion",
        hasSubmenu: true,
        submenu: [
          { name: "Generadores Gasolina", href: "/categorias/equipos-industria/gasolina" },
          { name: "Generadores Diésel", href: "/categorias/equipos-industria/diesel" },
          { name: "Generadores Inverter", href: "/categorias/equipos-industria/inverter" },
        ],
      },
      { name: "Equipos de Izaje", href: "/categorias/equipos-industria/izaje" },
      {
        name: "Equipos de Soldadura",
        href: "/categorias/equipos-industria/soldadura",
        hasSubmenu: true,
        submenu: [
          { name: "Soldadoras MIG", href: "/categorias/equipos-industria/mig" },
          { name: "Soldadoras TIG", href: "/categorias/equipos-industria/tig" },
          { name: "Soldadoras Arco", href: "/categorias/equipos-industria/arco" },
        ],
      },
      { name: "Taller Automotriz", href: "/categorias/equipos-industria/automotriz" },
      { name: "Varios", href: "/categorias/equipos-industria/varios" },
    ],
  },
  {
    name: "Aseo y Jardín",
    href: "/categorias/aseo-jardin",
    items: [
      { name: "Cortadoras de Césped", href: "/categorias/aseo-jardin/cortadoras" },
      { name: "Motosierras", href: "/categorias/aseo-jardin/motosierras" },
      { name: "Bordeadoras", href: "/categorias/aseo-jardin/bordeadoras" },
      { name: "Sopladores", href: "/categorias/aseo-jardin/sopladores" },
      { name: "Mangueras y Riego", href: "/categorias/aseo-jardin/mangueras" },
      { name: "Herramientas de Jardín", href: "/categorias/aseo-jardin/herramientas" },
      { name: "Productos de Limpieza", href: "/categorias/aseo-jardin/limpieza" },
    ],
  },
  {
    name: "Insumos y Accesorios",
    href: "/categorias/insumos-accesorios",
    items: [
      { name: "Tornillos y Pernos", href: "/categorias/insumos-accesorios/tornillos" },
      { name: "Clavos", href: "/categorias/insumos-accesorios/clavos" },
      { name: "Adhesivos y Pegamentos", href: "/categorias/insumos-accesorios/adhesivos" },
      { name: "Cintas y Selladores", href: "/categorias/insumos-accesorios/cintas" },
      { name: "Cables y Alambres", href: "/categorias/insumos-accesorios/cables" },
      { name: "Accesorios Eléctricos", href: "/categorias/insumos-accesorios/electricos" },
      { name: "Seguridad Industrial", href: "/categorias/insumos-accesorios/seguridad" },
    ],
  },
  {
    name: "Pintura",
    href: "/categorias/pintura",
    items: [
      { name: "Pinturas Interiores", href: "/categorias/pintura/interiores" },
      { name: "Pinturas Exteriores", href: "/categorias/pintura/exteriores" },
      { name: "Esmaltes Sintéticos", href: "/categorias/pintura/esmaltes" },
      { name: "Barnices y Lacas", href: "/categorias/pintura/barnices" },
      { name: "Brochas y Pinceles", href: "/categorias/pintura/brochas" },
      { name: "Rodillos", href: "/categorias/pintura/rodillos" },
      { name: "Accesorios de Pintura", href: "/categorias/pintura/accesorios" },
    ],
  },
  {
    name: "Outlet",
    href: "/categorias/outlet",
    items: [
      { name: "Herramientas en Oferta", href: "/categorias/outlet/herramientas" },
      { name: "Equipos en Descuento", href: "/categorias/outlet/equipos" },
      { name: "Ofertas Especiales", href: "/categorias/outlet/especiales" },
      { name: "Combos y Kits", href: "/categorias/outlet/combos" },
    ],
  },
]

const panelVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.08, ease: [0.16, 1, 0.3, 1] } },
}

export default function MegaMenuAnimated() {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ left: 0, width: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const getActiveCategoryIndex = () => {
    const categoryIndex = CATEGORIES.findIndex((cat) => pathname.startsWith(cat.href))
    return categoryIndex !== -1 ? categoryIndex : null
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const button = buttonRefs.current[index]
    if (button) {
      const rect = button.getBoundingClientRect()
      const navContainer = button.closest("nav")
      if (navContainer) {
        const navRect = navContainer.getBoundingClientRect()
        setMenuPosition({
          left: rect.left - navRect.left,
          width: rect.width,
        })
      }
    }

    setActiveCategory(index)
    setHoveredSubmenu(null)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
      setHoveredSubmenu(null)
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setActiveCategory(activeCategory === index ? null : index)
    } else if (e.key === "Escape") {
      setActiveCategory(null)
    }
  }

  const currentCategory = activeCategory !== null ? CATEGORIES[activeCategory] : null
  const activeCategoryIndex = getActiveCategoryIndex()

  return (
    <nav className="relative bg-neutral-900" aria-label="Navegación principal" onMouseLeave={handleMouseLeave}>
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((category, index) => (
            <li key={category.name} className="relative">
              <Link
                href={category.href}
                ref={(el) => {
                  buttonRefs.current[index] = el as any
                }}
                className={`block whitespace-nowrap px-4 py-3 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${
                  /* Updated to use CSS variable for brand color */
                  activeCategoryIndex === index ? "bg-[var(--storefront-brand)]" : "hover:bg-[var(--storefront-brand)]"
                }`}
                onMouseEnter={() => handleMouseEnter(index)}
                onKeyDown={(e) => handleKeyDown(e as any, index)}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {activeCategory !== null && currentCategory && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -4 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } },
              exit: { opacity: 0, y: -4, transition: { duration: 0.08, ease: [0.16, 1, 0.3, 1] } },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full z-50 bg-white shadow-lg border border-neutral-200"
            style={{
              left: `${menuPosition.left}px`,
              width: "350px",
            }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-4">
              <div className="space-y-1">
                {currentCategory.items.map((item) => (
                  <div key={item.name} className="relative">
                    {item.hasSubmenu ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-100"
                        onMouseEnter={() => setHoveredSubmenu(item.name)}
                        onMouseLeave={() => setHoveredSubmenu(null)}
                      >
                        <span>{item.name}</span>
                        <ChevronRight className="h-4 w-4" style={{ color: "var(--storefront-brand)" }} />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-100"
                        onClick={() => setActiveCategory(null)}
                      >
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {item.hasSubmenu && hoveredSubmenu === item.name && item.submenu && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.08 }}
                        className="absolute left-full top-0 ml-2 flex flex-col gap-2 w-max"
                        onMouseEnter={() => setHoveredSubmenu(item.name)}
                        onMouseLeave={() => setHoveredSubmenu(null)}
                      >
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className="inline-block rounded px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-80"
                            style={{ backgroundColor: "var(--storefront-cta)" }}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
