"use client"

import { useState } from "react"

interface Address {
  id: string
  label: string
  address: string
  city: string
  phone: string
  default: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      label: "Casa",
      address: "Calle Principal 123, Apto 4B",
      city: "La Paz",
      phone: "71234567",
      default: true,
    },
    {
      id: "2",
      label: "Oficina",
      address: "Avenida Secundaria 456",
      city: "Cochabamba",
      phone: "71234568",
      default: false,
    },
  ])

  const [newAddressMode, setNewAddressMode] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: "",
    address: "",
    city: "",
    phone: "",
  })

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.address && newAddress.city) {
      setAddresses((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          ...newAddress,
          default: false,
        },
      ])
      setNewAddress({ label: "", address: "", city: "", phone: "" })
      setNewAddressMode(false)
    }
  }

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        default: addr.id === id,
      })),
    )
  }

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Mis Direcciones</h2>
        <button
          onClick={() => setNewAddressMode(!newAddressMode)}
          className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
        >
          {newAddressMode ? "Cancelar" : "+ Agregar Dirección"}
        </button>
      </div>

      {newAddressMode && (
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Etiqueta (Casa, Oficina, etc.)</label>
              <input
                type="text"
                value={newAddress.label}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Casa"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">Dirección</label>
              <input
                type="text"
                value={newAddress.address}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Calle, número, apartamento..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="La Paz"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="71234567"
                />
              </div>
            </div>
            <button
              onClick={handleAddAddress}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
            >
              Guardar Dirección
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="p-4 border border-neutral-200 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-neutral-900">{addr.label}</h3>
              {addr.default && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">Por defecto</span>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm text-neutral-700">
              <p>{addr.address}</p>
              <p>{addr.city}</p>
              <p>{addr.phone}</p>
            </div>

            <div className="flex gap-2">
              {!addr.default && (
                <button
                  onClick={() => setDefaultAddress(addr.id)}
                  className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded"
                >
                  Usar como predeterminada
                </button>
              )}
              <button
                onClick={() => deleteAddress(addr.id)}
                className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
