import CategoryPage from "@/components/category-page"

export const metadata = {
  title: "Outlet | Ferretería Urkupina",
  description: "Productos en oferta del outlet",
}

export default function OutletPage() {
  return <CategoryPage categoryId="outlet" title="Outlet" description="Artículos 1-12 de 1200" />
}
