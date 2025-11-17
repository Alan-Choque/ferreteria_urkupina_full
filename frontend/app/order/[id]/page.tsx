"use client"

import { use } from "react"
import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react"
import jsPDF from "jspdf"
import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // Mock order data
  const order = {
    id: id,
    date: "2024-11-15",
    status: "shipped" as const,
    customer: "Juan Pérez",
    email: "juan@example.com",
    phone: "71234567",
    shippingAddress: "Calle Principal 123, Apto 4B, La Paz",
    items: [
      { name: "Taladro Bosch GSB 20-2", quantity: 1, price: 244000 },
      { name: "Esmeril Angular Bosch", quantity: 1, price: 189000 },
    ],
    subtotal: 433000,
    discount: 43300,
    shipping: 50,
    total: 389750,
  }

  const downloadPDF = () => {
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
    doc.text(`Fecha: ${new Date(order.date).toLocaleDateString("es-BO", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}`, margin, yPos)
    yPos += 6
    doc.text(`Estado: ${order.status === "shipped" ? "Enviado" : order.status}`, margin, yPos)
    yPos += 10

    // Información del cliente
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMACIÓN DEL CLIENTE", margin, yPos)
    yPos += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nombre: ${order.customer}`, margin, yPos)
    yPos += 6
    doc.text(`Email: ${order.email}`, margin, yPos)
    yPos += 6
    doc.text(`Teléfono: ${order.phone}`, margin, yPos)
    yPos += 6
    doc.text(`Dirección de Envío: ${order.shippingAddress}`, margin, yPos)
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
      const itemTotal = item.price * item.quantity
      const itemName = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name
      
      doc.text(itemName, margin, yPos)
      doc.text(item.quantity.toString(), margin + 100, yPos)
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
    doc.text(`Bs. ${order.subtotal.toLocaleString("es-BO")}`, margin + 160, yPos)
    yPos += 6

    if (order.discount > 0) {
      doc.text("Descuento:", margin + 100, yPos)
      doc.text(`-Bs. ${order.discount.toLocaleString("es-BO")}`, margin + 160, yPos)
      yPos += 6
    }

    doc.text("Envío:", margin + 100, yPos)
    doc.text(`Bs. ${order.shipping.toLocaleString("es-BO")}`, margin + 160, yPos)
    yPos += 8

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL:", margin + 100, yPos)
    doc.text(`Bs. ${order.total.toLocaleString("es-BO")}`, margin + 160, yPos)
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

  const timeline = [
    { status: "Pending", label: "Pedido Realizado", date: "2024-11-15", completed: true },
    { status: "Paid", label: "Pago Recibido", date: "2024-11-15", completed: true },
    { status: "Shipped", label: "Enviado", date: "2024-11-17", completed: true },
    { status: "Delivered", label: "Entregado", date: "", completed: false },
  ]

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/account/orders" className="text-red-600 font-bold hover:underline">
              ← Volver a Pedidos
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Pedido {order.id}</h1>

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

              {/* Items */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-4">Artículos</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-3 border-b border-neutral-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="text-sm text-neutral-600">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-neutral-900">Bs. {item.price.toLocaleString("es-BO")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <h2 className="font-bold text-lg text-neutral-900 mb-4">Dirección de Envío</h2>
                <p className="text-neutral-700">{order.shippingAddress}</p>
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
                      <span className="text-neutral-600">Nombre:</span> {order.customer}
                    </p>
                    <p>
                      <span className="text-neutral-600">Email:</span> {order.email}
                    </p>
                    <p>
                      <span className="text-neutral-600">Teléfono:</span> {order.phone}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Bs. {order.subtotal.toLocaleString("es-BO")}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-Bs. {order.discount.toLocaleString("es-BO")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>Bs. {order.shipping}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-4 border-t border-neutral-200">
                    <span>Total:</span>
                    <span>Bs. {order.total.toLocaleString("es-BO")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-neutral-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Contacto, Dirección y Mapa */}
            <div>
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <div className="space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Dirección:</p>
                    <p>Av. San Joaquín esquina Calle "A"</p>
                    <p className="text-xs text-neutral-400">Lado del Colegio Miguel Antelo</p>
                    <p className="text-xs text-neutral-400">Guayaramerin, Bolivia</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Teléfono:</p>
                    <p>+591 68464378</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Email:</p>
                    <p>info@urkupina.com</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-white">Ubicación</h4>
                <div className="w-full h-32 bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                  <iframe
                    src="https://www.google.com/maps?q=Av.+San+Joaquín+esquina+Calle+A,+Colegio+Miguel+Antelo,+Guayaramerin,+Bolivia&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                    title="Ubicación Ferretería Urkupina - Av. San Joaquín esquina Calle A, Guayaramerin"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">Av. San Joaquín esquina Calle "A", lado del Colegio Miguel Antelo, Guayaramerin</p>
              </div>
            </div>

            {/* Links del Sistema */}
            <div>
              <h3 className="font-bold text-lg mb-4">Enlaces</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/categorias" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Categorías
                  </Link>
                </li>
                <li>
                  <Link href="/sucursales" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Sucursales
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Mi Cuenta
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Carrito
                  </Link>
                </li>
              </ul>
            </div>

            {/* Información Adicional */}
            <div>
              <h3 className="font-bold text-lg mb-4">Información</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/politica-privacidad" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terminos-condiciones" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/preguntas-frecuentes" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link href="/sobre-nosotros" className="text-neutral-300 hover:text-orange-500 transition-colors">
                    Sobre Nosotros
                  </Link>
                </li>
              </ul>
              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-3 text-white">Horario de Atención</h4>
                <div className="text-sm text-neutral-300 space-y-1">
                  <p>Lunes - Viernes: 8:00 - 18:00</p>
                  <p>Sábados: 9:00 - 14:00</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div>
              <h3 className="font-bold text-lg mb-4">Síguenos</h3>
              <p className="text-sm text-neutral-300 mb-4">
                Somos tu ferretería de confianza en Guayaramerin.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61579523549381"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-neutral-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-neutral-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-neutral-800 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/@ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-neutral-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-2 text-white">Ferretería Urkupina</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Somos tu ferretería de confianza en Guayaramerin.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-400">
            <p>&copy; {new Date().getFullYear()} Ferretería Urkupina. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
