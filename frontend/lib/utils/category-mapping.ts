// Mapeo de slugs de categorías a nombres de categorías en la base de datos
// Este mapeo se usa para encontrar la categoría correcta cuando se carga desde la API

// Mapeo de slugs a posibles nombres de categorías en la base de datos
// Se buscan múltiples variantes para mayor flexibilidad
export const CATEGORY_SLUG_TO_NAMES: Record<string, string[]> = {
  "herramientas-construccion": [
    "Herramientas de Construcción",
    "Herramientas Construcción",
    "Herramientas",
    "Construcción",
  ],
  "pintura": [
    "Pintura",
    "Pinturas",
    "Pintura y Accesorios",
  ],
  "equipos-industria": [
    "Equipos de Industria y Taller",
    "Equipos de Industria",
    "Equipos Industria",
    "Equipos",
    "Industria",
  ],
  "insumos-accesorios": [
    "Insumos y Accesorios",
    "Insumos",
    "Accesorios",
    "Insumos Accesorios",
  ],
  "aseo-jardin": [
    "Aseo y Jardín",
    "Aseo",
    "Jardín",
    "Aseo Jardín",
    "Jardín y Aseo",
  ],
  "outlet": [
    "Outlet",
    "Ofertas",
    "Promociones",
  ],
  // Subcategorías de herramientas-construccion
  "carpinteria": ["Herramientas de Carpintería", "Carpintería"],
  "electricas": ["Herramientas Eléctricas", "Eléctricas"],
  "inalambricas": ["Herramientas Inalámbricas", "Inalámbricas"],
  "manuales": ["Herramientas Manuales", "Manuales"],
  "medicion": ["Medición y Nivelación", "Medición", "Nivelación"],
  "dremel": ["Herramientas Dremel", "Dremel"],
  "varias": ["Herramientas Varias", "Varias"],
  "taladros": ["Taladros"],
  "atornilladores": ["Atornilladores"],
  "sierras": ["Sierras Eléctricas", "Sierras"],
  "esmeriles": ["Esmeriles"],
  "martillos": ["Martillos"],
  "destornilladores": ["Destornilladores"],
  "llaves": ["Llaves"],
  
  // Subcategorías de equipos-industria
  "bombas": ["Bombas de Agua y Motobombas", "Bombas", "Motobombas"],
  "generacion": ["Equipos de Generación", "Generación", "Generadores"],
  "izaje": ["Equipos de Izaje", "Izaje"],
  "soldadura": ["Equipos de Soldadura", "Soldadura"],
  "automotriz": ["Taller Automotriz", "Automotriz"],
  "centrifugas": ["Bombas Centrífugas", "Centrífugas"],
  "sumergibles": ["Bombas Sumergibles", "Sumergibles"],
  "motobombas": ["Motobombas"],
  "gasolina": ["Generadores Gasolina", "Gasolina"],
  "diesel": ["Generadores Diésel", "Diésel", "Diesel"],
  "inverter": ["Generadores Inverter", "Inverter"],
  "mig": ["Soldadoras MIG", "MIG"],
  "tig": ["Soldadoras TIG", "TIG"],
  "arco": ["Soldadoras Arco", "Arco"],
  
  // Subcategorías de aseo-jardin
  "cortadoras": ["Cortadoras de Césped", "Cortadoras"],
  "motosierras": ["Motosierras"],
  "bordeadoras": ["Bordeadoras"],
  "sopladores": ["Sopladores"],
  "mangueras": ["Mangueras y Riego", "Mangueras", "Riego"],
  "herramientas": ["Herramientas de Jardín", "Herramientas Jardín"],
  "limpieza": ["Productos de Limpieza", "Limpieza"],
  
  // Subcategorías de insumos-accesorios
  "tornillos": ["Tornillos y Pernos", "Tornillos", "Pernos"],
  "clavos": ["Clavos"],
  "adhesivos": ["Adhesivos y Pegamentos", "Adhesivos", "Pegamentos"],
  "cintas": ["Cintas y Selladores", "Cintas", "Selladores"],
  "cables": ["Cables y Alambres", "Cables", "Alambres"],
  "electricos": ["Accesorios Eléctricos", "Accesorios", "Eléctricos"],
  "seguridad": ["Seguridad Industrial", "Seguridad"],
  
  // Subcategorías de pintura
  "interiores": ["Pinturas Interiores", "Interiores"],
  "exteriores": ["Pinturas Exteriores", "Exteriores"],
  "esmaltes": ["Esmaltes Sintéticos", "Esmaltes"],
  "barnices": ["Barnices y Lacas", "Barnices", "Lacas"],
  "brochas": ["Brochas y Pinceles", "Brochas", "Pinceles"],
  "rodillos": ["Rodillos"],
  "accesorios": ["Accesorios de Pintura", "Accesorios Pintura"],
  
  // Subcategorías de outlet
  "especiales": ["Ofertas Especiales", "Especiales"],
  "combos": ["Combos y Kits", "Combos", "Kits"],
}

// Mapeo simple para compatibilidad
export const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  "herramientas-construccion": "Herramientas de Construcción",
  "pintura": "Pintura",
  "equipos-industria": "Equipos de Industria",
  "insumos-accesorios": "Insumos y Accesorios",
  "aseo-jardin": "Aseo y Jardín",
  "outlet": "Outlet",
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
  "cortadoras": "Cortadoras de Césped",
  "motosierras": "Motosierras",
  "bordeadoras": "Bordeadoras",
  "sopladores": "Sopladores",
  "mangueras": "Mangueras y Riego",
  "herramientas": "Herramientas de Jardín",
  "limpieza": "Productos de Limpieza",
  "tornillos": "Tornillos y Pernos",
  "clavos": "Clavos",
  "adhesivos": "Adhesivos y Pegamentos",
  "cintas": "Cintas y Selladores",
  "cables": "Cables y Alambres",
  "electricos": "Accesorios Eléctricos",
  "seguridad": "Seguridad Industrial",
  "interiores": "Pinturas Interiores",
  "exteriores": "Pinturas Exteriores",
  "esmaltes": "Esmaltes Sintéticos",
  "barnices": "Barnices y Lacas",
  "brochas": "Brochas y Pinceles",
  "rodillos": "Rodillos",
  "accesorios": "Accesorios de Pintura",
  "especiales": "Ofertas Especiales",
  "combos": "Combos y Kits",
}

/**
 * Obtiene el nombre de categoría basado en el slug
 * @deprecated Usar getCategoryIdFromSlug en su lugar
 */
export function getCategoryNameFromSlug(slug: string): string | null {
  return CATEGORY_SLUG_TO_NAME[slug] || null
}

/**
 * Busca el ID de categoría basado en el slug y la lista de categorías de la API
 */
export async function getCategoryIdFromSlug(
  slug: string,
  categories: Array<{ id: number; nombre: string }>
): Promise<number | null> {
  const possibleNames = CATEGORY_SLUG_TO_NAMES[slug] || [CATEGORY_SLUG_TO_NAME[slug]].filter(Boolean)
  
  if (possibleNames.length === 0) {
    console.warn(`No se encontró mapeo para el slug: ${slug}`)
    return null
  }

  // Normalizar nombres (remover acentos, espacios extra, etc.)
  const normalize = (str: string) => 
    str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/\s+/g, " ")
      .trim()

  // Buscar coincidencia exacta para cada variante
  for (const name of possibleNames) {
    const normalizedName = normalize(name)
    
    const exactMatch = categories.find(
      (cat) => normalize(cat.nombre) === normalizedName
    )
    if (exactMatch) {
      console.log(`✅ Categoría encontrada (exacta): "${exactMatch.nombre}" (ID: ${exactMatch.id}) para slug "${slug}"`)
      return exactMatch.id
    }
  }

  // Buscar coincidencia parcial para cada variante
  for (const name of possibleNames) {
    const normalizedName = normalize(name)
    
    const partialMatch = categories.find(
      (cat) => {
        const normalizedCat = normalize(cat.nombre)
        return normalizedCat.includes(normalizedName) || normalizedName.includes(normalizedCat)
      }
    )
    if (partialMatch) {
      console.log(`✅ Categoría encontrada (parcial): "${partialMatch.nombre}" (ID: ${partialMatch.id}) para slug "${slug}"`)
      return partialMatch.id
    }
  }

  // Si no encontramos nada, mostrar todas las categorías disponibles para debug
  console.warn(`❌ No se encontró categoría para slug "${slug}"`)
  console.log("Categorías disponibles:", categories.map(c => `"${c.nombre}" (ID: ${c.id})`).join(", "))
  
  return null
}

