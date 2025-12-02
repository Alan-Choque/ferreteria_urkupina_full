"use client"

import { motion } from "framer-motion"
import { ShoppingCart, UserPlus, Search, CreditCard, Package, CheckCircle, ArrowRight, HelpCircle } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    number: 1,
    title: "Crea tu cuenta",
    description: "Regístrate de forma gratuita en nuestro sitio web. Solo necesitas tu nombre, email y crear una contraseña segura.",
    icon: UserPlus,
    details: [
      "Haz clic en 'Registrarse' en la parte superior",
      "Completa el formulario con tus datos",
      "Verifica tu email (recibirás un enlace de confirmación)",
      "¡Listo! Ya puedes iniciar sesión"
    ]
  },
  {
    number: 2,
    title: "Explora nuestro catálogo",
    description: "Navega por nuestras categorías o usa el buscador para encontrar exactamente lo que necesitas.",
    icon: Search,
    details: [
      "Visita nuestra página de catálogo",
      "Filtra por categoría, marca o precio",
      "Usa el buscador para productos específicos",
      "Lee las descripciones y especificaciones de cada producto"
    ]
  },
  {
    number: 3,
    title: "Agrega productos al carrito",
    description: "Selecciona la cantidad y variantes que necesitas, luego agrega los productos a tu carrito de compras.",
    icon: ShoppingCart,
    details: [
      "Haz clic en el producto que te interesa",
      "Selecciona la cantidad deseada",
      "Elige variantes (si aplica)",
      "Haz clic en 'Agregar al carrito'"
    ]
  },
  {
    number: 4,
    title: "Revisa tu carrito",
    description: "Antes de finalizar, revisa todos los productos en tu carrito y ajusta cantidades si es necesario.",
    icon: Package,
    details: [
      "Ve a tu carrito de compras",
      "Revisa los productos y cantidades",
      "Ajusta o elimina productos si es necesario",
      "Verifica los precios y totales"
    ]
  },
  {
    number: 5,
    title: "Procede al checkout",
    description: "Completa tu información de envío, elige el método de pago y confirma tu pedido.",
    icon: CreditCard,
    details: [
      "Haz clic en 'Finalizar compra'",
      "Ingresa o confirma tu dirección de envío",
      "Selecciona el método de pago",
      "Revisa el resumen de tu pedido"
    ]
  },
  {
    number: 6,
    title: "Confirma tu pedido",
    description: "Una vez confirmado, recibirás un email con los detalles de tu pedido y podrás hacer seguimiento en tiempo real.",
    icon: CheckCircle,
    details: [
      "Confirma todos los datos",
      "Haz clic en 'Confirmar pedido'",
      "Recibirás un email de confirmación",
      "Puedes hacer seguimiento desde tu cuenta"
    ]
  }
]

const paymentMethods = [
  {
    name: "Tarjeta de Crédito/Débito",
    description: "Aceptamos todas las tarjetas principales. Pago seguro procesado por nuestro sistema.",
    icon: CreditCard
  },
  {
    name: "Transferencia Bancaria",
    description: "Realiza tu pago directamente a nuestra cuenta bancaria. Te enviaremos los datos por email.",
    icon: Package
  },
  {
    name: "Efectivo (Solo en tienda)",
    description: "Puedes retirar tu pedido en nuestra tienda física y pagar en efectivo al momento del retiro.",
    icon: ShoppingCart
  }
]

const tips = [
  "Crea una cuenta para hacer seguimiento de tus pedidos y acceder a descuentos exclusivos",
  "Revisa la disponibilidad de productos antes de agregarlos al carrito",
  "Aprovecha nuestras promociones y ofertas especiales",
  "Puedes reservar productos con un depósito y pagar el resto al retirar",
  "Consulta nuestro horario de atención antes de retirar en tienda"
]

export default function ComoComprarPage() {
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
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">¿Cómo Comprar?</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Guía paso a paso para realizar tus compras en Ferretería Urkupina de forma fácil y segura.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isEven = index % 2 === 0

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-6 items-center`}
              >
                {/* Icon and Number */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg">
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {step.number}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl p-6 shadow-lg border border-neutral-200">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{step.title}</h3>
                  <p className="text-neutral-600 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-neutral-700">
                        <ArrowRight className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Métodos de Pago</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{method.name}</h3>
                  <p className="text-neutral-600 text-sm">{method.description}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-8 text-white mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <HelpCircle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-4">Consejos Útiles</h3>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">¿Listo para comenzar?</h3>
          <p className="text-neutral-600 mb-6">Explora nuestro catálogo y encuentra todo lo que necesitas.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Ver Catálogo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg border-2 border-orange-600 hover:bg-orange-50 transition-colors"
            >
              Crear Cuenta
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

