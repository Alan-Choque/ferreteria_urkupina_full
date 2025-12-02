"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { authService } from "@/lib/services/auth-service"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({})
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setErrors((prev) => ({ ...prev, email: error }))
    } else {
      const error = validatePassword(password)
      setErrors((prev) => ({ ...prev, password: error }))
    }
  }

  const handleChange = (field: "email" | "password", value: string) => {
    if (field === "email") {
      setEmail(value)
      if (touched.email) {
        const error = validateEmail(value)
        setErrors((prev) => ({ ...prev, email: error }))
      }
    } else {
      setPassword(value)
      if (touched.password) {
        const error = validatePassword(value)
        setErrors((prev) => ({ ...prev, password: error }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      setTouched({ email: true, password: true })
      setIsSubmitting(false)
      return
    }

    try {
      const user = await authService.login(email, password)
      
      // Disparar evento para actualizar el header inmediatamente
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:login"))
      }
      
      // Verificar si es admin - múltiples formas de verificación
      const rolesArray = user.roles || []
      const roleLower = user.role?.toLowerCase() || ""
      const isAdmin = 
        roleLower === "admin" || 
        rolesArray.some((role) => {
          const roleUpper = (role || "").toUpperCase()
          const roleLower = (role || "").toLowerCase()
          return roleUpper === "ADMIN" || 
                 roleUpper.includes("ADMIN") || 
                 roleLower.includes("admin") ||
                 roleLower === "administrador"
        })
      
      // Redirigir según el rol
      if (isAdmin) {
        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          window.location.href = "/admin"
        }, 100)
      } else {
        router.push("/")
      }
    } catch (error: any) {
      console.error("Error en login:", error)
      setErrors({ 
        submit: error.message || "Error al iniciar sesión. Por favor, intenta nuevamente." 
      })
      setIsSubmitting(false)
    }
  }

  const isFormValid = !errors.email && !errors.password && email && password && !isSubmitting

  const handleClear = () => {
    setEmail("")
    setPassword("")
    setRememberMe(false)
    setErrors({})
    setTouched({})
  }

  return (
    <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 min-h-screen -mb-40 mt-5">
        <main className="w-full">
          <div className="max-w-[900px] mx-auto w-full px-4 pt-4 pb-6 md:pt-4 md:pb-6 lg:pt-4 lg:pb-6 flex flex-col gap-2.5">
            <div className="text-center space-y-0.5 mb-1">
              <h1 className="text-lg font-bold text-neutral-900">Bienvenido nuevamente</h1>
              <p className="text-xs text-neutral-600">
                Ingresa para revisar pedidos, descargar comprobantes y activar beneficios empresariales.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-lg flex flex-col">
                {/* Logo y nombre del sistema */}
                <div className="flex items-center justify-center gap-3 mb-2 pb-2 border-b border-neutral-200">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <Image
                      src="/logo-cyber-serpents.png"
                      alt="Cyber Serpents Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold leading-tight text-neutral-900">
                      SIGEF
                    </h2>
                    <p className="text-xs leading-tight text-neutral-600">
                      Sistema de Gestión de Ferreterías - Cyber Serpents
                    </p>
                  </div>
                </div>

                {/* Título del formulario */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-neutral-900 mb-0.5">Ingresa tus credenciales</h3>
                  <p className="text-xs text-neutral-600">Completa los siguientes campos para acceder a tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                      Correo electrónico <span className="text-orange-600">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      aria-invalid={touched.email && !!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
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

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                      Contraseña <span className="text-orange-600">*</span>
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
                        className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-12 ${
                          touched.password && errors.password ? "border-red-600 bg-red-50" : "border-neutral-300"
                        }`}
                        placeholder="Ingresa tu contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
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

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 accent-orange-600 cursor-pointer"
                        aria-label="Recuérdame"
                      />
                      <span>Recuérdame</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-orange-600 hover:text-orange-700 font-semibold tracking-tight"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
                    </div>
                  )}

                  <div className="pt-1.5 mt-auto">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        Limpiar datos
                      </button>
                      <button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className={`py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm ${
                          isFormValid && !isSubmitting
                            ? "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:scale-[1.02]"
                            : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Iniciando...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            Iniciar sesión
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-center text-xs text-neutral-500">* Campos obligatorios</p>
                  </div>
                </form>
              </div>

              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-2xl p-4.5 md:p-5 shadow-2xl flex flex-col gap-2.5">
                <div className="text-center space-y-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5em] text-orange-400">
                    NUEVO CLIENTE
                  </span>
                  <h2 className="text-lg font-semibold">Beneficios inmediatos</h2>
                  <p className="text-neutral-200 text-[12.5px] leading-relaxed">
                    Regístrate para recibir seguimiento personalizado, asesoría y recompensas para tu empresa.
                  </p>
                </div>

                <ul className="space-y-5 text-[11.5px] text-neutral-100 py-3">
                  {[
                    "Seguimiento de pedidos en tiempo real.",
                    "Alertas de stock y descuentos especiales.",
                    "Historial y comprobantes descargables.",
                    "Soporte dedicado para empresas.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-inner"
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-1.5 mt-auto">
                  <Link
                    href="/register"
                    className="w-full px-4 py-3 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-center shadow-md block text-base"
                  >
                    Crear mi cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  )
}

