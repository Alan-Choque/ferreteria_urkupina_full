"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

const slides = [
  {
    id: 1,
    title: "Innovación y Precisión en Carpintería",
    description: "Las mejores herramientas profesionales para tus proyectos de construcción y carpintería.",
    cta: "Ver Productos",
    link: "/productos",
  },
  {
    id: 2,
    title: "Equipos de Última Generación",
    description: "Tecnología avanzada para profesionales exigentes. Calidad garantizada.",
    cta: "Explorar",
    link: "/equipos",
  },
  {
    id: 3,
    title: "Ofertas Especiales",
    description: "Descuentos increíbles en herramientas seleccionadas. No te lo pierdas.",
    cta: "Ver Ofertas",
    link: "/ofertas",
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative bg-neutral-900 overflow-hidden" aria-label="Promociones destacadas">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src="/hardware-store-tools-workshop.jpg" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/95 via-neutral-900/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg md:text-xl text-neutral-200 mb-8 leading-relaxed">{slides[currentSlide].description}</p>
          <a
            href={slides[currentSlide].link}
            className="inline-block bg-red-600 text-white font-bold px-8 py-4 rounded hover:bg-red-700 transition-colors"
          >
            {slides[currentSlide].cta}
          </a>
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
        aria-label="Diapositiva anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-colors"
        aria-label="Siguiente diapositiva"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2"
        role="tablist"
        aria-label="Indicadores de diapositivas"
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-red-600" : "bg-white/50"
            }`}
            aria-label={`Ir a diapositiva ${index + 1}`}
            aria-selected={index === currentSlide}
            role="tab"
          />
        ))}
      </div>
    </section>
  )
}
