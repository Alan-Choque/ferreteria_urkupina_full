import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"
import Hero from "@/components/hero"
import CategoryGrid from "@/components/category-grid"
import TrustBar from "@/components/trust-bar"
import EditorialSection from "@/components/editorial-section"

export default function HomePage() {
  return (
    <>
      <Header />
      <MegaMenu />
      <main>
        <Hero />
        <CategoryGrid />
        <TrustBar />
        <EditorialSection />
      </main>
      <footer className="bg-neutral-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Ferretería Urkupina</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Tu tienda de confianza para herramientas y materiales de construcción.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Contacto</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Email: info@urkupina.com
                <br />
                Teléfono: (123) 456-7890
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Horario</h4>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Lunes a Viernes: 8:00 - 18:00
                <br />
                Sábados: 9:00 - 14:00
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
