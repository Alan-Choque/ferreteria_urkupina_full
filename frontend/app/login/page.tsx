"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import { authService } from "@/lib/services/auth-service"
import { useFormSubmit } from "@/hooks/use-form-submit"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"
import FooterFerretek from "@/components/footer-ferretek"

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

  const { submit, isSubmitting } = useFormSubmit(
    async (data: { email: string; password: string }) => {
      const user = await authService.login(data.email, data.password)
      return user
    },
    {
      debounceMs: 300,
      onSuccess: (user) => {
        if (user.roles?.some((role) => role.toUpperCase().includes("ADMIN"))) {
          router.push("/admin")
          return
        }
        router.push("/")
      },
      onError: (error) => {
        setErrors({ submit: error.message })
      },
    },
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

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
    <>
      <Header />
      <MegaMenu />
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex flex-col">
        <main className="flex-1 w-full">
          <div className="max-w-[900px] mx-auto w-full px-4 py-2.5 md:py-3 lg:py-3.5 flex flex-col gap-2.5">
            <div className="text-center space-y-1">
              <p className="text-[11px] uppercase tracking-[0.35em] text-orange-500 font-semibold">Cuenta segura</p>
              <h1 className="text-[22px] font-bold text-neutral-900">Bienvenido nuevamente</h1>
              <p className="text-[12.5px] text-neutral-600">
                Ingresa para revisar pedidos, descargar comprobantes y activar beneficios empresariales.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-lg flex flex-col min-h-[360px]">
                <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 shadow-sm mb-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow">
                    <img
                      src="/logo-urkupina.png"
                      alt="Logo Ferretería Urkupina"
                      className="h-7 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-orange-500">Ingreso seguro</p>
                    <p className="text-sm font-semibold text-neutral-900">Ferretería Urkupina</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">
                  <div>
                    <label htmlFor="email" className="block text-[13px] font-medium text-neutral-900 mb-1">
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
                      className={`w-full px-3.75 py-2.65 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
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
                    <label htmlFor="password" className="block text-[13px] font-medium text-neutral-900 mb-1">
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
                        className={`w-full px-3.75 py-2.65 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-12 ${
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

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[14px] text-neutral-700">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4.5 h-4.5 accent-orange-600 cursor-pointer"
                        aria-label="Recuérdame"
                      />
                      <span>Recuérdame</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[14px] text-orange-600 hover:text-orange-700 font-semibold tracking-tight"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm font-medium">{errors.submit}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-700">
                    {["Ticket directo a soporte", "Recordatorios automáticos de facturación"].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.25 py-1.9 shadow-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1.5 mt-auto">
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg text-base ${
                        isFormValid && !isSubmitting
                          ? "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:scale-[1.02]"
                          : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          Iniciar sesión
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-neutral-500 mt-1.5">* Campos obligatorios</p>
                  </div>
                </form>
              </div>

              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white rounded-2xl p-4.5 md:p-5 shadow-2xl flex flex-col gap-2.5 min-h-[360px]">
                <div className="text-center space-y-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5em] text-orange-400">
                    NUEVO CLIENTE
                  </span>
                  <h2 className="text-lg font-semibold">Beneficios inmediatos</h2>
                  <p className="text-neutral-200 text-[12.5px] leading-relaxed">
                    Regístrate para recibir seguimiento personalizado, asesoría y recompensas para tu empresa.
                  </p>
                </div>

                <ul className="space-y-2 text-[11.5px] text-neutral-100">
                  {[
                    "Seguimiento de pedidos en tiempo real.",
                    "Alertas de stock y descuentos especiales.",
                    "Historial y comprobantes descargables.",
                    "Soporte dedicado para empresas.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 shadow-inner"
                    >
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1" />
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
        <FooterFerretek />
      </div>
    </>
  )
}

