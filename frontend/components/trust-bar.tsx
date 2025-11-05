import { Truck, Shield, CreditCard } from "lucide-react"

const features = [
  {
    id: 1,
    icon: Truck,
    title: "Envío Rápido",
    description: "Entrega en 24-48 horas",
  },
  {
    id: 2,
    icon: Shield,
    title: "Garantía Extendida",
    description: "Productos garantizados",
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Pago Seguro",
    description: "Múltiples métodos de pago",
  },
]

export default function TrustBar() {
  return (
    <section className="bg-neutral-100 py-12" aria-label="Beneficios del servicio">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg mb-1">{feature.title}</h3>
                  <p className="text-neutral-800 text-sm">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
