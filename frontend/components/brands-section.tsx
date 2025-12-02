"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { productsService } from "@/lib/services/products-service"

interface Brand {
  id: number
  nombre: string
  descripcion?: string | null
}

export default function BrandsSection() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBrands = async () => {
      try {
        // Cargar productos para extraer marcas únicas
        const data = await productsService.listProducts({ page: 1, page_size: 100 })
        const uniqueBrands = new Map<number, Brand>()
        
        data.items.forEach((product) => {
          if (product.marca && product.marca.id) {
            if (!uniqueBrands.has(product.marca.id)) {
              uniqueBrands.set(product.marca.id, {
                id: product.marca.id,
                nombre: product.marca.nombre,
                descripcion: product.marca.descripcion || null,
              })
            }
          }
        })
        
        setBrands(Array.from(uniqueBrands.values()).slice(0, 12))
      } catch (err) {
        console.error("Error loading brands:", err)
        // Si falla, dejar el array vacío para que el componente se oculte
        setBrands([])
      } finally {
        setLoading(false)
      }
    }
    loadBrands()
  }, [])

  if (loading) {
    return (
      <section className="bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-neutral-900 mb-8 text-center uppercase">Nuestras Marcas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg p-6 h-24 flex items-center justify-center animate-pulse">
                <div className="w-full h-8 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (brands.length === 0) {
    return null
  }

  return (
    <section className="bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-black text-neutral-900 mb-8 text-center uppercase"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Nuestras Marcas
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.id}
              className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex items-center justify-center min-h-[100px]"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-center">
                <h3 className="font-bold text-neutral-900 text-lg">{brand.nombre}</h3>
                {brand.descripcion && (
                  <p className="text-xs text-neutral-500 mt-1">{brand.descripcion}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

