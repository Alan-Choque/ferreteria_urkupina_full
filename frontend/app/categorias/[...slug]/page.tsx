"use client"

import { use } from "react"
import CategoryPage from "@/components/category-page"
import { notFound } from "next/navigation"

// Mapeo de slugs a títulos
const CATEGORY_TITLES: Record<string, string> = {
  // Herramientas de Construcción
  "herramientas-construccion": "Herramientas de Construcción",
  "carpinteria": "Herramientas de Carpintería",
  "electricas": "Herramientas Eléctricas",
  "inalambricas": "Herramientas Inalámbricas",
  "manuales": "Herramientas Manuales",
  "medicion": "Medición y Nivelación",
  "dremel": "Herramientas Dremel",
  "varias": "Herramientas Varias",
  "taladros": "Taladros",
  "atornilladores": "Atornilladores",
  "sierras": "Sierras Eléctricas",
  "esmeriles": "Esmeriles",
  "martillos": "Martillos",
  "destornilladores": "Destornilladores",
  "llaves": "Llaves",
  
  // Equipos de Industria y Taller
  "equipos-industria": "Equipos de Industria y Taller",
  "bombas": "Bombas de Agua y Motobombas",
  "generacion": "Equipos de Generación",
  "izaje": "Equipos de Izaje",
  "soldadura": "Equipos de Soldadura",
  "automotriz": "Taller Automotriz",
  "centrifugas": "Bombas Centrífugas",
  "sumergibles": "Bombas Sumergibles",
  "motobombas": "Motobombas",
  "gasolina": "Generadores Gasolina",
  "diesel": "Generadores Diésel",
  "inverter": "Generadores Inverter",
  "mig": "Soldadoras MIG",
  "tig": "Soldadoras TIG",
  "arco": "Soldadoras Arco",
  
  // Aseo y Jardín
  "aseo-jardin": "Aseo y Jardín",
  "cortadoras": "Cortadoras de Césped",
  "motosierras": "Motosierras",
  "bordeadoras": "Bordeadoras",
  "sopladores": "Sopladores",
  "mangueras": "Mangueras y Riego",
  "herramientas": "Herramientas de Jardín",
  "limpieza": "Productos de Limpieza",
  
  // Insumos y Accesorios
  "insumos-accesorios": "Insumos y Accesorios",
  "tornillos": "Tornillos y Pernos",
  "clavos": "Clavos",
  "adhesivos": "Adhesivos y Pegamentos",
  "cintas": "Cintas y Selladores",
  "cables": "Cables y Alambres",
  "electricos": "Accesorios Eléctricos",
  "seguridad": "Seguridad Industrial",
  
  // Pintura
  "pintura": "Pintura",
  "interiores": "Pinturas Interiores",
  "exteriores": "Pinturas Exteriores",
  "esmaltes": "Esmaltes Sintéticos",
  "barnices": "Barnices y Lacas",
  "brochas": "Brochas y Pinceles",
  "rodillos": "Rodillos",
  "accesorios": "Accesorios de Pintura",
  
  // Outlet
  "outlet": "Outlet",
  "especiales": "Ofertas Especiales",
  "combos": "Combos y Kits",
}

function getTitleFromSlug(slug: string[]): string {
  const lastSlug = slug[slug.length - 1]
  return CATEGORY_TITLES[lastSlug] || lastSlug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export default function DynamicCategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  // En Next.js 16, params es una Promise, necesitamos usar React.use()
  const { slug } = use(params)
  
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    notFound()
  }
  
  // Para subcategorías, intentar primero con el último segmento, pero también pasar el slug completo
  // para que CategoryPage pueda intentar con la categoría padre si no encuentra la subcategoría
  const categoryId = slug.length > 1 ? slug[slug.length - 1] : slug[0]
  const parentCategoryId = slug.length > 1 ? slug[0] : null
  const title = getTitleFromSlug(slug)
  const description = `Explora nuestra selección de ${title.toLowerCase()}`
  
  return (
    <CategoryPage
      categoryId={categoryId}
      parentCategoryId={parentCategoryId}
      title={title}
      description={description}
    />
  )
}

