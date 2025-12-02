"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, UserPlus, Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { authService } from "@/lib/services/auth-service"
import { useFormSubmit } from "@/hooks/use-form-submit"

type FormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
  nitCi: string
  telefono: string
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
    nitCi: "",
    telefono: "",
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
    async (data: { username: string; email: string; password: string; nitCi: string; telefono: string }) => {
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        nitCi: data.nitCi,
        telefono: data.telefono,
      })
      return response
    },
    {
      debounceMs: 300,
      onSuccess: () => {
        router.push("/login?registered=1")
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
      "nitCi",
      "telefono",
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
      nitCi: formData.nitCi,
      telefono: formData.telefono,
    })
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

  const handleClear = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      nitCi: "",
      telefono: "",
      acceptTerms: false,
    })
    setErrors({})
    setTouched({})
  }

  return (
    <main className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 min-h-screen -mb-35">
      <div className="max-w-7xl mx-auto px-3 pt-4 pb-6 md:pt-4 md:pb-6 lg:pt-4 lg:pb-6">
        {/* Contenido principal */}
        <div className="max-w-[860px] mx-auto">
          {/* Mensaje de bienvenida */}
          <div className="text-center mb-1">
            <h1 className="text-base md:text-lg font-bold text-neutral-900 mb-0.5">
              ¡Únete a nosotros!
            </h1>
            <p className="text-xs text-neutral-600 max-w-2xl mx-auto">
              Crea tu cuenta y disfruta de todos los beneficios de Ferretería Urkupina en Guayaramerin
            </p>
          </div>

          <div className="max-w-[720px] mx-auto">
            {/* Register Form */}
            <div className="bg-white border border-neutral-200 rounded-lg p-3.5 md:p-4.5 shadow-lg">
              {/* Logo y nombre del sistema */}
              <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b border-neutral-200">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src="/logo-cyber-serpents.png"
                    alt="Cyber Serpents Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold leading-tight text-neutral-900">
                    SIGEF
                  </h2>
                  <p className="text-[10px] leading-tight text-neutral-600">
                    Sistema de Gestión de Ferreterías - Cyber Serpents
                  </p>
                </div>
              </div>

              {/* Título del formulario */}
              <div className="mb-2">
                <h3 className="text-base font-semibold text-neutral-900 mb-0.5">Crea tu cuenta</h3>
                <p className="text-xs text-neutral-600">Completa el siguiente formulario para registrarte</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Nombre de usuario <span className="text-orange-600">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                onBlur={() => handleBlur("username")}
                aria-invalid={touched.username && !!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
                  touched.username && errors.username ? "border-red-600 bg-red-50" : "border-neutral-300"
                }`}
                placeholder="usuario123"
              />
              {touched.username && errors.username && (
                <p id="username-error" className="text-red-600 text-xs mt-1 font-medium">
                  {errors.username}
                </p>
              )}
            </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Correo electrónico <span className="text-orange-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
                    touched.email && errors.email ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="ejemplo@correo.com"
                />
                {touched.email && errors.email && (
                  <p id="email-error" className="text-red-600 text-xs mt-1 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Contraseña <span className="text-orange-600">*</span>
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
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-10 ${
                      touched.password && errors.password ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Crea una contraseña segura"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-1.5 space-y-0.5">
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
                    <p className="text-[10px] text-neutral-600">
                      Fuerza: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p id="password-error" className="text-red-600 text-xs mt-1 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-900 mb-1.5">
                    Confirmar contraseña <span className="text-orange-600">*</span>
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
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-10 ${
                      touched.confirmPassword && errors.confirmPassword
                        ? "border-red-600 bg-red-50"
                        : "border-neutral-300"
                    }`}
                    placeholder="Confirma tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-red-600 text-xs mt-1 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* CI/NIT */}
              <div>
                <label htmlFor="nitCi" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  CI/NIT <span className="text-orange-600">*</span>
                </label>
                <input
                  id="nitCi"
                  type="text"
                  value={formData.nitCi}
                  onChange={(e) => handleChange("nitCi", e.target.value)}
                  onBlur={() => handleBlur("nitCi")}
                  aria-invalid={touched.nitCi && !!errors.nitCi}
                  aria-describedby={errors.nitCi ? "nitCi-error" : undefined}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
                    touched.nitCi && errors.nitCi ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="Ej: 12345678 o 1234567890123"
                />
                {touched.nitCi && errors.nitCi && (
                  <p id="nitCi-error" className="text-red-600 text-xs mt-1 font-medium">
                    {errors.nitCi}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-neutral-900 mb-1.5">
                  Teléfono <span className="text-orange-600">*</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  onBlur={() => handleBlur("telefono")}
                  aria-invalid={touched.telefono && !!errors.telefono}
                  aria-describedby={errors.telefono ? "telefono-error" : undefined}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
                    touched.telefono && errors.telefono ? "border-red-600 bg-red-50" : "border-neutral-300"
                  }`}
                  placeholder="Ej: +591 70000000"
                />
                {touched.telefono && errors.telefono && (
                  <p id="telefono-error" className="text-red-600 text-xs mt-1 font-medium">
                    {errors.telefono}
                  </p>
                )}
              </div>
                </div>

            {/* Terms */}
            <div className="space-y-1.5 pt-1.5 border-t border-neutral-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleChange("acceptTerms", e.target.checked)}
                  onBlur={() => handleBlur("acceptTerms")}
                  aria-invalid={touched.acceptTerms && !!errors.acceptTerms}
                  aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
                  className="w-3.5 h-3.5 mt-0.5 accent-orange-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-neutral-700">
                  Acepto los{" "}
                  <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                    Términos y Condiciones
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                    Política de Privacidad
                  </a>
                  <span className="text-orange-600">*</span>
                </span>
              </label>
              {touched.acceptTerms && errors.acceptTerms && (
                <p id="terms-error" className="text-red-600 text-xs font-medium">
                  {errors.acceptTerms}
                </p>
              )}

            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-red-600 text-xs font-medium">{errors.submit}</p>
              </div>
            )}

              {/* Submit Button */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-2 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md text-sm ${
                    isSubmitting
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:scale-[1.02]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Crear cuenta
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Limpiar datos
                </button>
              </div>

              <p className="text-center text-[10px] text-neutral-500 mt-1">* Campos obligatorios</p>

              <p className="text-center text-xs text-neutral-700 mt-1">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
