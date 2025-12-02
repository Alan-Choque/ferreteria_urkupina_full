"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DocumentsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página de perfil donde ahora están los documentos
    router.replace("/account/profile")
  }, [router])

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-neutral-600">Redirigiendo...</p>
    </div>
  )
}
