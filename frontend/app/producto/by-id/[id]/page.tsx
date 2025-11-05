// app/producto/by-id/[id]/page.tsx (temporal, mientras migras a slug)
import { productsService } from "@/lib/services/products-service";
import { notFound, redirect } from "next/navigation";

export default async function ProductById({ params }: { params: { id: string } }) {
  try {
    const product = await productsService.getProductById(params.id);
    
    // Redirigir a slug si está disponible (migración gradual)
    if (product.slug) {
      redirect(`/producto/${product.slug}`);
    }
    
    // Fallback: mostrar producto por ID
    return (
      <main className="container mx-auto p-4 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Esta página usa ID temporalmente. La URL definitiva será: <code>/producto/{product.slug || params.id}</code>
          </p>
        </div>
        <h1 className="text-3xl font-bold">{product.nombre || product.name || "Producto"}</h1>
        <pre className="bg-neutral-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(product, null, 2)}
        </pre>
      </main>
    );
  } catch (error) {
    console.error("Error loading product by ID:", error);
    notFound();
  }
}

