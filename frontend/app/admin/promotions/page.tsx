"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { promotionsService } from "@/lib/services/promotions-service"
import { Plus, Edit2, Trash2, ToggleLeft as Toggle2, X } from "lucide-react"
import { motion } from "framer-motion"
import type { Coupon } from "@/lib/types/admin"

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"coupons" | "campaigns">("coupons")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as const,
    value: 0,
    usageLimit: 0,
    validTo: "",
  })

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await promotionsService.listCoupons()
        setCoupons(data)
      } catch (error) {
        console.error("Error loading coupons:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCoupons()
  }, [])

  const handleCreate = () => {
    setEditingCoupon(null)
    setFormData({ code: "", type: "percentage", value: 0, usageLimit: 0, validTo: "" })
    setIsFormOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      usageLimit: coupon.usageLimit || 0,
      validTo: coupon.validTo,
    })
    setIsFormOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCoupon) {
        const updated = { ...editingCoupon, ...formData }
        await promotionsService.updateCoupon(editingCoupon.id, updated)
        setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? updated : c)))
      } else {
        const newCoupon: any = {
          id: `coupon-${Date.now()}`,
          ...formData,
          enabled: true,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        }
        await promotionsService.createCoupon(newCoupon)
        setCoupons([...coupons, newCoupon])
      }
      setIsFormOpen(false)
      alert(editingCoupon ? "Cupón actualizado" : "Cupón creado exitosamente")
    } catch (error) {
      console.error("Error saving coupon:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Desea eliminar este cupón?")) {
      try {
        await promotionsService.deleteCoupon(id)
        setCoupons(coupons.filter((c) => c.id !== id))
      } catch (error) {
        console.error("Error deleting coupon:", error)
      }
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await promotionsService.updateCoupon(id, { enabled: !enabled })
      setCoupons(coupons.map((c) => (c.id === id ? { ...c, enabled: !enabled } : c)))
    } catch (error) {
      console.error("Error updating coupon:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Promociones</h1>
        <button
          onClick={handleCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Promoción
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setTab("coupons")}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === "coupons" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
          }`}
        >
          Cupones
        </button>
        <button
          onClick={() => setTab("campaigns")}
          className={`px-4 py-2 font-medium transition-colors ${
            tab === "campaigns" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
          }`}
        >
          Campañas
        </button>
      </div>

      {tab === "coupons" && (
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
                    <th className="px-6 py-3 text-left text-sm font-semibold">Código</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Tipo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Valor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Usos</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Válido Hasta</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-blue-400">{coupon.code}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                          {coupon.type === "percentage" ? "%" : "Bs."}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {coupon.type === "percentage" ? `${coupon.value}%` : `Bs. ${coupon.value}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.usageCount}/{coupon.usageLimit || "∞"}
                      </td>
                      <td className="px-6 py-4 text-sm">{new Date(coupon.validTo).toLocaleDateString("es-BO")}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            coupon.enabled ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-400"
                          }`}
                        >
                          {coupon.enabled ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(coupon.id, coupon.enabled)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors"
                          >
                            <Toggle2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="ej: BIENVENIDO10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo (Bs.)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number.parseFloat(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Límite de Usos (0 = ilimitado)</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number.parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Válido Hasta</label>
                <input
                  type="date"
                  required
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                {editingCoupon ? "Actualizar Cupón" : "Crear Cupón"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
