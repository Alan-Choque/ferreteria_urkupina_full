"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"

interface CheckoutStep {
  number: number
  title: string
  completed: boolean
}

interface CheckoutData {
  firstName: string
  lastName: string
  email: string
  phone: string
  documentType: "CI" | "NIT" | "PASSPORT"
  documentNumber: string
  shippingMethod: "delivery" | "pickup"
  address?: string
  store?: string
  paymentMethod: "card" | "qr" | "cash"
  notes?: string
  coupon?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    documentType: "CI",
    documentNumber: "",
    shippingMethod: "delivery",
    paymentMethod: "card",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState("")

  const subtotal = 450000 // Mock subtotal in BOB
  const shipping = formData.shippingMethod === "delivery" ? 50 : 0
  const total = subtotal - discount + shipping

  const steps: CheckoutStep[] = [
    { number: 1, title: "Detalles", completed: false },
    { number: 2, title: "Envío", completed: false },
    { number: 3, title: "Pago", completed: false },
    { number: 4, title: "Confirmación", completed: false },
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "Nombre requerido"
      if (!formData.lastName.trim()) newErrors.lastName = "Apellido requerido"
      if (!formData.email.includes("@")) newErrors.email = "Email inválido"
      if (!/^\d{7,15}$/.test(formData.phone)) newErrors.phone = "Teléfono debe tener 7-15 dígitos"
      if (!formData.documentNumber.trim()) newErrors.documentNumber = "Documento requerido"
    }

    if (step === 2) {
      if (formData.shippingMethod === "delivery" && !formData.address?.trim()) {
        newErrors.address = "Dirección requerida"
      }
      if (formData.shippingMethod === "pickup" && !formData.store) {
        newErrors.store = "Tienda requerida"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const applyCoupon = () => {
    if (!formData.coupon) return

    const coupons: Record<string, number> = {
      BIENVENIDO10: 0.1,
      ENVIOGRATIS: 0,
    }

    if (formData.coupon === "BIENVENIDO10") {
      setDiscount(subtotal * 0.1)
      setCouponApplied("BIENVENIDO10")
    } else if (formData.coupon === "ENVIOGRATIS" && subtotal >= 300) {
      setDiscount(shipping)
      setCouponApplied("ENVIOGRATIS")
    } else {
      setErrors({ coupon: "Cupón inválido o no aplica" })
    }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePlaceOrder = () => {
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase()
    router.push(`/order/${orderId}`)
  }

  const handleInputChange = (field: keyof CheckoutData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => step.number <= currentStep && setCurrentStep(step.number)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      step.number <= currentStep ? "bg-red-600 text-white" : "bg-neutral-200 text-neutral-600"
                    }`}
                    aria-current={step.number === currentStep ? "step" : undefined}
                  >
                    {step.number}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 ${step.number < currentStep ? "bg-red-600" : "bg-neutral-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">{steps[currentStep - 1].title}</h1>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="col-span-2">
              {/* Step 1: Customer Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 mb-2">
                        Nombre <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                          errors.firstName ? "border-red-600" : "border-neutral-300"
                        }`}
                        placeholder="Juan"
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                      />
                      {errors.firstName && (
                        <p id="firstName-error" className="text-red-600 text-sm mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 mb-2">
                        Apellido <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                          errors.lastName ? "border-red-600" : "border-neutral-300"
                        }`}
                        placeholder="Pérez"
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                      />
                      {errors.lastName && (
                        <p id="lastName-error" className="text-red-600 text-sm mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
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
                      placeholder="juan@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-red-600 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                      />
                      {errors.phone && (
                        <p id="phone-error" className="text-red-600 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 mb-2">
                        Tipo Documento <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.documentType}
                        onChange={(e) =>
                          handleInputChange("documentType", e.target.value as CheckoutData["documentType"])
                        }
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="CI">Cédula de Identidad</option>
                        <option value="NIT">NIT</option>
                        <option value="PASSPORT">Pasaporte</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">
                      Número Documento <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange("documentNumber", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                        errors.documentNumber ? "border-red-600" : "border-neutral-300"
                      }`}
                      placeholder="12345678"
                      aria-invalid={!!errors.documentNumber}
                      aria-describedby={errors.documentNumber ? "documentNumber-error" : undefined}
                    />
                    {errors.documentNumber && (
                      <p id="documentNumber-error" className="text-red-600 text-sm mt-1">
                        {errors.documentNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Método de Envío</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="delivery"
                          checked={formData.shippingMethod === "delivery"}
                          onChange={(e) => handleInputChange("shippingMethod", e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 flex-1 text-neutral-900 font-medium">Entrega a Domicilio - Bs. 50</span>
                      </label>
                      <label className="flex items-center p-4 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                        <input
                          type="radio"
                          name="shipping"
                          value="pickup"
                          checked={formData.shippingMethod === "pickup"}
                          onChange={(e) => handleInputChange("shippingMethod", e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 flex-1 text-neutral-900 font-medium">Recoger en Tienda</span>
                      </label>
                    </div>
                  </div>

                  {formData.shippingMethod === "delivery" && (
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 mb-2">
                        Dirección <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={formData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                          errors.address ? "border-red-600" : "border-neutral-300"
                        }`}
                        placeholder="Calle, número, apartamento..."
                        rows={4}
                        aria-invalid={!!errors.address}
                        aria-describedby={errors.address ? "address-error" : undefined}
                      />
                      {errors.address && (
                        <p id="address-error" className="text-red-600 text-sm mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.shippingMethod === "pickup" && (
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 mb-2">
                        Seleccione Tienda <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.store || ""}
                        onChange={(e) => handleInputChange("store", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                          errors.store ? "border-red-600" : "border-neutral-300"
                        }`}
                        aria-invalid={!!errors.store}
                        aria-describedby={errors.store ? "store-error" : undefined}
                      >
                        <option value="">-- Seleccione --</option>
                        <option value="sucursal-la-paz">Sucursal La Paz</option>
                        <option value="sucursal-cochabamba">Sucursal Cochabamba</option>
                        <option value="sucursal-santa-cruz">Sucursal Santa Cruz</option>
                      </select>
                      {errors.store && (
                        <p id="store-error" className="text-red-600 text-sm mt-1">
                          {errors.store}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Método de Pago</h3>
                    <div className="space-y-3">
                      {["card", "qr", "cash"].map((method) => (
                        <label
                          key={method}
                          className="flex items-center p-4 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50"
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method}
                            checked={formData.paymentMethod === method}
                            onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="ml-3 flex-1 text-neutral-900 font-medium capitalize">
                            {method === "card" && "Tarjeta de Crédito/Débito"}
                            {method === "qr" && "Código QR (MercadoPago, Qvapor)"}
                            {method === "cash" && "Contra Entrega"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Notas Adicionales</label>
                    <textarea
                      value={formData.notes || ""}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="Instrucciones especiales de entrega..."
                      rows={4}
                    />
                  </div>

                  <div className="p-4 bg-neutral-100 rounded-lg">
                    <p className="text-sm text-neutral-700">
                      <strong>Nota:</strong> Esta es una demostración. Los datos de pago no se procesarán.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                    <h3 className="text-2xl font-bold text-green-700 mb-2">¡Pedido Confirmado!</h3>
                    <p className="text-neutral-700">
                      Recibirás un email de confirmación en: <strong>{formData.email}</strong>
                    </p>
                  </div>

                  <div className="space-y-4 p-6 bg-neutral-50 rounded-lg">
                    <h4 className="font-bold text-neutral-900">Resumen del Pedido</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span className="font-medium">
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Método de Envío:</span>
                        <span className="font-medium capitalize">
                          {formData.shippingMethod === "delivery" ? "Entrega a Domicilio" : "Recoger en Tienda"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Método de Pago:</span>
                        <span className="font-medium capitalize">
                          {formData.paymentMethod === "card" && "Tarjeta"}
                          {formData.paymentMethod === "qr" && "QR"}
                          {formData.paymentMethod === "cash" && "Contra Entrega"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="col-span-1">
              <div className="sticky top-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="font-bold text-neutral-900 mb-4">Resumen de Pedido</h3>

                <div className="space-y-4 pb-4 border-b border-neutral-200">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Bs. {subtotal.toLocaleString("es-BO")}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Descuento ({couponApplied}):</span>
                      <span>-Bs. {discount.toLocaleString("es-BO")}</span>
                    </div>
                  )}
                  {formData.shippingMethod === "delivery" && (
                    <div className="flex justify-between text-sm">
                      <span>Envío:</span>
                      <span>Bs. {shipping}</span>
                    </div>
                  )}
                </div>

                <div className="py-4 mb-4 border-b border-neutral-200">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>Bs. {total.toLocaleString("es-BO")}</span>
                  </div>
                </div>

                {currentStep <= 3 && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-neutral-900 mb-2">Código Cupón</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.coupon || ""}
                        onChange={(e) => handleInputChange("coupon", e.target.value)}
                        placeholder="BIENVENIDO10"
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                        disabled={couponApplied !== ""}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponApplied !== ""}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:bg-neutral-400"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponApplied && <p className="text-green-600 text-sm mt-2">✓ Cupón aplicado: {couponApplied}</p>}
                  </div>
                )}

                <div className="space-y-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="w-full py-3 border border-neutral-300 rounded-lg text-neutral-900 font-bold hover:bg-neutral-100 transition-colors"
                    >
                      Atrás
                    </button>
                  )}
                  {currentStep < 4 && (
                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  )}
                  {currentStep === 4 && (
                    <button
                      onClick={handlePlaceOrder}
                      className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                    >
                      Ir a Mi Pedido
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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
