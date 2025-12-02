"use client"

import { motion } from "framer-motion"
import { Package, Search, Clock, CheckCircle, Truck, MapPin, Phone, Mail } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const orderStatuses = [
  {
    id: "pending",
    label: "Pendiente",
    description: "Tu pedido ha sido recibido y está siendo procesado",
    icon: Clock,
    color: "text-yellow-600 bg-yellow-100"
  },
  {
    id: "confirmed",
    label: "Confirmado",
    description: "Tu pedido ha sido confirmado y está siendo preparado",
    icon: CheckCircle,
    color: "text-blue-600 bg-blue-100"
  },
  {
    id: "preparing",
    label: "En Preparación",
    description: "Estamos preparando tu pedido para el envío",
    icon: Package,
    color: "text-purple-600 bg-purple-100"
  },
  {
    id: "shipped",
    label: "En Camino",
    description: "Tu pedido ha sido enviado y está en camino",
    icon: Truck,
    color: "text-orange-600 bg-orange-100"
  },
  {
    id: "delivered",
    label: "Entregado",
    description: "Tu pedido ha sido entregado exitosamente",
    icon: CheckCircle,
    color: "text-green-600 bg-green-100"
  }
]

const trackingSteps = [
  {
    step: 1,
    title: "Ingresa tu número de pedido",
    description: "Encuentra tu número de pedido en el email de confirmación que recibiste"
  },
  {
    step: 2,
    title: "Consulta el estado",
    description: "Verás el estado actual de tu pedido y los pasos siguientes"
  },
  {
    step: 3,
    title: "Recibe actualizaciones",
    description: "Te notificaremos por email cada vez que haya un cambio en el estado"
  }
]

export default function SeguimientoCompraPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderNumber.trim()) {
      setIsSearching(true)
      // Aquí iría la lógica para buscar el pedido
      // Por ahora solo simulamos
      setTimeout(() => {
        setIsSearching(false)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Seguimiento de Compra</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Consulta el estado de tu pedido en tiempo real. Ingresa tu número de pedido para comenzar.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8 mb-12"
        >
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="orderNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                  Número de Pedido
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ej: ORD-123456"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? "Buscando..." : "Buscar Pedido"}
                </button>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-3 text-center">
              ¿No tienes tu número de pedido?{" "}
              <Link href="/account/orders" className="text-orange-600 hover:text-orange-700 font-medium">
                Ver mis pedidos
              </Link>
            </p>
          </form>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {trackingSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-full text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-neutral-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Order Statuses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">Estados del Pedido</h2>
          <div className="space-y-4">
            {orderStatuses.map((status, index) => {
              const Icon = status.icon
              return (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 flex items-start gap-4"
                >
                  <div className={`p-3 rounded-lg ${status.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">{status.label}</h3>
                    <p className="text-neutral-600 text-sm">{status.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-8 text-white"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-center">¿Necesitas ayuda con tu pedido?</h3>
            <p className="text-orange-100 mb-6 text-center">
              Nuestro equipo de atención al cliente está disponible para ayudarte con cualquier consulta sobre tu pedido.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <Phone className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Teléfono</h4>
                  <p className="text-orange-100 text-sm">+591 68464378</p>
                  <p className="text-orange-200 text-xs mt-1">Lunes - Viernes: 8:00 - 18:00</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <Mail className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Email</h4>
                  <p className="text-orange-100 text-sm">info@urkupina.com</p>
                  <p className="text-orange-200 text-xs mt-1">Respuesta en 24 horas</p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/contacto"
                className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Contactar Soporte
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-12 bg-white rounded-xl p-6 shadow-lg border border-neutral-200"
        >
          <div className="flex items-start gap-4">
            <MapPin className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Retiro en Tienda</h4>
              <p className="text-neutral-600 text-sm mb-2">
                Si elegiste retirar tu pedido en nuestra tienda física, recibirás una notificación cuando esté listo.
              </p>
              <p className="text-neutral-600 text-sm">
                <strong>Dirección:</strong> Av. San Joaquín esquina Calle "A", lado del Colegio Miguel Antelo,
                Guayaramerin, Bolivia
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

