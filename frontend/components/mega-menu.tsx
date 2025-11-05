"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"

export default function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="py-3 text-neutral-900 font-medium hover:text-red-600 transition-colors"
          aria-expanded={isOpen}
          aria-controls="mega-menu"
        >
          Todas las Categorías
        </button>

        {isOpen && (
          <div id="mega-menu" className="absolute left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-40">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1: Tools */}
                <div>
                  <h3 className="font-bold text-neutral-900 mb-4 text-lg">Herramientas</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="/taladros"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Taladros</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/esmeriles"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Esmeriles</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/sierras"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Sierras</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/lijadoras"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Lijadoras</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Electrical */}
                <div>
                  <h3 className="font-bold text-neutral-900 mb-4 text-lg">Electricidad</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="/cables"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Cables y Conductores</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/iluminacion"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Iluminación</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/interruptores"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Interruptores</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/tableros"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Tableros Eléctricos</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Paint & Garden */}
                <div>
                  <h3 className="font-bold text-neutral-900 mb-4 text-lg">Pintura y Jardín</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="/pinturas"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Pinturas</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/brochas"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Brochas y Rodillos</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/jardin"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Herramientas de Jardín</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="/riego"
                        className="flex items-center justify-between text-neutral-800 hover:text-red-600 transition-colors py-1"
                      >
                        <span>Sistemas de Riego</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
