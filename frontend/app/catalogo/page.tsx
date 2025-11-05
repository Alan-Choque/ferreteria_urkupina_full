"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/header";
import MegaMenu from "@/components/mega-menu";
import { productsService, type ProductListItem } from "@/lib/services/products-service";
import { LoadingState, ErrorState, ProductSkeleton } from "@/components/api-boundary";

interface Filters {
  search: string;
  category: string;
  brand: string;
  priceMin: number;
  priceMax: number;
  availability: string;
}

export default function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    brand: "all",
    priceMin: 0,
    priceMax: 500000,
    availability: "all",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Estado de datos
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar productos desde API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (filters.search) {
        params.q = filters.search;
      }
      if (filters.category !== "all") {
        params.category_id = parseInt(filters.category);
      }
      if (filters.brand !== "all") {
        params.brand_id = parseInt(filters.brand);
      }

      const data = await productsService.listProducts(params);
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.category, filters.brand, page, pageSize]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1); // Reset to first page on search
  }, []);

  // Apply local filters (precio, disponibilidad) y sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtrar por precio
    if (filters.priceMin > 0 || filters.priceMax < 500000) {
      result = result.filter((product) => {
        const price = product.price ?? product.variantes?.[0]?.precio ?? 0;
        return price >= filters.priceMin && price <= filters.priceMax;
      });
    }

    // Aplicar sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const priceA = a.price ?? a.variantes?.[0]?.precio ?? 0;
        const priceB = b.price ?? b.variantes?.[0]?.precio ?? 0;
        return Number(priceA) - Number(priceB);
      });
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const priceA = a.price ?? a.variantes?.[0]?.precio ?? 0;
        const priceB = b.price ?? b.variantes?.[0]?.precio ?? 0;
        return Number(priceB) - Number(priceA);
      });
    } else if (sortBy === "newest") {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [products, filters.priceMin, filters.priceMax, sortBy]);

  // Get unique brands and categories from products
  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((p) => {
      if (p.marca?.nombre) brandSet.add(p.marca.nombre);
    });
    return Array.from(brandSet);
  }, [products]);

  const categories = useMemo(() => {
    const catSet = new Set<{ value: string; label: string }>();
    products.forEach((p) => {
      if (p.categoria?.nombre) {
        catSet.add({ value: String(p.categoria.id), label: p.categoria.nombre });
      }
    });
    return [{ value: "all", label: "Todas" }, ...Array.from(catSet)];
  }, [products]);

  const maxPage = Math.ceil(total / pageSize);

  if (loading && products.length === 0) {
    return (
      <>
        <Header />
        <MegaMenu />
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-8">Catálogo de Productos</h1>
            <ProductSkeleton count={12} />
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <MegaMenu />
        <main className="min-h-screen bg-white">
          <ErrorState error={error} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <MegaMenu />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Catálogo de Productos</h1>

          <div className="grid grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="col-span-1">
              <div className="space-y-6 sticky top-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">Buscar</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Nombre o marca..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">Categoría</label>
                  <select
                    value={filters.category}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, category: e.target.value }));
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">Marca</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, brand: e.target.value }));
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="all">Todas</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">Rango de Precio</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceMin: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="Mín"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceMax: Number.parseInt(e.target.value) || 500000,
                        }))
                      }
                      placeholder="Máx"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">
                    Bs. {filters.priceMin.toLocaleString("es-BO")} - Bs. {filters.priceMax.toLocaleString("es-BO")}
                  </p>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setFilters({
                      search: "",
                      category: "all",
                      brand: "all",
                      priceMin: 0,
                      priceMax: 500000,
                      availability: "all",
                    });
                    setPage(1);
                  }}
                  className="w-full py-2 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-100"
                >
                  Limpiar Filtros
                </button>
              </div>
            </aside>

            {/* Products */}
            <div className="col-span-3">
              {/* Top Bar */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200">
                <div className="text-sm text-neutral-600">
                  Mostrando <strong>{filteredProducts.length}</strong> de <strong>{total}</strong> productos
                </div>

                <div className="flex gap-4 items-center">
                  {/* View Mode Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 rounded-lg ${
                        viewMode === "grid"
                          ? "bg-red-600 text-white"
                          : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      }`}
                      title="Vista de cuadrícula"
                    >
                      ⊞
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-2 rounded-lg ${
                        viewMode === "list"
                          ? "bg-red-600 text-white"
                          : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      }`}
                      title="Vista de lista"
                    >
                      ≡
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                  >
                    <option value="newest">Más Nuevos</option>
                    <option value="price-low">Precio: Menor a Mayor</option>
                    <option value="price-high">Precio: Mayor a Menor</option>
                  </select>
                </div>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                <ProductSkeleton count={9} />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 mb-4">No se encontraron productos</p>
                  <button
                    onClick={() => {
                      setFilters({
                        search: "",
                        category: "all",
                        brand: "all",
                        priceMin: 0,
                        priceMax: 500000,
                        availability: "all",
                      });
                      setPage(1);
                    }}
                    className="text-red-600 font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const productPrice = product.price ?? product.variantes?.[0]?.precio ?? null;
                    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg";
                    const productName = product.nombre || product.name || "Producto";
                    const productSlug = product.slug || String(product.id);

                    return (
                      <Link
                        key={product.id}
                        href={`/producto/${productSlug}`}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative bg-neutral-100 h-48 overflow-hidden">
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-4">
                          {product.marca?.nombre && (
                            <p className="text-xs text-neutral-600 mb-1">{product.marca.nombre}</p>
                          )}
                          <h3 className="font-bold text-neutral-900 text-sm mb-2 line-clamp-2">{productName}</h3>
                          {productPrice !== null && (
                            <p className="text-green-600 font-bold mb-2">
                              Bs. {Number(productPrice).toLocaleString("es-BO")}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const productPrice = product.price ?? product.variantes?.[0]?.precio ?? null;
                    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg";
                    const productName = product.nombre || product.name || "Producto";
                    const productSlug = product.slug || String(product.id);

                    return (
                      <Link
                        key={product.id}
                        href={`/producto/${productSlug}`}
                        className="flex gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                      >
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          {product.marca?.nombre && (
                            <p className="text-xs text-neutral-600">{product.marca.nombre}</p>
                          )}
                          <h3 className="font-bold text-neutral-900 mb-1">{productName}</h3>
                          <div className="flex justify-between items-center">
                            {productPrice !== null && (
                              <p className="text-green-600 font-bold">
                                Bs. {Number(productPrice).toLocaleString("es-BO")}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {maxPage > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-600">
                    Página {page} de {maxPage}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                    disabled={page === maxPage}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-neutral-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-400 text-sm">
          <p>&copy; 2025 Ferretería Urkupina. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
