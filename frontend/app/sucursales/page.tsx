"use client"

import { useState } from "react"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"

interface Store {
  id: string
  name: string
  address: string
  city: string
  phone: string
  hours: string
  availability: boolean
}

export default function StoresPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const stores: Store[] = [
    {
      id: "lp",
      name: "Sucursal La Paz",
      address: "Calle Principal 123",
      city: "La Paz",
      phone: "71234567",
      hours: "Lunes-Viernes: 8:00-18:00 | Sábados: 9:00-14:00",
      availability: true,
    },
    {
      id: "cbba",
      name: "Sucursal Cochabamba",
      address: "Avenida Secundaria 456",
      city: "Cochabamba",
      phone: "71234568",
      hours: "Lunes-Viernes: 8:00-18:00 | Sábados: 9:00-14:00",
      availability: true,
    },
    {
      id: "scz",
      name: "Sucursal Santa Cruz",
      address: "Boulevard Tercero 789",
      city: "Santa Cruz",
      phone: "71234569",
      hours: "Lunes-Viernes: 8:00-18:00 | Sábados: 9:00-14:00",
      availability: false,
    },
  ]

  const handleSetAsMyStore = (storeId: string) => {
    localStorage.setItem("selectedStore", storeId)
    setSelectedStore(storeId)
  }

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">Nuestras Sucursales</h1>
            <p className="text-neutral-700 mb-6">
              Selecciona tu tienda más cercana para ver disponibilidad de productos
            </p>

            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  viewMode === "grid"
                    ? "bg-red-600 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Vista Cuadrícula
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  viewMode === "list"
                    ? "bg-red-600 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Vista Lista
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Map Placeholder */}
                  <div className="w-full h-40 bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm">
                    Mapa de {store.city}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg text-neutral-900 mb-2">{store.name}</h3>
                    <div className="space-y-2 text-sm text-neutral-700 mb-4">
                      <p>
                        <span className="text-neutral-900 font-bold">Dirección:</span> {store.address}
                      </p>
                      <p>
                        <span className="text-neutral-900 font-bold">Ciudad:</span> {store.city}
                      </p>
                      <p>
                        <span className="text-neutral-900 font-bold">Teléfono:</span> {store.phone}
                      </p>
                      <p>
                        <span className="text-neutral-900 font-bold">Horario:</span> {store.hours}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleSetAsMyStore(store.id)}
                        className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm"
                      >
                        Usar esta tienda
                      </button>
                      <button className="w-full py-2 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-100 text-sm">
                        Ver Disponibilidad
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="border border-neutral-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 mb-2">{store.name}</h3>
                      <div className="space-y-1 text-sm text-neutral-700">
                        <p>
                          <span className="text-neutral-900 font-bold">📍</span> {store.address}, {store.city}
                        </p>
                        <p>
                          <span className="text-neutral-900 font-bold">📞</span> {store.phone}
                        </p>
                        <p>
                          <span className="text-neutral-900 font-bold">🕒</span> {store.hours}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetAsMyStore(store.id)}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm"
                      >
                        Usar esta tienda
                      </button>
                      <button className="px-4 py-2 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-100 text-sm">
                        Ver Disponibilidad
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-neutral-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-400 text-sm">
          <p>&copy; 2025 Ferretería Urkupina. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  )
}
