"use client"

import { useState, useEffect } from "react"
import { Palette } from "lucide-react"

type Theme = "steel" | "graphite" | "evergreen" | "carbon"

const THEMES: { id: Theme; name: string; description: string }[] = [
  { id: "steel", name: "Steel & Safety Yellow", description: "Professional light theme (default)" },
  { id: "graphite", name: "Graphite & Orange", description: "Modern construction aesthetic" },
  { id: "evergreen", name: "Evergreen & Blue", description: "Fresh garden-leaning theme" },
  { id: "carbon", name: "Carbon & Lime", description: "Dark mode for night shopping" },
]

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("steel")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const saved = localStorage.getItem("storefront-theme") as Theme | null
    if (saved) {
      setCurrentTheme(saved)
      document.documentElement.setAttribute("data-storefront-theme", saved)
    }
  }, [])

  const switchTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    document.documentElement.setAttribute("data-storefront-theme", theme)
    localStorage.setItem("storefront-theme", theme)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Cambiar tema"
        title="Cambiar tema de colores"
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Tema</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">Temas disponibles</h3>
          </div>
          <div className="p-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => switchTheme(theme.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentTheme === theme.id
                    ? "bg-blue-100 border border-blue-300"
                    : "hover:bg-gray-100 border border-transparent"
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{theme.name}</div>
                <div className="text-xs text-gray-500">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
