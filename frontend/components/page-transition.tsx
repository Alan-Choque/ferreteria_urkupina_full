"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface PageTransitionProps {
  children: React.ReactNode
}

// Variantes de animación para diferentes tipos de transiciones
const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Curva de animación suave
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.96,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Variante más dramática para páginas especiales (login, registro, etc.)
const dramaticVariants = {
  initial: {
    opacity: 0,
    scale: 0.85,
    y: 50,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -50,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Variante de deslizamiento horizontal con efecto de profundidad
const slideVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 150 : -150,
    scale: 0.92,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      type: "spring",
      stiffness: 120,
      damping: 20,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -150 : 150,
    scale: 0.92,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const currentPath = pathname || ""
  const [displayPath, setDisplayPath] = useState(currentPath)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (!currentPath || currentPath === displayPath) return
    
    // Determinar dirección basada en la profundidad de la ruta
    const currentDepth = currentPath.split("/").filter(Boolean).length
    const prevDepth = displayPath.split("/").filter(Boolean).length
    
    if (currentDepth > prevDepth) {
      setDirection(1) // Avanzando (hacia adelante)
    } else if (currentDepth < prevDepth) {
      setDirection(-1) // Retrocediendo (hacia atrás)
    } else {
      setDirection(0) // Mismo nivel
    }

    setDisplayPath(currentPath)
  }, [currentPath, displayPath]) // Array de dependencias siempre del mismo tamaño

  // Determinar qué variante usar según la ruta
  const getVariants = () => {
    // Rutas especiales que necesitan animación más dramática
    const dramaticRoutes = ["/login", "/register", "/checkout"]
    if (dramaticRoutes.some((route) => pathname?.startsWith(route))) {
      return dramaticVariants
    }

    // Rutas de productos y catálogo usan deslizamiento
    if (pathname?.startsWith("/producto") || pathname?.startsWith("/catalogo") || pathname?.startsWith("/categorias")) {
      return slideVariants
    }

    // Por defecto, usar la animación suave
    return pageVariants
  }

  const variants = getVariants()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        custom={direction}
        style={{
          width: "100%",
          minHeight: "100%",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

