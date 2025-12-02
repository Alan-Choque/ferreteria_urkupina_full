"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

const PURPLE_COLORS = {
  primary: "#8B5CF6",
  secondary: "#A78BFA",
  light: "#C4B5FD",
  dark: "#6D28D9",
  accent: "#EDE9FE",
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  change?: {
    value: number
    label?: string
  }
  color?: "primary" | "success" | "warning" | "danger" | "info"
  delay?: number
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  color = "primary",
  delay = 0,
}: KPICardProps) {
  const colorConfig = {
    primary: {
      iconBg: PURPLE_COLORS.accent,
      iconColor: PURPLE_COLORS.primary,
      changeColor: "#6B7280",
    },
    success: {
      iconBg: "#ECFDF5",
      iconColor: "#10B981",
      changeColor: "#10B981",
    },
    warning: {
      iconBg: "#FFFBEB",
      iconColor: "#F59E0B",
      changeColor: "#F59E0B",
    },
    danger: {
      iconBg: "#FEE2E2",
      iconColor: "#EF4444",
      changeColor: "#EF4444",
    },
    info: {
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      changeColor: "#3B82F6",
    },
  }

  const config = colorConfig[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl p-5 shadow-sm bg-white border"
      style={{ borderColor: PURPLE_COLORS.accent }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: PURPLE_COLORS.secondary }}>
          {title}
        </p>
        <div className="p-2 rounded-lg" style={{ backgroundColor: config.iconBg }}>
          <Icon size={18} style={{ color: config.iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: PURPLE_COLORS.dark }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs" style={{ color: "#6B7280" }}>
          {subtitle}
        </p>
      )}
      {change && (
        <p className={`text-xs mt-1 ${change.value >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change.value >= 0 ? "↑" : "↓"} {Math.abs(change.value).toFixed(1)}%
          {change.label && ` ${change.label}`}
        </p>
      )}
    </motion.div>
  )
}

