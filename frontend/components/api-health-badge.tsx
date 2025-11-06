"use client"

import { useEffect, useState } from "react"
import { checkHealth } from "@/lib/apiClient"
import { Wifi, WifiOff } from "lucide-react"

export function ApiHealthBadge() {
  const [status, setStatus] = useState<"ok" | "degraded" | "checking">("checking")

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await checkHealth()
        setStatus(health.status === "ok" ? "ok" : "degraded")
      } catch {
        setStatus("degraded")
      }
    }

    // Check immediately
    checkApiHealth()

    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "checking" ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-neutral-600">API: Verificando...</span>
        </>
      ) : status === "ok" ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">API: ok</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600 font-medium">API: degradado</span>
        </>
      )}
    </div>
  )
}

