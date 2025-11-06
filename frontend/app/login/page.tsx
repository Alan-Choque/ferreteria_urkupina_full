"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/services/auth-service"
import { useFormSubmit } from "@/hooks/use-form-submit"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({})
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return "El correo electrónico es obligatorio"
    if (!emailRegex.test(value)) return "El correo no es válido"
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria"
    if (value.length < 1) return "La contraseña debe tener al menos 1 carácter"
    return ""
  }

  const handleBlur = (field: "email" | "password") => {
    setTouched({ ...touched, [field]: true })
    if (field === "email") {
      const error = validateEmail(email)
      setErrors({ ...errors, email: error })
    } else if (field === "password") {
      const error = validatePassword(password)
      setErrors({ ...errors, password: error })
    }
  }

  const handleChange = (field: "email" | "password", value: string) => {
    if (field === "email") {
      setEmail(value)
      if (touched.email) {
        const error = validateEmail(value)
        setErrors({ ...errors, email: error })
      }
    } else if (field === "password") {
      setPassword(value)
      if (touched.password) {
        const error = validatePassword(value)
        setErrors({ ...errors, password: error })
      }
    }
  }

  const { submit, isSubmitting } = useFormSubmit(
    async (data: { email: string; password: string }) => {
      const user = await authService.login(data.email, data.password)
      return user
    },
    {
      debounceMs: 300,
      onSuccess: (user) => {
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

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      setTouched({ email: true, password: true })
      return
    }

    await submit({ email, password })
  }

  const isFormValid = !errors.email && !errors.password && email && password && !isSubmitting

  return (
    <main className="min-h-screen bg-neutral-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-neutral-900 mb-12 text-center">Inicio de sesión</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white border border-neutral-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Clientes registrados</h2>
            <p className="text-neutral-700 mb-6">
              Si ya tienes una cuenta, inicia sesión con tu correo electrónico y contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                  Correo electrónico <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
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

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                  Contraseña <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    aria-invalid={touched.password && !!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors pr-12 ${
                      touched.password && errors.password ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="Ingresa tu contraseña"
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
                {touched.password && errors.password && (
                  <p id="password-error" className="text-red-600 text-sm mt-1.5 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                    aria-label="Recuérdame"
                  />
                  <span className="text-sm text-neutral-700">Recuérdame</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium">
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-2.5 font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
                  isFormValid && !isSubmitting
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              <p className="text-center text-xs text-neutral-600">* Campos obligatorios</p>
            </form>
          </div>

          {/* Register CTA */}
          <div className="bg-neutral-900 text-white rounded-lg p-8 flex flex-col items-center justify-center min-h-64 md:min-h-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Clientes nuevos</h2>
            <p className="text-neutral-300 text-center mb-8">
              Para disfrutar de todos los beneficios que ofrece Ferretería Urkupina, crea una cuenta.
            </p>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-white text-neutral-900 font-bold rounded hover:bg-neutral-100 transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
