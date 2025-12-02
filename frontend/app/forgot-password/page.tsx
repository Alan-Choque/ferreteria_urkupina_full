"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { authService } from "@/lib/services/auth-service"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [touched, setTouched] = useState(false)

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return "El correo electrónico es obligatorio"
    if (!emailRegex.test(value)) return "El correo no es válido"
    return ""
  }

  const emailError = touched ? validateEmail(email) : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setError("")

    const validationError = validateEmail(email)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await authService.requestPasswordReset(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo. Por favor, intenta más tarde.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center -m-20 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <Link href="/">
            <Image
              src="/logo-cyber-serpents.png"
              alt="Ferretería Urkupina"
              width={100}
              height={100}
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
                  <Mail className="w-7 h-7 text-orange-600" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900 mb-1.5">
                  Recuperar contraseña
                </h1>
                <p className="text-sm text-neutral-600">
                  Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                    Correo electrónico <span className="text-orange-600">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setTouched(true)
                      setError("")
                    }}
                    onBlur={() => setTouched(true)}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-colors ${
                      emailError ? "border-red-600 bg-red-50" : "border-neutral-300"
                    }`}
                    placeholder="ejemplo@correo.com"
                    disabled={loading}
                  />
                  {emailError && (
                    <p id="email-error" className="text-red-600 text-sm mt-1.5 font-medium">
                      {emailError}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !!emailError}
                  className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar instrucciones"
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
                Correo enviado
              </h1>
              <p className="text-sm text-neutral-600 mb-6">
                Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un correo con instrucciones para restablecer tu contraseña.
              </p>
              <p className="text-xs text-neutral-500 mb-6">
                Si no recibes el correo en unos minutos, revisa tu carpeta de spam o intenta nuevamente.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                    setTouched(false)
                    setError("")
                  }}
                  className="w-full py-2.5 text-orange-600 font-medium hover:text-orange-700 transition-colors"
                >
                  Enviar a otro correo
                </button>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
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
