"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Lock } from "lucide-react"
import { authService } from "@/lib/services/auth-service"
import Image from "next/image"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({})

  useEffect(() => {
    if (!token) {
      router.push("/forgot-password")
    }
  }, [token, router])

  const validatePassword = (value: string) => {
    if (!value) return "La contraseña es obligatoria"
    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    return ""
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) return "Debes confirmar tu contraseña"
    if (value !== password) return "Las contraseñas no coinciden"
    return ""
  }

  const passwordError = touched.password ? validatePassword(password) : ""
  const confirmPasswordError = touched.confirmPassword ? validateConfirmPassword(confirmPassword) : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    setErrors({})

    const pwdError = validatePassword(password)
    const confirmError = validateConfirmPassword(confirmPassword)

    if (pwdError || confirmError) {
      setErrors({
        password: pwdError,
        confirmPassword: confirmError,
      })
      return
    }

    if (!token) {
      setErrors({ submit: "Token inválido. Por favor, solicita un nuevo enlace de recuperación." })
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setErrors({
        submit: err.message || "Error al restablecer la contraseña. El token puede haber expirado.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <Link href="/">
            <Image
              src="/logo-ferretek.png"
              alt="Ferretería Urkupina"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-lg p-8">
          {!success ? (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
                  <Lock className="w-7 h-7 text-orange-600" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900 mb-1.5">
                  Restablecer contraseña
                </h1>
                <p className="text-sm text-neutral-600">
                  Crea una nueva contraseña para tu cuenta. Asegúrate de que tenga al menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                    Nueva contraseña <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setTouched({ ...touched, password: true })
                        setErrors((prev) => ({ ...prev, password: "" }))
                      }}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-12 ${
                        passwordError ? "border-red-600 bg-red-50" : "border-neutral-300"
                      }`}
                      placeholder="Mínimo 8 caracteres"
                      disabled={loading}
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
                  {passwordError && (
                    <p id="password-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-900 mb-2">
                    Confirmar contraseña <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setTouched({ ...touched, confirmPassword: true })
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                      }}
                      onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                      aria-invalid={!!confirmPasswordError}
                      aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                      className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors pr-12 ${
                        confirmPasswordError ? "border-red-600 bg-red-50" : "border-neutral-300"
                      }`}
                      placeholder="Repite tu contraseña"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 transition-colors"
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p id="confirm-password-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !!passwordError || !!confirmPasswordError}
                  className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Restableciendo...
                    </>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                ¡Contraseña restablecida!
              </h1>
              <p className="text-sm text-neutral-600 mb-6">
                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
