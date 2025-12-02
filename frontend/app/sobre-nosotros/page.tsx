"use client"

import Link from "next/link"
import { Target, Eye, History } from "lucide-react"

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Sobre Nosotros</h1>
            <p className="text-lg text-orange-100">Conoce nuestra historia, misión y visión</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Historia */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-neutral-900">Nuestra Historia</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-neutral-700 leading-relaxed mb-4">
                Ferretería Urkupina nació de la pasión por el servicio y el compromiso con la comunidad de Guayaramerín. Fundada en [Año de Fundación], hemos crecido de ser una pequeña tienda local a un referente en la distribución de herramientas y materiales de construcción de alta calidad. Desde nuestros inicios, nos hemos dedicado a entender las necesidades de nuestros clientes, ofreciendo soluciones duraderas y eficientes para cada proyecto.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                A lo largo de los años, hemos expandido nuestro catálogo, incorporando las marcas más reconocidas a nivel nacional e internacional, y hemos invertido en tecnología para mejorar la experiencia de compra, tanto en nuestra tienda física como en línea. Nuestro camino ha estado marcado por la confianza de nuestros clientes y la dedicación de nuestro equipo.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-neutral-900">Misión</h2>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              Ser el aliado estratégico de nuestros clientes, proporcionando una amplia gama de herramientas y materiales de construcción de la más alta calidad, con un servicio excepcional y asesoramiento experto, para que cada proyecto se construya con éxito y durabilidad.
            </p>
          </section>

          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-neutral-900">Visión</h2>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              Consolidarnos como la ferretería líder en la región, reconocida por nuestra innovación, compromiso con la calidad y la sostenibilidad, y por ser la primera opción para profesionales y particulares que buscan soluciones integrales para sus necesidades de construcción y mantenimiento.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-orange-600 mb-4">Nuestros Valores</h2>
            <ul className="list-disc list-inside text-neutral-700 space-y-2 leading-relaxed">
              <li>**Calidad:** Ofrecemos solo productos que cumplen con los más altos estándares.</li>
              <li>**Integridad:** Actuamos con honestidad y transparencia en todas nuestras operaciones.</li>
              <li>**Servicio al Cliente:** Nos esforzamos por superar las expectativas de nuestros clientes en cada interacción.</li>
              <li>**Innovación:** Buscamos constantemente nuevas y mejores formas de servir a nuestros clientes y mejorar nuestros productos.</li>
              <li>**Compromiso:** Estamos dedicados al crecimiento y desarrollo de nuestra comunidad y nuestro equipo.</li>
            </ul>
          </section>

          <div className="text-center mt-12">
            <Link
              href="/contacto"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              Contáctanos
            </Link>
          </div>
        </div>
    </main>
  )
}
