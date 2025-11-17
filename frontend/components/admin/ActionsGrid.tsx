"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

type ActionStatus = "disponible" | "en desarrollo" | "planificado"

export type ActionItem = {
  id: string
  label: string
  description: string
  status?: ActionStatus
  icon?: ReactNode
  href?: string
  onClick?: () => void
}

type ActionsGridProps = {
  actions: ActionItem[]
  selectedAction?: string | null
  onSelect?: (id: string) => void
  title?: string
  subtitle?: string
}

const statusBadge: Record<ActionStatus, string> = {
  disponible: "border-green-500/40 bg-green-600/10 text-green-200",
  "en desarrollo": "border-yellow-500/40 bg-yellow-600/10 text-yellow-200",
  planificado: "border-gray-500/40 bg-gray-600/10 text-gray-200",
}

export function ActionsGrid({ actions, selectedAction, onSelect, title = "Acciones", subtitle }: ActionsGridProps) {
  const router = useRouter()
  if (!actions || actions.length === 0) {
    return null
  }

  const handleAction = (action: ActionItem) => {
    const isAvailable = (action.status ?? "planificado") === "disponible"
    if (!isAvailable) {
      return
    }

    action.onClick?.()

    if (action.href) {
      if (action.href.startsWith("#")) {
        const target = document.querySelector(action.href)
        if (target) {
          target.scrollIntoView({ behavior: "smooth" })
        }
      } else {
        router.push(action.href)
      }
    }

    onSelect?.(action.id)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{subtitle ?? "Panel general"}</p>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const badgeClass = statusBadge[action.status ?? "planificado"]
          const isSelected = selectedAction === action.id
          const isDisabled = (action.status ?? "planificado") !== "disponible"
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              disabled={isDisabled}
              className={`group h-full min-h-[150px] rounded-xl border px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-orange-500 bg-orange-600 text-white shadow-lg"
                  : "border-gray-700 bg-gray-800 text-gray-100 hover:border-orange-500 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              }`}
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-4">
                  {action.icon && (
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-lg border ${
                        isSelected ? "border-white/30 bg-white/10 text-white" : "border-gray-600 bg-gray-900 text-orange-300 group-hover:text-orange-200"
                      }`}
                    >
                      {action.icon}
                    </span>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold leading-tight">
                        {action.label}
                      </span>
                      <span className={`text-[11px] uppercase tracking-wide rounded-full px-2 py-1 border ${badgeClass}`}>
                        {action.status === "disponible"
                          ? "Disponible"
                          : action.status === "en desarrollo"
                            ? "En desarrollo"
                            : "Planificado"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300">{action.description}</p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}


