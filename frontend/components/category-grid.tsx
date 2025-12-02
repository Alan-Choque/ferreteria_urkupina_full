"use client"

import { motion } from "framer-motion"

const categories = [
  {
    id: 1,
    name: "Herramientas Eléctricas",
    image: "/power-drill-tools.jpg",
    link: "/electricas",
  },
  {
    id: 2,
    name: "Herramientas Manuales",
    image: "/hand-tools-hammer-wrench.jpg",
    link: "/manuales",
  },
  {
    id: 3,
    name: "Materiales de Construcción",
    image: "/construction-materials-cement.jpg",
    link: "/materiales",
  },
  {
    id: 4,
    name: "Pintura y Accesorios",
    image: "/paint-brushes-rollers.jpg",
    link: "/pintura",
  },
  {
    id: 5,
    name: "Jardín y Exterior",
    image: "/garden-tools-lawn-mower.jpg",
    link: "/jardin",
  },
  {
    id: 6,
    name: "Seguridad Industrial",
    image: "/safety-equipment-helmet-gloves.jpg",
    link: "/seguridad",
  },
]

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-10 text-center">
        Categorías Destacadas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <motion.a
            key={category.id}
            href={category.link}
            className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow bg-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <motion.img
                src={category.image || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/40 to-transparent" />
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-6"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-bold text-white text-balance">{category.name}</h3>
            </motion.div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
