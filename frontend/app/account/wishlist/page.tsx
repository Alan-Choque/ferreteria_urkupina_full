"use client"

interface WishlistItem {
  id: string
  name: string
  price: number
  image: string
  available: boolean
}

export default function WishlistPage() {
  const wishlist: WishlistItem[] = [
    {
      id: "1",
      name: "Taladro Bosch GSB 20-2",
      price: 244000,
      image: "/electric-drill.jpg",
      available: true,
    },
    {
      id: "2",
      name: "Esmeril Angular Bosch",
      price: 189000,
      image: "/angle-grinder.jpg",
      available: true,
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Mi Lista de Deseos</h2>

      {wishlist.length === 0 ? (
        <div className="text-center py-12 p-6 bg-neutral-50 rounded-lg">
          <p className="text-neutral-600 mb-4">Tu lista de deseos está vacía</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-neutral-900 mb-2">{item.name}</h3>
                <p className="text-green-600 font-bold mb-4">Bs. {item.price.toLocaleString("es-BO")}</p>
                <div className="space-y-2">
                  <button className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">
                    Agregar al Carrito
                  </button>
                  <button className="w-full py-2 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-100 text-sm">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
