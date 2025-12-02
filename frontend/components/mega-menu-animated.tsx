"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ArrowRight } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const NUESTROS_PRODUCTOS = {
  name: "Nuestros Productos",
  href: "/catalogo",
}

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
  const [fixedMenuWidth, setFixedMenuWidth] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const getActiveCategoryIndex = () => {
    const categoryIndex = CATEGORIES.findIndex((cat) => pathname.startsWith(cat.href))
    return categoryIndex !== -1 ? categoryIndex : null
  }

  // Calcular el ancho del primer botón una vez al montar
  useEffect(() => {
    const firstButton = buttonRefs.current[0]
    if (firstButton && !fixedMenuWidth) {
      const width = firstButton.getBoundingClientRect().width
      setFixedMenuWidth(width)
    }
  }, [fixedMenuWidth])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
    }
  }, [])

  // Cerrar el menú cuando cambia la ruta - FORZAR CIERRE INMEDIATO SIN ANIMACIÓN
  useEffect(() => {
    setIsNavigating(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current)
      submenuTimeoutRef.current = null
    }
    setActiveCategory(null)
    setHoveredSubmenu(null)
    // Resetear el flag después de un breve delay
    const timer = setTimeout(() => setIsNavigating(false), 100)
    return () => clearTimeout(timer)
  }, [pathname])

  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const button = buttonRefs.current[index]
    if (button) {
      const rect = button.getBoundingClientRect()
      const navContainer = button.closest("nav")
      if (navContainer) {
        const navRect = navContainer.getBoundingClientRect()
        // Usar el ancho fijo del primer botón si está disponible, sino usar el ancho del botón actual
        const width = fixedMenuWidth || rect.width
        setMenuPosition({
          left: rect.left - navRect.left,
          width: width,
        })
      }
    }

    setActiveCategory(index)
    setHoveredSubmenu(null)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
      setHoveredSubmenu(null)
    }, 100)
  }

  const handleMouseLeaveItem = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
      setHoveredSubmenu(null)
    }, 100)
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
  
  // Si el pathname cambió, no mostrar el menú en absoluto
  const shouldShowMenu = !isNavigating && activeCategory !== null && currentCategory && currentCategory.items.length > 0

  return (
    <nav className="relative bg-neutral-900" aria-label="Navegación principal" onMouseLeave={handleMouseLeave}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Fila única: Nuestros Productos y Categorías */}
        <ul className="flex items-center justify-center gap-2 overflow-x-auto py-2.5">
          {/* Nuestros Productos como primer elemento */}
          <li className="relative">
            <Link
              href={NUESTROS_PRODUCTOS.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded-lg ${
                pathname.startsWith(NUESTROS_PRODUCTOS.href) 
                  ? "bg-[var(--storefront-brand)] py-4" 
                  : "py-3 hover:bg-[var(--storefront-brand)] hover:rounded-lg"
              }`}
              onMouseEnter={() => {
                // Cerrar cualquier menú abierto cuando se hace hover sobre "Nuestros Productos"
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                setActiveCategory(null)
                setHoveredSubmenu(null)
              }}
            >
              <span>{NUESTROS_PRODUCTOS.name}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </li>
          {CATEGORIES.map((category, index) => (
            <li 
              key={category.name} 
              className="relative"
              onMouseLeave={handleMouseLeaveItem}
            >
              <Link
                href={category.href}
                ref={(el) => {
                  buttonRefs.current[index] = el as any
                }}
                className={`block whitespace-nowrap px-4 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded-lg ${
                  /* Updated to use CSS variable for brand color */
                  activeCategoryIndex === index 
                    ? "bg-[var(--storefront-brand)] py-4" 
                    : "py-3 hover:bg-[var(--storefront-brand)] hover:rounded-lg"
                }`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeaveItem}
                onKeyDown={(e) => handleKeyDown(e as any, index)}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {shouldShowMenu && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -4, pointerEvents: "none" },
              visible: { opacity: 1, y: 0, pointerEvents: "auto", transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] } },
              exit: { opacity: 0, y: -4, pointerEvents: "none", transition: { duration: 0.05, ease: [0.16, 1, 0.3, 1] } },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full mt-1 z-30 bg-white shadow-lg border border-neutral-300 border-l-2 border-l-[var(--storefront-brand)] rounded-lg"
            style={{
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
            }}
            onMouseLeave={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              timeoutRef.current = setTimeout(() => {
                setActiveCategory(null)
                setHoveredSubmenu(null)
              }, 100)
            }}
          >
            <div className="p-3">
              <div className="space-y-0">
                {currentCategory.items.map((item, idx) => (
                  <div 
                    key={item.name} 
                    className={`relative ${idx < currentCategory.items.length - 1 ? "border-b border-neutral-300" : ""}`}
                    onMouseEnter={() => {
                      if (item.hasSubmenu) {
                        if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
                        setHoveredSubmenu(item.name)
                      }
                    }}
                    onMouseLeave={() => {
                      // Delay para permitir que el cursor se mueva al submenu
                      if (item.hasSubmenu) {
                        submenuTimeoutRef.current = setTimeout(() => {
                          setHoveredSubmenu(null)
                        }, 200)
                      }
                    }}
                  >
                    {item.hasSubmenu ? (
                      <div className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-[13px] transition-colors group ${
                        pathname.startsWith(item.href) 
                          ? "bg-[var(--storefront-brand)] text-white" 
                          : "text-neutral-800 hover:bg-neutral-100"
                      }`}>
                        <Link
                          href={item.href}
                          className="flex-1"
                          onClick={() => {
                            if (timeoutRef.current) clearTimeout(timeoutRef.current)
                            if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
                            setActiveCategory(null)
                            setHoveredSubmenu(null)
                          }}
                        >
                          <span>{item.name}</span>
                        </Link>
                        <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ml-2 ${
                          pathname.startsWith(item.href) ? "text-white" : ""
                        }`} style={pathname.startsWith(item.href) ? {} : { color: "var(--storefront-brand)" }} />
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex w-full items-center justify-between rounded px-3 py-2.5 text-[13px] transition-colors ${
                          pathname.startsWith(item.href)
                            ? "bg-[var(--storefront-brand)] text-white"
                            : "text-neutral-800 hover:bg-neutral-100"
                        }`}
                        onClick={() => {
                          if (timeoutRef.current) clearTimeout(timeoutRef.current)
                          if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
                          setActiveCategory(null)
                          setHoveredSubmenu(null)
                        }}
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
                        className="absolute left-full top-0 ml-2 flex flex-col gap-2.5 w-max z-50"
                        onMouseEnter={() => {
                          // Cancelar el timeout cuando el cursor entra al submenu
                          if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
                          setHoveredSubmenu(item.name)
                        }}
                        onMouseLeave={() => {
                          // Cerrar el submenu cuando el cursor sale completamente
                          submenuTimeoutRef.current = setTimeout(() => {
                            setHoveredSubmenu(null)
                          }, 150)
                        }}
                      >
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className="inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: "var(--storefront-cta)" }}
                            onClick={() => {
                              if (timeoutRef.current) clearTimeout(timeoutRef.current)
                              if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current)
                              setActiveCategory(null)
                              setHoveredSubmenu(null)
                            }}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                    
                    {idx < currentCategory.items.length - 1 && (
                      <div className="my-1 mx-2 h-px bg-neutral-300" />
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
