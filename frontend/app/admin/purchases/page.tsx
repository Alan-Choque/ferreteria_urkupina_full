"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { purchasesService } from "@/lib/services/purchases-service"
import { Plus, Eye, X } from "lucide-react"
import { motion } from "framer-motion"
import type { PurchaseOrder } from "@/lib/types/admin"

export default function PurchasesPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [formData, setFormData] = useState({ supplierId: "", expectedDate: "", totalAmount: 0 })

  useEffect(() => {
    const loadPos = async () => {
      try {
        const data = await purchasesService.listPOs()
        setPos(data)
      } catch (error) {
        console.error("Error loading POs:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPos()
  }, [])

  const handleCreate = () => {
    setFormData({ supplierId: "", expectedDate: "", totalAmount: 0 })
    setIsFormOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newPO: any = {
        id: `po-${Date.now()}`,
        poNumber: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        supplierId: formData.supplierId,
        expectedDate: formData.expectedDate,
        totalAmount: formData.totalAmount,
        status: "draft",
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await purchasesService.createPO(newPO)
      setPos([...pos, newPO])
      setIsFormOpen(false)
      alert("Orden de compra creada exitosamente")
    } catch (error) {
      console.error("Error creating PO:", error)
      alert("Error al crear la orden de compra")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-600/20 text-gray-400",
      sent: "bg-blue-600/20 text-blue-400",
      received: "bg-green-600/20 text-green-400",
      partial: "bg-yellow-600/20 text-yellow-400",
      canceled: "bg-red-600/20 text-red-400",
    }
    return colors[status] || "bg-gray-600/20 text-gray-400"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
        <button
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva OC
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">OC #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Proveedor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Fecha Esperada</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono">{po.poNumber}</td>
                    <td className="px-6 py-4 text-sm">Proveedor {po.supplierId}</td>
                    <td className="px-6 py-4 text-sm">{new Date(po.expectedDate).toLocaleDateString("es-BO")}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(po.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nueva Orden de Compra</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Proveedor ID</label>
                <input
                  type="text"
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha Esperada</label>
                <input
                  type="date"
                  required
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Monto Total</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number.parseFloat(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Crear OC
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {selectedPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detalles de OC</h2>
              <button onClick={() => setSelectedPO(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-400">OC #:</span> {selectedPO.poNumber}
              </div>
              <div>
                <span className="font-medium text-gray-400">Proveedor:</span> {selectedPO.supplierId}
              </div>
              <div>
                <span className="font-medium text-gray-400">Fecha Esperada:</span>{" "}
                {new Date(selectedPO.expectedDate).toLocaleDateString("es-BO")}
              </div>
              <div>
                <span className="font-medium text-gray-400">Total:</span> {formatCurrency(selectedPO.totalAmount)}
              </div>
              <div>
                <span className="font-medium text-gray-400">Estado:</span>{" "}
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPO.status)}`}>
                  {selectedPO.status}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
