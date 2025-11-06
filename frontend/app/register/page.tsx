"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/services/auth-service"
import { useFormSubmit } from "@/hooks/use-form-submit"

type FormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

type Errors = Partial<Record<keyof FormData, string>>
type Touched = Partial<Record<keyof FormData, boolean>>

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  const [errors, setErrors] = useState<Errors & { submit?: string }>({})
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
    return ""
  }

  const validateUsername = (value: string) => {
    if (!value) return "El nombre de usuario es obligatorio"
    if (value.length < 3) return "El nombre de usuario debe tener al menos 3 caracteres"
    if (value.length > 50) return "El nombre de usuario debe tener máximo 50 caracteres"
    if (/\s/.test(value)) return "El nombre de usuario no puede contener espacios"
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
      case "username":
        error = validateUsername(value as string)
        break
      case "email":
        error = validateEmail(value as string)
        break
      case "password":
        error = validatePassword(value as string)
        break
      case "confirmPassword":
        error = validateConfirmPassword(value as string)
        break
    }
    setErrors({ ...errors, [field]: error })
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, formData[field])
  }

  const { submit, isSubmitting } = useFormSubmit(
    async (data: { username: string; email: string; password: string }) => {
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      return response
    },
    {
      debounceMs: 300,
      onSuccess: (response) => {
        router.push("/admin")
      },
      onError: (error) => {
        setErrors({ submit: error.message })
      },
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}) // Clear previous errors

    const requiredFields: (keyof FormData)[] = [
      "username",
      "email",
      "password",
      "confirmPassword",
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden" })
      return
    }

    await submit({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    })
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-900 mb-2">
                Nombre de usuario <span className="text-red-600">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                onBlur={() => handleBlur("username")}
                aria-invalid={touched.username && !!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
                className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors ${
                  touched.username && errors.username ? "border-red-600 bg-red-50" : "border-neutral-300"
                }`}
                placeholder="usuario123"
              />
              {touched.username && errors.username && (
                <p id="username-error" className="text-red-600 text-sm mt-1.5 font-medium">
                  {errors.username}
                </p>
              )}
            </div>

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

            {/* Terms */}
            <div className="space-y-4 pt-5 border-t border-neutral-200">

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

            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-5 border-t border-neutral-200 space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
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
