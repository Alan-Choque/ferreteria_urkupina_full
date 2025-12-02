"use client"

import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "general",
    message: "",
  })

  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Nombre requerido"
    if (!formData.email.includes("@")) newErrors.email = "Email inválido"
    if (!/^\d{7,15}$/.test(formData.phone)) newErrors.phone = "Teléfono debe tener 7-15 dígitos"
    if (!formData.message.trim()) newErrors.message = "Mensaje requerido"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      setSubmitted(true)
      setFormData({ name: "", email: "", phone: "", reason: "general", message: "" })
      setTimeout(() => setSubmitted(false), 5000)
    }
  }

  const faqs = [
    {
      question: "¿Cuál es el tiempo de entrega?",
      answer: "Los pedidos se entregan en 2-3 días hábiles en La Paz y Cochabamba, 3-5 días en Santa Cruz.",
    },
    {
      question: "¿Cuál es la política de devoluciones?",
      answer: "Aceptamos devoluciones dentro de 15 días desde la compra con producto en buen estado.",
    },
    {
      question: "¿Ofrecen envío gratuito?",
      answer: "Sí, envío gratuito en compras superiores a Bs. 300.",
    },
  ]

  return (
    <main className="min-h-screen bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Contáctanos</h1>

          <div className="grid grid-cols-2 gap-12 mb-16">
            {/* Contact Form */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900">Envía tu Consulta</h2>

              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold">
                  ✓ Mensaje enviado exitosamente. Te contactaremos pronto.
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.name ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.email ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Teléfono <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.phone ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="71234567"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Motivo</label>
                <select
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="general">Consulta General</option>
                  <option value="support">Soporte Técnico</option>
                  <option value="complaint">Reclamo</option>
                  <option value="suggestion">Sugerencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">
                  Mensaje <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.message ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                  rows={6}
                />
                {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message}</p>}
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Enviar Mensaje
              </button>
            </div>

            {/* Info & FAQs */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Información de Contacto</h3>
                <div className="space-y-3 text-neutral-700">
                  <p>
                    <span className="font-bold">📧 Email:</span> info@urkupina.com
                  </p>
                  <p>
                    <span className="font-bold">📞 Teléfono:</span> (591-2) 123-4567
                  </p>
                  <p>
                    <span className="font-bold">🕒 Horario:</span>
                    <br />
                    Lunes-Viernes: 8:00 - 18:00
                    <br />
                    Sábados: 9:00 - 14:00
                  </p>
                </div>
              </div>

              {/* FAQs */}
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Preguntas Frecuentes</h3>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <details
                      key={index}
                      className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer"
                    >
                      <summary className="font-bold text-neutral-900 hover:text-red-600">{faq.question}</summary>
                      <p className="mt-3 text-neutral-700 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
                <h4 className="font-bold text-neutral-900 mb-3">Políticas</h4>
                <div className="space-y-2 text-sm">
                  <a href="/politica-privacidad" className="text-red-600 hover:underline">
                    Política de Privacidad
                  </a>
                  <br />
                  <a href="/politica-cookies" className="text-red-600 hover:underline">
                    Política de Cookies
                  </a>
                  <br />
                  <a href="/terminos-condiciones" className="text-red-600 hover:underline">
                    Términos y Condiciones
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  )
}
