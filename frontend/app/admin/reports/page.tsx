"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Download,
  Globe2,
  LineChart,
  Printer,
  Loader2,
} from "lucide-react"

import { ActionsGrid, type ActionItem } from "@/components/admin/ActionsGrid"
import { reportsService, type ReportsSummary } from "@/lib/services/reports-service"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-BO").format(value)
}

const LOW_STOCK_THRESHOLD = 5

function getDefaultRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  }
}

function buildDashboardCards(data: ReportsSummary | null) {
  const sales = data?.summary.sales_last_30_days ?? 0
  const pending = data?.summary.pending_orders ?? 0
  const lowStock = data?.summary.low_stock_products ?? 0
  const customers = data?.summary.active_customers_last_30_days ?? 0

  return [
    {
      title: "Ventas mensuales",
      subtitle: "Últimos 30 días",
      value: formatCurrency(sales),
      accent: "bg-green-600",
      icon: LineChart,
    },
    {
      title: "Órdenes pendientes",
      subtitle: "Por completar",
      value: `${formatNumber(pending)} órdenes`,
      accent: "bg-yellow-600",
      icon: ClipboardList,
    },
    {
      title: "Productos con stock bajo",
      subtitle: `Umbral < ${LOW_STOCK_THRESHOLD} unidades`,
      value: `${formatNumber(lowStock)} ítems`,
      accent: "bg-orange-600",
      icon: Activity,
    },
    {
      title: "Clientes activos",
      subtitle: "Últimos 30 días",
      value: `${formatNumber(customers)} cuentas`,
      accent: "bg-blue-600",
      icon: Globe2,
    },
  ]
}

export default function ReportsPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [summary, setSummary] = useState<ReportsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvGenerating, setCsvGenerating] = useState(false)

  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => getDefaultRange())
  const [customData, setCustomData] = useState<ReportsSummary | null>(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)
  const [customCsvGenerating, setCustomCsvGenerating] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportsService.getSummary()
      setSummary(data)
    } catch (err) {
      console.error("Error al cargar reportes", err)
      setError(err instanceof Error ? err.message : "No se pudieron cargar los reportes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const actions: ActionItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Dashboard general",
        description: "Indicadores clave de ventas, stock y clientes.",
        status: "disponible",
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        id: "export-csv",
        label: "Exportar CSV",
        description: "Descarga los KPIs actuales en formato plano.",
        status: "disponible",
        icon: <Download className="h-5 w-5" />,
      },
      {
        id: "export-pdf",
        label: "Imprimir/Exportar PDF",
        description: "Genera un informe imprimible del tablero.",
        status: "disponible",
        icon: <Printer className="h-5 w-5" />,
      },
      {
        id: "custom",
        label: "Reportes personalizados",
        description: "Genera métricas para un rango de fechas específico.",
        status: "disponible",
        icon: <ClipboardList className="h-5 w-5" />,
      },
    ],
    [],
  )

  const dashboardCards = useMemo(() => buildDashboardCards(summary), [summary])

  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)
    if (!summary && actionId !== "custom") {
      void loadSummary()
    }

    if (actionId === "custom") {
      setCustomRange(getDefaultRange())
      setCustomData(null)
      setCustomError(null)
    }
  }

  const handleExportCSV = async () => {
    setCsvGenerating(true)
    try {
      const data = summary ?? (await reportsService.getSummary())
      if (!summary) {
        setSummary(data)
      }
      const cards = buildDashboardCards(data)
      const rows: string[][] = [
        ["Reporte Ferretería Urkupina", new Date().toLocaleDateString("es-BO")],
        [],
        ["Métrica", "Valor"],
        ...cards.map((card) => [card.title, card.value]),
      ]
      const csvContent = rows.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reportes-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error exportando CSV", err)
      setError(err instanceof Error ? err.message : "No se pudo exportar el CSV")
    } finally {
      setCsvGenerating(false)
    }
  }

  const handleCustomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customRange.start || !customRange.end) {
      setCustomError("Selecciona una fecha inicial y final para generar el reporte.")
      return
    }
    if (new Date(customRange.start) > new Date(customRange.end)) {
      setCustomError("La fecha inicial no puede ser posterior a la fecha final.")
      return
    }

    setCustomLoading(true)
    setCustomError(null)
    try {
      const data = await reportsService.getSummary({
        startDate: customRange.start,
        endDate: customRange.end,
      })
      setCustomData(data)
    } catch (err) {
      console.error("Error al generar el reporte personalizado", err)
      setCustomError(err instanceof Error ? err.message : "No se pudo generar el reporte personalizado")
    } finally {
      setCustomLoading(false)
    }
  }

  const handleCustomExport = async () => {
    if (!customData) {
      return
    }
    setCustomCsvGenerating(true)
    try {
      const cards = buildDashboardCards(customData)
      const rows: string[][] = [
        [
          "Reporte personalizado Ferretería Urkupina",
          `${customRange.start} - ${customRange.end}`,
        ],
        [],
        ["Métrica", "Valor"],
        ...cards.map((card) => [card.title, card.value]),
      ]
      const csvContent = rows.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-personalizado-${customRange.start}-a-${customRange.end}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setCustomCsvGenerating(false)
    }
  }

  const renderDashboard = () => {
    if (loading && !summary) {
      return (
        <motion.div
          key="reports-dashboard-loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center text-gray-300"
        >
          Cargando indicadores...
        </motion.div>
      )
    }

    if (error && !summary) {
      return (
        <motion.div
          key="reports-dashboard-error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-700 bg-red-900/30 p-6 text-center text-red-200"
        >
          {error}
        </motion.div>
      )
    }

    return (
      <motion.div
        key="reports-dashboard"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-gray-100"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-gray-700 bg-gray-800 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-400">{card.subtitle}</p>
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                  <div className={`${card.accent} rounded-md p-3 text-white`}>
                    <Icon size={20} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white">Ventas por categoría</h4>
            {summary?.category_breakdown.length ? (
              summary.category_breakdown.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{category.category}</span>
                    <span className="font-semibold text-white">{category.percentage}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No hay ventas registradas en el periodo.</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h4 className="text-lg font-semibold text-white">Top 5 productos</h4>
            {summary?.top_products.length ? (
              summary.top_products.map((product, index) => (
                <div key={product.product} className="flex items-center justify-between text-sm text-gray-300">
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="flex-1 px-3 text-gray-200">{product.product}</span>
                  <span className="font-semibold text-green-300">{formatCurrency(product.total)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Aún no hay productos destacados para mostrar.</p>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const renderExportCsv = () => (
    <motion.div
      key="reports-export-csv"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Exportar indicadores a CSV</h3>
      <p className="text-sm text-gray-300">
        Descarga un archivo CSV con las métricas actuales del tablero para procesarlas en Excel o herramientas BI.
      </p>
      <button
        onClick={() => void handleExportCSV()}
        disabled={!summary && loading || csvGenerating}
        className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {csvGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />} Exportar CSV
      </button>
      {!summary && !loading && (
        <p className="text-xs text-yellow-300">Carga el dashboard para habilitar la exportación.</p>
      )}
      <p className="text-xs text-gray-500">
        El archivo incluye valores agregados de ventas, stock y clientes. Puedes combinarlo con reportes personalizados en el futuro.
      </p>
    </motion.div>
  )

  const renderExportPdf = () => (
    <motion.div
      key="reports-export-pdf"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
    >
      <h3 className="text-lg font-semibold text-white">Imprimir o exportar PDF</h3>
      <p className="text-sm text-gray-300">
        Usa la funcionalidad de impresión del navegador para generar un PDF con el estado actual del dashboard. Activa la opción "Fondos" para conservar el esquema de colores.
      </p>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
      >
        <Printer size={16} /> Imprimir tablero
      </button>
    </motion.div>
  )

  const renderCustomInfo = () => {
    const customCards = buildDashboardCards(customData)

    return (
      <motion.div
        key="reports-custom"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-100"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-gray-200">Fecha inicial *</span>
              <input
                type="date"
                value={customRange.start}
                onChange={(event) =>
                  setCustomRange((prev) => ({ ...prev, start: event.target.value }))
                }
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-gray-200">Fecha final *</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(event) =>
                  setCustomRange((prev) => ({ ...prev, end: event.target.value }))
                }
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-gray-100 focus:border-orange-500 focus:outline-none"
              />
            </label>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => setCustomRange(getDefaultRange())}
                className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
              >
                Restablecer rango
              </button>
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              disabled={customLoading}
            >
              {customLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 size={16} />} Generar reporte
            </button>
            {customData && (
              <button
                type="button"
                onClick={() => void handleCustomExport()}
                disabled={customCsvGenerating}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {customCsvGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />} Exportar CSV
              </button>
            )}
          </form>

          {customError && (
            <div className="rounded-md border border-red-600 bg-red-600/15 px-4 py-3 text-sm text-red-200">
              {customError}
            </div>
          )}
        </div>

        {customLoading ? (
          <div className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-5 text-center text-gray-300">
            Generando reporte...
          </div>
        ) : customData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {customCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.title} className="rounded-lg border border-gray-700 bg-gray-900 p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{card.subtitle}</p>
                        <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                      </div>
                      <div className={`${card.accent} rounded-md p-3 text-white`}>
                        <Icon size={20} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900 p-6">
                <h4 className="text-lg font-semibold text-white">Ventas por categoría</h4>
                {customData.category_breakdown.length ? (
                  customData.category_breakdown.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between text-sm text-gray-300">
                        <span>{category.category}</span>
                        <span className="font-semibold text-white">{category.percentage}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Sin ventas registradas en este rango.</p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900 p-6">
                <h4 className="text-lg font-semibold text-white">Top 5 productos</h4>
                {customData.top_products.length ? (
                  customData.top_products.map((product, index) => (
                    <div key={product.product} className="flex items-center justify-between text-sm text-gray-300">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="flex-1 px-3 text-gray-200">{product.product}</span>
                      <span className="font-semibold text-green-300">{formatCurrency(product.total)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No hay productos destacados en el rango seleccionado.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 px-4 py-5 text-sm text-gray-300">
            Ingresa un rango de fechas y presiona "Generar reporte" para visualizar métricas personalizadas.
          </div>
        )}
      </motion.div>
    )
  }

  const renderEmptyState = () => (
    <motion.div
      key="reports-empty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-dashed border-gray-600 bg-gray-900/70 p-6 text-gray-300"
    >
      Selecciona una acción del menú para explorar los reportes.
    </motion.div>
  )

  const renderActionContent = () => {
    switch (selectedAction) {
      case "dashboard":
        return renderDashboard()
      case "export-csv":
        return renderExportCsv()
      case "export-pdf":
        return renderExportPdf()
      case "custom":
        return renderCustomInfo()
      default:
        return renderEmptyState()
    }
  }

  const currentAction = actions.find((action) => action.id === selectedAction)

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Reportes</h1>
        </div>
      </div>

      {error && !selectedAction && (
        <div className="rounded-md border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {selectedAction === null ? (
        <div className="space-y-4">
          <ActionsGrid
            title="Operaciones de reportes"
            subtitle="Panel general"
            actions={actions}
            selectedAction={selectedAction}
            onSelect={handleActionSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-100 hover:border-orange-500 hover:bg-gray-800"
              >
                <ArrowLeft size={16} /> Volver al menú de acciones
              </button>
              <div>
                <h2 className="text-xl font-semibold">{currentAction?.label ?? "Acción"}</h2>
                {currentAction?.description && (
                  <p className="max-w-xl text-xs text-gray-400">{currentAction.description}</p>
                )}
              </div>
            </div>
          </div>

          {error && selectedAction !== "custom" && summary === null && (
            <div className="rounded-md border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">{renderActionContent()}</AnimatePresence>
        </div>
      )}
    </div>
  )
}
