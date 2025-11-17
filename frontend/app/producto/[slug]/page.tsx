import ProductDetailView from "@/components/product-detail-view"
import { productsService } from "@/lib/services/products-service"
import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearch = searchParams ? await searchParams : undefined
  const fallbackId = resolvedSearch?.id

  let product = null

  // Validar que el slug no sea "undefined" o inválido
  if (!slug || slug === "undefined" || slug === "null" || slug.trim() === "") {
    // Si tenemos un ID de fallback, usarlo directamente
    if (fallbackId) {
      try {
        const id = typeof fallbackId === "string" ? parseInt(fallbackId, 10) : Number(fallbackId)
        if (!isNaN(id) && id > 0) {
          product = await productsService.getProductById(id)
        }
      } catch {}
    }
    
    if (!product) {
      notFound()
    }
  } else {
    // Priorizar slug (método principal) solo si es válido
    
    // Intentar primero con el slug tal cual viene
    try {
      product = await productsService.getProductBySlug(slug)
    } catch (slugError: any) {
      const status = slugError?.status
      
      // Intentar búsqueda aproximada por texto si 404
      if (status === 404 && !product) {
        try {
          const query = slug.replace(/-/g, " ")
          const list = await productsService.listProducts({ q: query, page: 1, page_size: 1 })
          const candidate = list.items?.[0]
          if (candidate?.id) {
            product = await productsService.getProductById(candidate.id)
          }
        } catch {}
      }
      
      // Si el slug es un número, intentar como ID
      if (!isNaN(Number(slug))) {
        try {
          product = await productsService.getProductById(Number(slug))
        } catch {}
      }
      
      // Si aún no se encontró y tenemos un ID en los parámetros, intentar con ese ID
      if (!product && fallbackId) {
        try {
          const id = typeof fallbackId === "string" ? parseInt(fallbackId, 10) : Number(fallbackId)
          if (!isNaN(id) && id > 0) {
            product = await productsService.getProductById(id)
          }
        } catch {}
      }
    }
  }

  if (!product) {
    notFound()
  }

  const serializableProduct = JSON.parse(JSON.stringify(product))
  const variants = serializableProduct.variantes ?? []

  return (
    <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 py-3">
      <div className="max-w-4xl mx-auto px-3.5 lg:px-4 space-y-3">
        <nav className="text-sm text-neutral-500">
          <a href="/" className="hover:text-neutral-800">
            Inicio
          </a>
          <span className="mx-1.5">/</span>
          <a href="/catalogo" className="hover:text-neutral-800">
            Catálogo
          </a>
          {serializableProduct.categoria?.nombre && (
            <>
              <span className="mx-1.5">/</span>
              <span>{serializableProduct.categoria.nombre}</span>
            </>
          )}
        </nav>
        <ProductDetailView product={serializableProduct} variants={variants} />
        <div className="text-center">
          <a
            href="/catalogo"
            className="inline-flex items-center.justify-center px-5 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-2xl hover:border-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Volver al catálogo
          </a>
        </div>
      </div>
    </div>
  )
}

