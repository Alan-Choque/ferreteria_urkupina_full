"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

type FormData = {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  documentType: "CI" | "NIT" | "PASSPORT"
  documentNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  department: string
  postalCode: string
  acceptTerms: boolean
}

type Errors = Partial<Record<keyof FormData, string>>
type Touched = Partial<Record<keyof FormData, boolean>>

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    documentType: "CI",
    documentNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    department: "",
    postalCode: "",
    acceptTerms: false,
  })

  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordStrength = (password: string) => {
    if (!password) return { level: "weak", label: "Débil" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 2) return { level: "weak", label: "Débil" }
    if (strength <= 3) return { level: "medium", label: "Media" }
    return { level: "strong", label: "Fuerte" }
  }

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return "El correo electrónico es obligatorio"
    if (!emailRegex.test(value)) return "El correo no es válido"
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria"
    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    if (!/[a-z]/.test(value)) return "Debe contener al menos una letra minúscula"
    if (!/[A-Z]/.test(value)) return "Debe contener al menos una letra mayúscula"
    if (!/\d/.test(value)) return "Debe contener al menos un número"
    return ""
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Debe confirmar la contraseña"
    if (value !== formData.password) return "Las contraseñas no coinciden"
    return ""
  }

  const validatePhone = (value: string) => {
    if (!value) return "El teléfono es obligatorio"
    const phoneRegex = /^[\d\s+\-()]{7,15}$/
    if (!phoneRegex.test(value)) return "El teléfono no es válido"
    return ""
  }

  const validateDocumentNumber = (value: string) => {
    if (!value) return "El número de documento es obligatorio"
    if (value.length < 5 || value.length > 20) return "Debe tener entre 5 y 20 caracteres"
    if (!/^[a-zA-Z0-9]+$/.test(value)) return "Solo caracteres alfanuméricos permitidos"
    return ""
  }

  const validateName = (value: string, fieldName: string) => {
    if (!value) return `${fieldName} es obligatorio`
    if (value.length < 2 || value.length > 60) return `${fieldName} debe tener entre 2 y 60 caracteres`
    return ""
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (touched[field]) {
      validateField(field, value)
    }
  }

  const validateField = (field: keyof FormData, value: string | boolean) => {
    let error = ""
    switch (field) {
      case "email":
        error = validateEmail(value as string)
        break
      case "password":
        error = validatePassword(value as string)
        break
      case "confirmPassword":
        error = validateConfirmPassword(value as string)
        break
      case "phone":
        error = validatePhone(value as string)
        break
      case "documentNumber":
        error = validateDocumentNumber(value as string)
        break
      case "firstName":
        error = validateName(value as string, "Nombre")
        break
      case "lastName":
        error = validateName(value as string, "Apellidos")
        break
      case "city":
        error = validateName(value as string, "Ciudad")
        break
      case "department":
        error = validateName(value as string, "Departamento")
        break
    }
    setErrors({ ...errors, [field]: error })
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, formData[field])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const requiredFields: (keyof FormData)[] = [
      "email",
      "password",
      "confirmPassword",
      "firstName",
      "lastName",
      "phone",
      "documentNumber",
      "addressLine1",
      "city",
      "department",
      "acceptTerms",
    ]

    const newErrors: Errors = {}
    requiredFields.forEach((field) => {
      const value = formData[field]
      if (typeof value === "boolean" && !value && field === "acceptTerms") {
        newErrors[field] = "Debe aceptar los términos y condiciones"
      } else if (typeof value === "string" && !value) {
        newErrors[field] = `Este campo es obligatorio`
      } else {
        validateField(field, value)
      }
    })

    const allTouched = requiredFields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Touched)

    setTouched(allTouched)

    if (Object.keys(newErrors).length === 0 && Object.values(errors).every((e) => !e)) {
      console.log("Register submit:", formData)
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

  return (
    <main className="min-h-screen bg-neutral-50 pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-neutral-900 mb-12 text-center">Crear nueva cuenta de cliente</h1>

        <div className="bg-white border border-neutral-200 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Account Section */}
            <fieldset className="space-y-5">
              <legend className="text-xl font-bold text-neutral-900">Información de Cuenta</legend>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                  Correo electrónico <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                    touched.email && errors.email ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="ejemplo@correo.com"
                />
                {touched.email && errors.email && (
                  <p id="email-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Contraseña <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    aria-invalid={touched.password && !!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors pr-12 ${
                      touched.password && errors.password ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Crea una contraseña segura"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${
                            i < (passwordStrength.level === "weak" ? 1 : passwordStrength.level === "medium" ? 2 : 3)
                              ? strengthColors[passwordStrength.level]
                              : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600">
                      Fuerza de la contraseña: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p id="password-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-900 mb-2">
                  Confirmar contraseña <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors pr-12 ${
                      touched.confirmPassword && errors.confirmPassword
                        ? "border-red-600 bg-red-50"
                        : "border-neutral-300"
                    }`}
                    placeholder="Confirma tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Personal Details Section */}
            <fieldset className="space-y-5 pt-5 border-t border-neutral-200">
              <legend className="text-xl font-bold text-neutral-900">Información Personal</legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-neutral-900 mb-2">
                    Nombre <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    onBlur={() => handleBlur("firstName")}
                    aria-invalid={touched.firstName && !!errors.firstName}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                      touched.firstName && errors.firstName ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Tu nombre"
                  />
                  {touched.firstName && errors.firstName && (
                    <p id="firstName-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-neutral-900 mb-2">
                    Apellidos <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    onBlur={() => handleBlur("lastName")}
                    aria-invalid={touched.lastName && !!errors.lastName}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                      touched.lastName && errors.lastName ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Tus apellidos"
                  />
                  {touched.lastName && errors.lastName && (
                    <p id="lastName-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-900 mb-2">
                  Teléfono <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  aria-invalid={touched.phone && !!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                    touched.phone && errors.phone ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="+56 9 1234 5678"
                />
                {touched.phone && errors.phone && (
                  <p id="phone-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.phone}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Identification Section */}
            <fieldset className="space-y-5 pt-5 border-t border-neutral-200">
              <legend className="text-xl font-bold text-neutral-900">Identificación</legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Document Type */}
                <div>
                  <label htmlFor="documentType" className="block text-sm font-medium text-neutral-900 mb-2">
                    Tipo de documento <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="documentType"
                    value={formData.documentType}
                    onChange={(e) => handleChange("documentType", e.target.value)}
                    onBlur={() => handleBlur("documentType")}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                  >
                    <option value="CI">Cédula de Identidad (CI)</option>
                    <option value="NIT">NIT</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </div>

                {/* Document Number */}
                <div>
                  <label htmlFor="documentNumber" className="block text-sm font-medium text-neutral-900 mb-2">
                    Número de documento <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="documentNumber"
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => handleChange("documentNumber", e.target.value)}
                    onBlur={() => handleBlur("documentNumber")}
                    aria-invalid={touched.documentNumber && !!errors.documentNumber}
                    aria-describedby={errors.documentNumber ? "documentNumber-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                      touched.documentNumber && errors.documentNumber
                        ? "border-red-600 bg-red-50"
                        : "border-neutral-300"
                    }`}
                    placeholder="Ingresa tu número de documento"
                  />
                  {touched.documentNumber && errors.documentNumber && (
                    <p id="documentNumber-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {errors.documentNumber}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Address Section */}
            <fieldset className="space-y-5 pt-5 border-t border-neutral-200">
              <legend className="text-xl font-bold text-neutral-900">Dirección</legend>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-neutral-900 mb-2">
                  Dirección <span className="text-red-600">*</span>
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  onBlur={() => handleBlur("addressLine1")}
                  aria-invalid={touched.addressLine1 && !!errors.addressLine1}
                  aria-describedby={errors.addressLine1 ? "addressLine1-error" : undefined}
                  className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                    touched.addressLine1 && errors.addressLine1 ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="Calle, número y edificio"
                />
                {touched.addressLine1 && errors.addressLine1 && (
                  <p id="addressLine1-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.addressLine1}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-neutral-900 mb-2">
                  Información adicional
                </label>
                <input
                  id="addressLine2"
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                  placeholder="Apartamento, suite, etc. (opcional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-neutral-900 mb-2">
                    Ciudad <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    onBlur={() => handleBlur("city")}
                    aria-invalid={touched.city && !!errors.city}
                    aria-describedby={errors.city ? "city-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                      touched.city && errors.city ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Tu ciudad"
                  />
                  {touched.city && errors.city && (
                    <p id="city-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-neutral-900 mb-2">
                    Departamento <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    onBlur={() => handleBlur("department")}
                    aria-invalid={touched.department && !!errors.department}
                    aria-describedby={errors.department ? "department-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                      touched.department && errors.department ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Tu departamento"
                  />
                  {touched.department && errors.department && (
                    <p id="department-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-neutral-900 mb-2">
                  Código postal
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
                  placeholder="Código postal (opcional)"
                />
              </div>
            </fieldset>

            {/* Terms & Newsletter */}
            <fieldset className="space-y-4 pt-5 border-t border-neutral-200">
              <legend className="sr-only">Términos y condiciones</legend>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleChange("acceptTerms", e.target.checked)}
                  onBlur={() => handleBlur("acceptTerms")}
                  aria-invalid={touched.acceptTerms && !!errors.acceptTerms}
                  aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
                  className="w-4 h-4 mt-1 accent-red-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-neutral-700">
                  Acepto los{" "}
                  <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                    Política de Privacidad
                  </a>
                  <span className="text-red-600">*</span>
                </span>
              </label>
              {touched.acceptTerms && errors.acceptTerms && (
                <p id="terms-error" className="text-red-600 text-sm font-medium">
                  {errors.acceptTerms}
                </p>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-600 cursor-pointer" />
                <span className="text-sm text-neutral-700">Suscribirme al boletín de Ferretería Urkupina</span>
              </label>
            </fieldset>

            {/* Submit Button */}
            <div className="pt-5 border-t border-neutral-200 space-y-4">
              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-700 text-white font-semibold rounded hover:bg-neutral-800 transition-colors"
              >
                Crear cuenta
              </button>

              <p className="text-center text-xs text-neutral-600">* Campos obligatorios</p>

              <p className="text-center text-sm text-neutral-700">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
