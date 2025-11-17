"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react"

export default function FooterFerretek() {
  return (
    <footer className="bg-neutral-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Logo y Contacto */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Link href="/" className="flex items-center gap-3 mb-3">
                <div className="relative h-16 w-auto flex items-center flex-shrink-0">
                  <img
                    src="/logo-urkupina.png"
                    alt="Logo Ferretería Urkupina"
                    className="object-contain h-full max-h-16"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                </div>
                <span className="text-xl font-bold">FERRETERÍA URKUPINA</span>
              </Link>
            </div>
            <div className="mb-3">
              <p className="font-bold text-white mb-2 text-sm">Casa Matriz</p>
              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p>Av. San Joaquín esquina Calle "A", lado del Colegio Miguel Antelo, Guayaramerin, Bolivia</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <p>+591 68464378</p>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p>info@urkupina.com</p>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <h4 className="font-semibold text-xs mb-1.5 text-white">Horario de Atención</h4>
              <div className="text-xs text-neutral-300 space-y-0.5">
                <p>Lunes - Viernes: 8:00 - 18:00</p>
                <p>Sábados: 9:00 - 14:00</p>
                <p>Domingos: Cerrado</p>
              </div>
            </div>
            <Link
              href="/contacto"
              className="inline-block bg-orange-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-orange-700 transition-colors text-sm mb-3"
            >
              Contáctanos
            </Link>
            <div>
              <h4 className="font-semibold text-xs mb-1.5 text-white">Ubicación</h4>
              <div className="w-full h-24 bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
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
            </div>
          </div>

          {/* Nosotros */}
          <div>
            <h3 className="font-bold text-sm mb-3">Nosotros</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/sobre-nosotros" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link href="/sucursales" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Sucursales
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-bold text-sm mb-3">Ayuda</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/preguntas-frecuentes" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  ¿Cómo Comprar?
                </Link>
              </li>
              <li>
                <Link href="/sucursales" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Seguimiento de Compra
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="font-bold text-sm mb-3">Categorías</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/categorias/herramientas-construccion" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Herramientas de Construcción
                </Link>
              </li>
              <li>
                <Link href="/categorias/equipos-industria" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Equipos y Herramientas de Industria y Taller
                </Link>
              </li>
              <li>
                <Link href="/categorias/aseo-jardin" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Herramientas de Aseo y Jardín
                </Link>
              </li>
              <li>
                <Link href="/categorias/insumos-accesorios" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Insumos y Accesorios
                </Link>
              </li>
              <li>
                <Link href="/categorias/pintura" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Pinturas
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal y Redes Sociales */}
          <div>
            <h3 className="font-bold text-sm mb-3">Legal</h3>
            <ul className="space-y-1.5 text-xs mb-4">
              <li>
                <Link href="/terminos-condiciones" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Políticas de privacidad
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="text-neutral-300 hover:text-orange-500 transition-colors">
                  Política de garantía y devoluciones
                </Link>
              </li>
            </ul>
            <div>
              <h4 className="font-semibold text-xs mb-2 text-white">Síguenos</h4>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.facebook.com/profile.php?id=61579523549381"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com/ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/@ferreteriaurkupina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 border border-neutral-700 rounded-full flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
          <p>&copy; {new Date().getFullYear()} Ferretería Urkupina. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

