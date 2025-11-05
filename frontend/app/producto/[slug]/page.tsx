import { productsService } from "@/lib/services/products-service";
import { notFound } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = params;

  try {
    // Llamadas al backend
    const [product, variants] = await Promise.all([
      productsService.getProductBySlug(slug),
      productsService.listVariantsBySlug(slug).catch(() => []), // Fallback a array vacío si falla
    ]);

    // Mapear campos del backend a lo que espera la UI
    const productName = product.nombre || product.name || "Producto";
    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.png";
    const productShort = product.short || product.descripcion || "";
    const productDescription = product.descripcion || product.short || "";
    // Precio: usar price del producto, o el de la primera variante, o null
    const productPrice =
      product.price ?? (product.variantes?.[0]?.precio ? Number(product.variantes[0].precio) : null);

    return (
      <main className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagen */}
          <div className="space-y-4">
            <img
              src={productImage}
              alt={productName}
              className="w-full h-auto max-w-md mx-auto object-cover rounded-lg"
            />
            {product.imagenes && product.imagenes.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.imagenes.slice(1, 5).map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.descripcion || productName}
                    className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">{productName}</h1>
              {product.marca && (
                <p className="text-sm text-neutral-600 mt-1">Marca: {product.marca.nombre}</p>
              )}
              {product.categoria && (
                <p className="text-sm text-neutral-600">Categoría: {product.categoria.nombre}</p>
              )}
            </div>

            {productShort && <p className="text-gray-600 text-lg">{productShort}</p>}

            {productPrice !== null && (
              <div className="text-2xl font-bold text-green-600">
                Bs. {productPrice.toLocaleString("es-BO")}
              </div>
            )}

            {product.sku && (
              <div className="text-sm text-neutral-600">
                <span className="font-semibold">SKU:</span> {product.sku}
              </div>
            )}

            {productDescription && (
              <section className="prose max-w-none pt-4 border-t">
                <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                <p className="text-neutral-700">{productDescription}</p>
              </section>
            )}
          </div>
        </div>

        {/* Variantes */}
        {variants && variants.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Variantes Disponibles</h2>
            <ul className="divide-y border rounded-lg">
              {variants.map((variant) => (
                <li key={variant.id} className="py-3 px-4 flex items-center justify-between hover:bg-neutral-50">
                  <div>
                    <div className="font-medium">{variant.nombre || "Variante sin nombre"}</div>
                    {variant.unidad_medida_nombre && (
                      <div className="text-sm text-gray-500">{variant.unidad_medida_nombre}</div>
                    )}
                  </div>
                  {variant.precio !== null && variant.precio !== undefined && (
                    <div className="font-semibold text-green-600">
                      Bs. {Number(variant.precio).toLocaleString("es-BO")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(!variants || variants.length === 0) && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Variantes Disponibles</h2>
            <p className="text-gray-500">Sin variantes disponibles</p>
          </section>
        )}

        {/* Botón de volver */}
        <div className="mt-8">
          <Link
            href="/catalogo"
            className="inline-block px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    notFound();
  }
}
