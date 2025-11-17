"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const slides = [
  {
    id: 1,
    title: "COMIENZA LA LIQUIDACIÓN",
    titleLarge: "TOTAL",
    brand: "Milwaukee",
    description: "Encuentra tus HERRAMIENTAS FAVORITAS A PRECIOS ÚNICOS, solo en nuestras",
    cta: "TIENDAS FERRETERÍA URKUPINA",
    link: "/sucursales",
    speechBubble: "¡NO TE LA PIERDAS!",
  },
  {
    id: 2,
    title: "OFERTAS ESPECIALES",
    titleLarge: "DEWALT",
    brand: "DEWALT",
    description: "Herramientas profesionales de calidad superior",
    cta: "VER PRODUCTOS",
    link: "/catalogo?brand=DEWALT",
    speechBubble: "¡Aprovecha ahora!",
  },
]

export default function HeroFerretek() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const current = slides[currentSlide]

  return (
    <>
      <section className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 overflow-hidden" aria-label="Promociones destacadas">
      {/* Lightning bolt graphics background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-3xl transform -rotate-45" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl transform rotate-45" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-yellow-300 rounded-full blur-3xl transform rotate-12" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left Side */}
          <div className="relative z-10">
            <div className="mb-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2">
                {current.title}
              </h1>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none">
                {current.titleLarge}
              </h2>
            </div>
            
            {/* Brand Logo */}
            <div className="mb-5">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-5 py-2 rounded-lg">
                <span className="text-xl md:text-2xl font-bold text-white italic">{current.brand}</span>
              </div>
            </div>

            {/* Product Images Placeholder */}
            <div className="flex gap-3 mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] text-center">Herramienta 1</span>
              </div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] text-center">Herramienta 2</span>
              </div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] text-center">Herramienta 3</span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="relative z-10">
            <div className="bg-gray-200/90 backdrop-blur-sm rounded-2xl p-5 shadow-2xl flex items-center justify-center">
              <div className="bg-white px-6 py-5 rounded-xl flex flex-col items-center justify-center w-full">
                <span className="text-base font-black text-neutral-900 text-center tracking-wide mb-4">
                  FERRETERÍA URKUPINA
                </span>
                <div className="w-full">
                  <img
                    src="/logo-urkupina.png"
                    alt="Logo Ferretería Urkupina"
                    className="w-full h-40 md:h-48 object-contain mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors z-20"
        aria-label="Diapositiva anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg backdrop-blur-sm transition-colors z-20"
        aria-label="Siguiente diapositiva"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Ofertas Tab */}
        <div className="absolute right-0 bottom-4 translate-x-0 bg-neutral-700 text-white px-3 py-4 rounded-l-lg z-20 cursor-pointer hover:bg-neutral-600 transition-colors">
          <span className="writing-vertical-rl text-sm font-bold">Ofertas</span>
        </div>
      </section>

      {/* Indicators outside the hero */}
      <div
        className="flex justify-center gap-2 mt-8"
        role="tablist"
        aria-label="Indicadores de diapositivas"
      >
        {slides.map((_, index) => {
          const isActive = index === currentSlide
          return (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                isActive
                  ? "bg-orange-500 border-orange-500 scale-110 shadow-[0_0_6px_rgba(249,115,22,0.7)]"
                  : "bg-transparent border-orange-300 hover:border-orange-500 hover:scale-105"
              }`}
              aria-label={`Ir a diapositiva ${index + 1}`}
              aria-selected={isActive}
              role="tab"
            />
          )
        })}
      </div>
    </>
  )
}

