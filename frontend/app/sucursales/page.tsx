"use client"

import { useState } from "react"

interface Store {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  availability: boolean
}

export default function StoresPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null)

  const stores: Store[] = [
    {
      id: "santa-cruz",
      name: "Santa Cruz",
      address: "Av. San Joaquín esquina Calle 'A', lado del Colegio Miguel Antelo, Guayaramerin",
      phone: "+591 68464378",
      hours: "Lunes-Viernes: 8:00-18:00 | Sábados: 9:00-14:00",
      availability: true,
    },
  ]

  const handleStoreSelect = (storeId: string) => {
    localStorage.setItem("selectedStore", storeId)
    setSelectedStore(storeId)
  }

  return (
    <main className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">Nuestras Sucursales</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedStore === store.id
                    ? "bg-orange-600 text-white border-orange-600"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
                onClick={() => handleStoreSelect(store.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{store.name}</h2>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedStore === store.id
                        ? "bg-white"
                        : store.availability
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
                <p className="text-sm mb-2 opacity-90">{store.address}</p>
                <p className="text-sm mb-2 opacity-90">{store.phone}</p>
                <p className="text-sm opacity-90">{store.hours}</p>
                <div className="mt-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedStore === store.id
                        ? "bg-white text-orange-600"
                        : store.availability
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {store.availability ? "Disponible" : "No disponible"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedStore ? (
            <div className="bg-neutral-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Información de {stores.find((s) => s.id === selectedStore)?.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Dirección</h3>
                  <p className="text-neutral-700">
                    {stores.find((s) => s.id === selectedStore)?.address}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Teléfono</h3>
                  <p className="text-neutral-700">
                    {stores.find((s) => s.id === selectedStore)?.phone}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Horario</h3>
                  <p className="text-neutral-700">
                    {stores.find((s) => s.id === selectedStore)?.hours}
                  </p>
                </div>
                <div className="mt-6">
                  <div className="w-full h-64 bg-neutral-200 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps?q=Av.+San+Joaquín+esquina+Calle+A,+Colegio+Miguel+Antelo,+Guayaramerin,+Bolivia&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                      title="Ubicación Ferretería Urkupina - Av. San Joaquín esquina Calle A, Guayaramerin"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">Selecciona una sucursal para ver más información</p>
            </div>
          )}
        </div>
    </main>
  )
}
