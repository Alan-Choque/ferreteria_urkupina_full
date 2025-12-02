"use client"

import { motion } from "framer-motion"

interface EditorialCardProps {
  title: string
  description: string
  image: string
  link: string
  index?: number
}

export default function EditorialCard({ title, description, image, link, index = 0 }: EditorialCardProps) {
  return (
    <motion.article
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <a href={link} className="block">
        <div className="aspect-3/2 overflow-hidden">
          <motion.img
            src={image || "/placeholder.svg"}
            alt=""
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-3 text-balance">{title}</h3>
          <p className="text-neutral-800 leading-relaxed mb-4">{description}</p>
          <motion.span
            className="text-red-600 font-medium hover:underline inline-flex items-center gap-1"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Leer más →
          </motion.span>
        </div>
      </a>
    </motion.article>
  )
}
