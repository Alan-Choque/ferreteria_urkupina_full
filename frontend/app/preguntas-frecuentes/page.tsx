"use client"

import { motion } from "framer-motion"
import { ChevronDown, HelpCircle, ShoppingCart, Package, CreditCard, Truck, RotateCcw, Shield } from "lucide-react"
import { useState } from "react"

const faqCategories = [
  {
    id: "general",
    title: "General",
    icon: HelpCircle,
    questions: [
      {
        question: "¿Qué es Ferretería Urkupina?",
        answer: "Ferretería Urkupina es una ferretería ubicada en Guayaramerin, Bolivia, especializada en herramientas de construcción, equipos industriales, materiales de construcción y más. Ofrecemos productos de calidad para profesionales y particulares."
      },
      {
        question: "¿Dónde están ubicados?",
        answer: "Nuestra casa matriz está ubicada en Av. San Joaquín esquina Calle 'A', lado del Colegio Miguel Antelo, Guayaramerin, Bolivia. Puedes visitarnos de lunes a viernes de 8:00 a 18:00, y los sábados de 9:00 a 14:00."
      },
      {
        question: "¿Cómo puedo contactarlos?",
        answer: "Puedes contactarnos por teléfono al +591 68464378, por email a info@urkupina.com, o visitar nuestra página de contacto. También puedes seguirnos en nuestras redes sociales."
      }
    ]
  },
  {
    id: "compras",
    title: "Compras",
    icon: ShoppingCart,
    questions: [
      {
        question: "¿Cómo puedo comprar en línea?",
        answer: "Para comprar en línea, primero debes crear una cuenta en nuestro sitio web. Luego, navega por nuestro catálogo, agrega productos al carrito y procede al checkout. Puedes pagar con tarjeta de crédito, débito o transferencia bancaria."
      },
      {
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos pagos con tarjeta de crédito, tarjeta de débito, transferencia bancaria y efectivo (solo para compras en tienda física). Todos los pagos en línea son procesados de forma segura."
      },
      {
        question: "¿Puedo comprar sin crear una cuenta?",
        answer: "Sí, puedes navegar por nuestro catálogo sin crear una cuenta, pero para realizar una compra necesitarás registrarte. El registro es rápido y gratuito, y te permitirá hacer seguimiento de tus pedidos."
      },
      {
        question: "¿Los precios incluyen impuestos?",
        answer: "Sí, todos los precios mostrados en nuestro sitio web incluyen impuestos. El precio final que ves es el que pagarás, sin sorpresas adicionales."
      }
    ]
  },
  {
    id: "envios",
    title: "Envíos y Entrega",
    icon: Truck,
    questions: [
      {
        question: "¿Hacen envíos a domicilio?",
        answer: "Sí, realizamos envíos a domicilio dentro de Guayaramerin y áreas cercanas. El costo y tiempo de entrega varían según la ubicación. Puedes consultar las opciones de envío durante el proceso de checkout."
      },
      {
        question: "¿Cuánto tiempo tarda la entrega?",
        answer: "Los tiempos de entrega dependen de la disponibilidad del producto y tu ubicación. Generalmente, los productos en stock se entregan en 1-3 días hábiles dentro de Guayaramerin. Para productos especiales, el tiempo puede variar."
      },
      {
        question: "¿Puedo retirar mi pedido en la tienda?",
        answer: "Sí, ofrecemos la opción de retiro en tienda sin costo adicional. Una vez que tu pedido esté listo, recibirás una notificación y podrás retirarlo en nuestro horario de atención."
      },
      {
        question: "¿Cómo puedo hacer seguimiento de mi pedido?",
        answer: "Una vez que realices tu pedido, recibirás un número de seguimiento por email. Puedes usar este número en nuestra página de 'Seguimiento de Compra' para ver el estado actualizado de tu pedido en tiempo real."
      }
    ]
  },
  {
    id: "devoluciones",
    title: "Devoluciones y Garantías",
    icon: RotateCcw,
    questions: [
      {
        question: "¿Puedo devolver un producto?",
        answer: "Sí, aceptamos devoluciones dentro de los 7 días posteriores a la compra, siempre que el producto esté en su estado original, sin usar y con su empaque original. Algunos productos pueden tener políticas de devolución específicas."
      },
      {
        question: "¿Cómo proceso una devolución?",
        answer: "Para procesar una devolución, contacta a nuestro servicio al cliente por teléfono o email con tu número de pedido. Te guiaremos a través del proceso y coordinaremos la recolección o el retorno del producto."
      },
      {
        question: "¿Qué productos tienen garantía?",
        answer: "La mayoría de nuestros productos tienen garantía del fabricante. El período de garantía varía según el producto y el fabricante. Consulta la información de garantía en la página del producto o contacta a nuestro equipo para más detalles."
      },
      {
        question: "¿Cuánto tiempo tarda el reembolso?",
        answer: "Una vez que recibamos y verifiquemos el producto devuelto, procesaremos el reembolso en un plazo de 5-10 días hábiles. El tiempo de acreditación en tu cuenta bancaria puede variar según tu banco."
      }
    ]
  },
  {
    id: "productos",
    title: "Productos",
    icon: Package,
    questions: [
      {
        question: "¿Cómo sé si un producto está en stock?",
        answer: "En la página de cada producto verás el estado de disponibilidad. Si el producto está disponible, podrás agregarlo al carrito. Si está agotado, puedes registrarte para recibir una notificación cuando vuelva a estar disponible."
      },
      {
        question: "¿Puedo reservar un producto?",
        answer: "Sí, ofrecemos el servicio de reserva o apartado. Puedes reservar un producto con un depósito y recogerlo o recibirlo cuando esté disponible. Consulta nuestra página de reservaciones para más información."
      },
      {
        question: "¿Los productos tienen manuales de uso?",
        answer: "Muchos de nuestros productos incluyen manuales de uso. Puedes descargar los manuales desde la página del producto o contactarnos para solicitar documentación adicional."
      },
      {
        question: "¿Ofrecen asesoría técnica?",
        answer: "Sí, nuestro equipo está capacitado para brindarte asesoría técnica sobre nuestros productos. Puedes contactarnos por teléfono, email o visitarnos en nuestra tienda física."
      }
    ]
  },
  {
    id: "cuenta",
    title: "Mi Cuenta",
    icon: Shield,
    questions: [
      {
        question: "¿Cómo creo una cuenta?",
        answer: "Crear una cuenta es muy fácil. Haz clic en 'Registrarse' en la parte superior de la página, completa el formulario con tus datos y verifica tu email. Una vez verificado, podrás iniciar sesión y comenzar a comprar."
      },
      {
        question: "Olvidé mi contraseña, ¿qué hago?",
        answer: "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' e ingresa tu email. Recibirás un enlace para restablecer tu contraseña de forma segura."
      },
      {
        question: "¿Puedo cambiar mis datos personales?",
        answer: "Sí, puedes actualizar tus datos personales en cualquier momento desde la sección 'Mi Perfil' en tu cuenta. Allí podrás modificar tu información de contacto, dirección y preferencias."
      },
      {
        question: "¿Cómo veo mi historial de compras?",
        answer: "Puedes ver tu historial completo de compras en la sección 'Mis Pedidos' de tu cuenta. Allí encontrarás todos tus pedidos anteriores con detalles, facturas descargables y opciones de seguimiento."
      }
    ]
  }
]

export default function PreguntasFrecuentesPage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

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
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Preguntas Frecuentes</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre nuestros productos, compras, envíos y más.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon
            const isCategoryOpen = openCategory === category.id

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => setOpenCategory(isCategoryOpen ? null : category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900">{category.title}</h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Questions */}
                {isCategoryOpen && (
                  <div className="border-t border-neutral-200">
                    {category.questions.map((item, questionIndex) => {
                      const questionId = `${category.id}-${questionIndex}`
                      const isQuestionOpen = openQuestion === questionId

                      return (
                        <div key={questionIndex} className="border-b border-neutral-100 last:border-b-0">
                          <button
                            onClick={() => setOpenQuestion(isQuestionOpen ? null : questionId)}
                            className="w-full px-6 py-4 text-left flex items-start justify-between gap-4 hover:bg-neutral-50 transition-colors"
                          >
                            <span className="font-semibold text-neutral-900 flex-1">{item.question}</span>
                            <ChevronDown
                              className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform mt-1 ${
                                isQuestionOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isQuestionOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-6 pb-4"
                            >
                              <p className="text-neutral-600 leading-relaxed">{item.answer}</p>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">¿No encontraste lo que buscabas?</h3>
          <p className="text-orange-100 mb-6">
            Nuestro equipo está listo para ayudarte. Contáctanos y te responderemos lo antes posible.
          </p>
          <a
            href="/contacto"
            className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Contáctanos
          </a>
        </motion.div>
      </div>
    </div>
  )
}

