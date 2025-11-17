import Header from "@/components/header"
import MegaMenu from "@/components/mega-menu"
import HeroFerretek from "@/components/hero-ferretek"
import FeaturedProducts from "@/components/featured-products"
import BrandsSection from "@/components/brands-section"
import FloatingWidgets from "@/components/floating-widgets"
import FooterFerretek from "@/components/footer-ferretek"

export default function HomePage() {
  return (
    <>
      <Header />
      <MegaMenu />
      <main>
        <HeroFerretek />
        <FeaturedProducts />
      </main>
      <BrandsSection />
      <FloatingWidgets />
      <FooterFerretek />
    </>
  )
}

