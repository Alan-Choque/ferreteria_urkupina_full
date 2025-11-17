"use client"

import { MessageCircle, ArrowUp, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"

export default function FloatingWidgets() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const whatsappNumber = "59168464378"
  const whatsappMessage = encodeURIComponent("Hola, me interesa conocer más sobre sus productos")

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Chat Widget */}
      {showChat && (
        <div className="absolute bottom-20 right-0 bg-white border border-neutral-200 rounded-lg shadow-xl w-64 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-neutral-900">Atención al Cliente</h4>
            <button
              onClick={() => setShowChat(false)}
              className="text-neutral-500 hover:text-neutral-900"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-neutral-600 mb-3">
            Hola, Bienvenido. ¿Cómo puedo ayudarte?
          </p>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-3 rounded text-center transition-colors"
            >
              WhatsApp
            </a>
            <button className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-sm font-bold py-2 px-3 rounded transition-colors">
              Email
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-colors"
        aria-label="Contactar por WhatsApp"
      >
        <MessageSquare className="w-6 h-6" />
      </a>

      {/* Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-colors"
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full p-4 shadow-lg transition-colors"
          aria-label="Volver arriba"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

