"use client"

import { useState, useEffect } from "react"
import { inventoryService } from "@/lib/services/inventory-service"
import type { Stock, StockMovement, ProductVariant } from "@/lib/contracts"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

export default function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "movements" | "transfers">("stock")
  const [stocks, setStocks] = useState<Stock[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stocksData, movementsData] = await Promise.all([
          inventoryService.listStocks(),
          inventoryService.listMovements(),
        ])
        setStocks(stocksData)
        setMovements(movementsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const tabs = [
    { id: "stock", label: "Stock por Variante" },
    { id: "movements", label: "Movimientos" },
    { id: "transfers", label: "Transferencias" },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Nuevo Movimiento
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              tab === t.id ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : tab === "stock" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Variante ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Almacén</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cantidad</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mín.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Máx.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stocks.map((stock) => {
                  const isLow = stock.qty <= (stock.minQty || 0)
                  const isHigh = stock.qty >= (stock.maxQty || 999)
                  return (
                    <tr key={stock.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono">{stock.variantId}</td>
                      <td className="px-6 py-4 text-sm">{stock.warehouseId}</td>
                      <td className="px-6 py-4 text-sm font-bold">{stock.qty}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{stock.minQty || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{stock.maxQty || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            isLow
                              ? "bg-red-600/20 text-red-400"
                              : isHigh
                                ? "bg-yellow-600/20 text-yellow-400"
                                : "bg-green-600/20 text-green-400"
                          }`}
                        >
                          {isLow ? "BAJO" : isHigh ? "ALTO" : "OK"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : tab === "movements" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Variante</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cantidad</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Razón</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono">{movement.variantId}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          movement.type === "ENTRADA"
                            ? "bg-green-600/20 text-green-400"
                            : movement.type === "SALIDA"
                              ? "bg-red-600/20 text-red-400"
                              : "bg-blue-600/20 text-blue-400"
                        }`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{movement.qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{movement.reason || "-"}</td>
                    <td className="px-6 py-4 text-sm">{new Date(movement.createdAt).toLocaleDateString("es-BO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-gray-400">
            <p>Asistente de transferencias entre almacenes - En construcción</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
