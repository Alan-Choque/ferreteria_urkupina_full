"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import jsPDF from "jspdf"
import { salesService } from "@/lib/services/sales-service"
import { Loader2 } from "lucide-react"
import type { SalesOrder } from "@/lib/contracts"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const orderData = await salesService.getOrder(id)
        setOrder(orderData)
      } catch (err: any) {
        console.error("Error loading order:", err)
        setError(err instanceof Error ? err.message : "Error al cargar el pedido")
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12 p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 mb-4">{error || "Pedido no encontrado"}</p>
            <Link href="/account/orders" className="text-red-600 font-bold hover:underline">
              ← Volver a Pedidos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Asegurar que totals siempre esté definido con valores por defecto
  const totals = order.totals || {
    sub: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    currency: "BOB" as const,
  }

  const downloadPDF = () => {
    if (!order) return
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPos = margin

    // Encabezado
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("FERRETERÍA URKUPINA", pageWidth / 2, yPos, { align: "center" })
    yPos += 10

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Av. San Joaquín esquina Calle \"A\"", pageWidth / 2, yPos, { align: "center" })
    yPos += 5
    doc.text("Lado del Colegio Miguel Antelo, Guayaramerin, Bolivia", pageWidth / 2, yPos, { align: "center" })
    yPos += 5
    doc.text("Tel: +591 68464378 | Email: info@urkupina.com", pageWidth / 2, yPos, { align: "center" })
    yPos += 15

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    // Título del recibo
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("RECIBO DE PEDIDO", pageWidth / 2, yPos, { align: "center" })
    yPos += 10

    // Información del pedido
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Número de Pedido: ${order.id}`, margin, yPos)
    yPos += 6
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString("es-BO", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}`, margin, yPos)
    yPos += 6
    
    const statusLabels: Record<string, string> = {
      PENDIENTE: "Pendiente",
      PAGADO: "Pagado",
      ENVIADO: "Enviado",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
    }
    const statusLabel = statusLabels[order.status.toUpperCase()] || order.status
    doc.text(`Estado: ${statusLabel}`, margin, yPos)
    yPos += 10

    // Información del cliente
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMACIÓN DEL CLIENTE", margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nombre: ${order.customerId || "Cliente"}`, margin, yPos)
    yPos += 10

    // Artículos
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("ARTÍCULOS", margin, yPos)
    yPos += 7

    // Tabla de artículos
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Producto", margin, yPos)
    doc.text("Cant.", margin + 100, yPos)
    doc.text("Precio", margin + 120, yPos)
    doc.text("Total", margin + 160, yPos)
    yPos += 6

    doc.setLineWidth(0.2)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    doc.setFont("helvetica", "normal")
    order.items.forEach((item) => {
      const itemTotal = item.price * item.qty
      const itemName = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name
      
      doc.text(itemName, margin, yPos)
      doc.text(item.qty.toString(), margin + 100, yPos)
      doc.text(`Bs. ${item.price.toLocaleString("es-BO")}`, margin + 120, yPos)
      doc.text(`Bs. ${itemTotal.toLocaleString("es-BO")}`, margin + 160, yPos)
      yPos += 6
    })

    yPos += 5
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    // Resumen
    doc.setFontSize(10)
    doc.text("Subtotal:", margin + 100, yPos)
    doc.text(`Bs. ${totals.sub.toLocaleString("es-BO")}`, margin + 160, yPos)
    yPos += 6

    if (totals.discount > 0) {
      doc.text("Descuento:", margin + 100, yPos)
      doc.text(`-Bs. ${totals.discount.toLocaleString("es-BO")}`, margin + 160, yPos)
      yPos += 6
    }

    doc.text("Envío:", margin + 100, yPos)
    doc.text(`Bs. ${totals.shipping.toLocaleString("es-BO")}`, margin + 160, yPos)
    yPos += 8

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL:", margin + 100, yPos)
    doc.text(`Bs. ${totals.total.toLocaleString("es-BO")}`, margin + 160, yPos)
    yPos += 15

    // Pie de página
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Gracias por su compra!", pageWidth / 2, yPos, { align: "center" })
    yPos += 5
    doc.text("Este documento es un comprobante de su pedido.", pageWidth / 2, yPos, { align: "center" })
    yPos += 5
    doc.text(`Generado el ${new Date().toLocaleDateString("es-BO")} a las ${new Date().toLocaleTimeString("es-BO")}`, pageWidth / 2, yPos, { align: "center" })

    // Descargar el PDF
    doc.save(`recibo-pedido-${order.id}.pdf`)
  }

  // Construir timeline basado en el método de pago/entrega y estado real del pedido
  const getTimeline = () => {
    const status = order.status.toUpperCase()
    const metodoPago = (order as any).metodo_pago?.toUpperCase() || ""
    const orderDate = new Date(order.createdAt)
    const fechaPago = (order as any).fecha_pago ? new Date((order as any).fecha_pago) : null
    const fechaPreparacion = (order as any).fecha_preparacion ? new Date((order as any).fecha_preparacion) : null
    const fechaEnvio = (order as any).fecha_envio ? new Date((order as any).fecha_envio) : null
    const fechaEntrega = (order as any).fecha_entrega ? new Date((order as any).fecha_entrega) : null
    
    // Verificar si es recoger en tienda (tiene sucursal_recogida_id o metodo_pago es RECOGER_EN_TIENDA)
    const esRecogerEnTienda = (order as any).sucursal_recogida_id || metodoPago === "RECOGER_EN_TIENDA"
    
    // Si es RECOGER_EN_TIENDA (pago al recoger), mostrar timeline sin pago previo
    if (metodoPago === "RECOGER_EN_TIENDA") {
      return [
        { 
          status: "Pending", 
          label: "Pedido Realizado", 
          date: orderDate.toISOString(), 
          completed: true 
        },
        { 
          status: "Preparing", 
          label: "Preparando", 
          date: fechaPreparacion?.toISOString() || "", 
          completed: !!fechaPreparacion || status === "LISTO_PARA_RECOGER" || status === "ENTREGADO"
        },
        { 
          status: "Ready", 
          label: "Listo para Recoger", 
          date: status === "LISTO_PARA_RECOGER" || status === "ENTREGADO" ? (fechaPreparacion?.toISOString() || orderDate.toISOString()) : "", 
          completed: status === "LISTO_PARA_RECOGER" || status === "ENTREGADO"
        },
        { 
          status: "PickedUp", 
          label: "Recogido y Pagado", 
          date: fechaEntrega?.toISOString() || "", 
          completed: status === "ENTREGADO"
        },
      ]
    }
    
    // Si es PREPAGO pero recoge en tienda (tiene sucursal_recogida_id)
    if (metodoPago === "PREPAGO" && esRecogerEnTienda) {
      return [
        { 
          status: "Pending", 
          label: "Pedido Realizado", 
          date: orderDate.toISOString(), 
          completed: true 
        },
        { 
          status: "Paid", 
          label: "Pago Recibido", 
          date: fechaPago?.toISOString() || (status === "PAGADO" || status === "LISTO_PARA_RECOGER" || status === "ENTREGADO" ? orderDate.toISOString() : ""), 
          completed: !!fechaPago || status === "PAGADO" || status === "LISTO_PARA_RECOGER" || status === "ENTREGADO"
        },
        { 
          status: "Preparing", 
          label: "Preparando", 
          date: fechaPreparacion?.toISOString() || "", 
          completed: !!fechaPreparacion || status === "LISTO_PARA_RECOGER" || status === "ENTREGADO"
        },
        { 
          status: "Ready", 
          label: "Listo para Recoger", 
          date: status === "LISTO_PARA_RECOGER" || status === "ENTREGADO" ? (fechaPreparacion?.toISOString() || orderDate.toISOString()) : "", 
          completed: status === "LISTO_PARA_RECOGER" || status === "ENTREGADO"
        },
        { 
          status: "PickedUp", 
          label: "Recogido", 
          date: fechaEntrega?.toISOString() || "", 
          completed: status === "ENTREGADO"
        },
      ]
    }
    
    // Si es CONTRA_ENTREGA, mostrar timeline sin pago previo
    if (metodoPago === "CONTRA_ENTREGA") {
      return [
        { 
          status: "Pending", 
          label: "Pedido Realizado", 
          date: orderDate.toISOString(), 
          completed: true 
        },
        { 
          status: "Preparing", 
          label: "Preparando", 
          date: fechaPreparacion?.toISOString() || "", 
          completed: !!fechaPreparacion || status === "EN_ENVIO" || status === "ENTREGADO"
        },
        { 
          status: "Shipped", 
          label: "Enviado", 
          date: fechaEnvio?.toISOString() || "", 
          completed: !!fechaEnvio || status === "ENTREGADO"
        },
        { 
          status: "Delivered", 
          label: "Entregado y Pagado", 
          date: fechaEntrega?.toISOString() || "", 
          completed: status === "ENTREGADO"
        },
      ]
    }
    
    // Si es PREPAGO (o cualquier otro método con pago previo)
    return [
      { 
        status: "Pending", 
        label: "Pedido Realizado", 
        date: orderDate.toISOString(), 
        completed: true 
      },
      { 
        status: "Paid", 
        label: "Pago Recibido", 
        date: fechaPago?.toISOString() || (status === "PAGADO" || status === "ENVIADO" || status === "ENTREGADO" ? orderDate.toISOString() : ""), 
        completed: !!fechaPago || status === "PAGADO" || status === "ENVIADO" || status === "ENTREGADO"
      },
      { 
        status: "Preparing", 
        label: "Preparando", 
        date: fechaPreparacion?.toISOString() || "", 
        completed: !!fechaPreparacion || status === "EN_ENVIO" || status === "ENTREGADO"
      },
      { 
        status: "Shipped", 
        label: "Enviado", 
        date: fechaEnvio?.toISOString() || "", 
        completed: !!fechaEnvio || status === "ENTREGADO"
      },
      { 
        status: "Delivered", 
        label: "Entregado", 
        date: fechaEntrega?.toISOString() || "", 
        completed: status === "ENTREGADO"
      },
    ]
  }
  
  const timeline = getTimeline()

  return (
    <>
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/account/orders" className="text-red-600 font-bold hover:underline">
              ← Volver a Pedidos
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Pedido #{order.id}</h1>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2 space-y-8">
              {/* Status Timeline */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-6">Estado del Pedido</h2>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            item.completed ? "bg-green-600 text-white" : "bg-neutral-300 text-neutral-600"
                          }`}
                        >
                          ✓
                        </div>
                        {index < timeline.length - 1 && (
                          <div className={`w-1 h-12 ${item.completed ? "bg-green-600" : "bg-neutral-300"}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-900">{item.label}</h3>
                        {item.date && (
                          <p className="text-sm text-neutral-600">
                            {new Date(item.date).toLocaleDateString("es-BO", {
                              weekday: "long",
                              day: "2-digit",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery/Pickup Information */}
              {(order as any).metodo_pago && (
                <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h2 className="font-bold text-lg text-neutral-900 mb-4">Información de Entrega/Recogida</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Método:</span>
                      <span className="font-medium text-neutral-900">
                        {(order as any).metodo_pago === "PREPAGO" && "Prepago"}
                        {(order as any).metodo_pago === "CONTRA_ENTREGA" && "Contra Entrega"}
                        {(order as any).metodo_pago === "RECOGER_EN_TIENDA" && "Recoger en Tienda"}
                        {(order as any).metodo_pago === "CREDITO" && "Crédito"}
                        {!["PREPAGO", "CONTRA_ENTREGA", "RECOGER_EN_TIENDA", "CREDITO"].includes((order as any).metodo_pago || "") && (order as any).metodo_pago}
                      </span>
                    </div>
                    {(order as any).direccion_entrega && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Dirección de entrega:</span>
                        <span className="font-medium text-neutral-900 text-right max-w-xs">
                          {(order as any).direccion_entrega}
                        </span>
                      </div>
                    )}
                    {(order as any).fecha_preparacion && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Fecha de preparación:</span>
                        <span className="font-medium text-neutral-900">
                          {new Date((order as any).fecha_preparacion).toLocaleDateString("es-BO", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {(order as any).fecha_envio && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Fecha de envío:</span>
                        <span className="font-medium text-neutral-900">
                          {new Date((order as any).fecha_envio).toLocaleDateString("es-BO", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {(order as any).fecha_entrega && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Fecha de entrega/recogida:</span>
                        <span className="font-medium text-neutral-900">
                          {new Date((order as any).fecha_entrega).toLocaleDateString("es-BO", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {(order as any).persona_recibe && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Recibido por:</span>
                        <span className="font-medium text-neutral-900">
                          {(order as any).persona_recibe}
                        </span>
                      </div>
                    )}
                    {(order as any).observaciones_entrega && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <span className="text-neutral-600 text-xs">Observaciones:</span>
                        <p className="text-neutral-900 text-sm mt-1">
                          {(order as any).observaciones_entrega}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-4">Artículos</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-3 border-b border-neutral-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="text-sm text-neutral-600">Cantidad: {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-900">Bs. {(item.price * item.qty).toLocaleString("es-BO")}</p>
                        <p className="text-sm text-neutral-600">Bs. {item.price.toLocaleString("es-BO")} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button 
                onClick={downloadPDF}
                className="w-full py-3 border border-neutral-300 text-neutral-900 font-bold rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Descargar Recibo en PDF
              </button>
            </div>

            {/* Sidebar */}
            <div className="col-span-1">
              <div className="sticky top-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200 space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-bold text-neutral-900 mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-neutral-600">Nombre:</span> {order.customerId || "Cliente"}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Bs. {totals.sub.toLocaleString("es-BO")}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-Bs. {totals.discount.toLocaleString("es-BO")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>Bs. {totals.shipping.toLocaleString("es-BO")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-4 border-t border-neutral-200">
                    <span>Total:</span>
                    <span>Bs. {totals.total.toLocaleString("es-BO")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
