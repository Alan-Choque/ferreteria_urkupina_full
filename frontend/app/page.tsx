import HeroFerretek from "@/components/hero-ferretek"
import FeaturedProducts from "@/components/featured-products"
import BrandsSection from "@/components/brands-section"
import FloatingWidgets from "@/components/floating-widgets"

export default function HomePage() {
  return (
    <>
      <main>
        <HeroFerretek />
        <FeaturedProducts />
      </main>
      <BrandsSection />
      <FloatingWidgets />
    </>
  )
}

