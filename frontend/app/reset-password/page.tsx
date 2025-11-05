"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/header"

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")

  const handleRequestReset = () => {
    if (!email.includes("@")) {
      setErrors({ email: "Email inválido" })
      return
    }
    setMessage("Si el email existe, recibirás instrucciones para restablecer tu contraseña.")
    setTimeout(() => {
      setStep("reset")
      setMessage("")
    }, 3000)
  }

  const handleResetPassword = () => {
    const newErrors: Record<string, string> = {}
    if (password.length < 8) newErrors.password = "Mínimo 8 caracteres"
    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden"
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage("✓ Contraseña actualizada exitosamente. Serás redirigido al login...")
      setTimeout(() => (window.location.href = "/login"), 2000)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">Restablecer Contraseña</h1>
          <p className="text-neutral-600 text-center mb-8">
            {step === "request"
              ? "Ingresa tu email para recibir instrucciones"
              : "Crea una nueva contraseña para tu cuenta"}
          </p>

          {message && (
            <div
              className={`p-4 rounded-lg mb-6 text-sm font-bold ${
                message.includes("✓")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {message}
            </div>
          )}

          {step === "request" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.email ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <button
                onClick={handleRequestReset}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Enviar Instrucciones
              </button>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Nueva Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.password ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    errors.confirmPassword ? "border-red-600" : "border-neutral-300"
                  }`}
                  placeholder="Repite tu contraseña"
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                onClick={handleResetPassword}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Restablecer Contraseña
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-red-600 font-bold hover:underline">
              Volver al Login
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
