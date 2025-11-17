"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { productsService, type ProductListItem } from "@/lib/services/products-service";
import { categoriesService } from "@/lib/services/categories-service";
import { LoadingState, ErrorState, ProductSkeleton } from "@/components/api-boundary";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/lib/contexts/toast-context";

interface Filters {
  search: string;
  categories: string[]; // Array para múltiples categorías
  brand: string;
  priceMin: number;
  priceMax: number;
  availability: string;
}

const sanitizeSlug = (value?: string | null) => {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  const lower = trimmed.toLowerCase()
  // Si es "undefined", "null", o está vacío, retornar cadena vacía
  if (lower === "undefined" || lower === "null" || trimmed === "") return ""
  return trimmed
}

const slugifyName = (name?: string | null) => {
  if (!name) return ""
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CatalogPage() {
  const { add } = useCart()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  
  // Leer parámetro de búsqueda de la URL
  const initialSearch = searchParams.get("q") || ""
  
  const [filters, setFilters] = useState<Filters>({
    search: initialSearch,
    categories: [], // Array vacío para múltiples categorías
    brand: "all",
    priceMin: 0,
    priceMax: 500000,
    availability: "all",
  });

  // Cargar todas las categorías desde la API
  const [allCategories, setAllCategories] = useState<Array<{ id: number; nombre: string }>>([]);
  // Cargar todos los productos para contar por categoría
  const [allProductsForCount, setAllProductsForCount] = useState<ProductListItem[]>([]);
  
  // Actualizar búsqueda cuando cambia el parámetro de la URL
  useEffect(() => {
    const urlSearch = searchParams.get("q") || ""
    if (urlSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: urlSearch }))
    }
  }, [searchParams, filters.search])
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoriesService.listCategories();
        setAllCategories(cats);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Cargar todos los productos una vez para contar por categoría
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const data = await productsService.listProducts({ page: 1, page_size: 200 });
        setAllProductsForCount(data.items.map((item) => ({ ...item, name: item.nombre })));
      } catch (err) {
        console.error("Error loading all products for count:", err);
      }
    };
    loadAllProducts();
  }, []);

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
      // Si hay categorías seleccionadas, usar la primera para la API (el backend solo acepta una)
      // Pero filtraremos localmente por todas las seleccionadas
      if (filters.categories.length > 0) {
        const firstCategoryId = parseInt(filters.categories[0]);
        if (!isNaN(firstCategoryId)) {
          params.category_id = firstCategoryId;
        }
      }
      if (filters.brand !== "all") {
        const brandId = parseInt(filters.brand);
        if (!isNaN(brandId)) {
          params.brand_id = brandId;
        }
      }

      const data = await productsService.listProducts(params);
      setProducts(data.items.map((item) => ({ ...item, name: item.nombre })));
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.categories, filters.brand, page, pageSize]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Debounced search handler
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPage(1);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply local filters (categorías, precio, disponibilidad) y sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtrar por categorías seleccionadas (múltiples)
    if (filters.categories.length > 0) {
      const selectedCategoryIds = filters.categories.map(cat => parseInt(cat)).filter(id => !isNaN(id));
      result = result.filter((product) => {
        const productCategoryId = product.categoria?.id;
        return productCategoryId && selectedCategoryIds.includes(productCategoryId);
      });
    }

    // Filtrar por precio
    if (filters.priceMin > 0 || filters.priceMax < 500000) {
      result = result.filter((product) => {
        const price = product.price ?? product.variantes?.[0]?.precio ?? 0;
        const numPrice = Number(price) || 0;
        return numPrice >= filters.priceMin && numPrice <= filters.priceMax;
      });
    }

    // Filtrar por disponibilidad (status)
    if (filters.availability !== "all") {
      result = result.filter((product) => {
        if (filters.availability === "available") {
          return product.status === "ACTIVE";
        } else if (filters.availability === "unavailable") {
          return product.status === "INACTIVE";
        }
        return true;
      });
    }

    // Aplicar sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const priceA = Number(a.price ?? a.variantes?.[0]?.precio ?? 0);
        const priceB = Number(b.price ?? b.variantes?.[0]?.precio ?? 0);
        return priceA - priceB;
      });
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const priceA = Number(a.price ?? a.variantes?.[0]?.precio ?? 0);
        const priceB = Number(b.price ?? b.variantes?.[0]?.precio ?? 0);
        return priceB - priceA;
      });
    } else if (sortBy === "newest") {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [products, filters.categories, filters.priceMin, filters.priceMax, filters.availability, sortBy]);

  // Get unique brands and categories from products
  const brands = useMemo(() => {
    const brandMap = new Map<number, string>();
    products.forEach((p) => {
      if (p.marca?.id && p.marca?.nombre) {
        brandMap.set(p.marca.id, p.marca.nombre);
      }
    });
    return Array.from(brandMap.entries()).map(([id, nombre]) => ({
      value: String(id),
      label: nombre,
    }));
  }, [products]);

  const categories = useMemo(() => {
    const catMap = new Map<number, string>();
    products.forEach((p) => {
      if (p.categoria?.id && p.categoria?.nombre) {
        catMap.set(p.categoria.id, p.categoria.nombre);
      }
    });
    return [
      { value: "all", label: "Todas" },
      ...Array.from(catMap.entries()).map(([id, nombre]) => ({
        value: String(id),
        label: nombre,
      })),
    ];
  }, [products]);

  const maxPage = Math.ceil(total / pageSize);

  if (loading && products.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-8">Catálogo de Productos</h1>
          <ProductSkeleton count={12} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <ErrorState error={error} />
      </main>
    );
  }

  return (
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nombre o marca..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>

                {/* Category Filter - Checkboxes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-neutral-900">Categoría</label>
                    <ChevronUp className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="space-y-1 border border-neutral-200 rounded-lg p-3 bg-white">
                    {allCategories.length === 0 ? (
                      <p className="text-sm text-neutral-500">Cargando categorías...</p>
                    ) : (
                      allCategories.map((cat) => {
                        const isChecked = filters.categories.includes(String(cat.id));
                        // Contar productos en esta categoría
                        const productCount = allProductsForCount.filter(
                          (p) => p.categoria?.id === cat.id
                        ).length;
                        return (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters((prev) => ({
                                    ...prev,
                                    categories: [...prev.categories, String(cat.id)],
                                  }));
                                } else {
                                  setFilters((prev) => ({
                                    ...prev,
                                    categories: prev.categories.filter((c) => c !== String(cat.id)),
                                  }));
                                }
                                setPage(1);
                              }}
                              className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-600"
                            />
                            <span className="text-sm text-neutral-700 flex-1">
                              {cat.nombre}
                              {productCount > 0 && (
                                <span className="text-neutral-500 ml-1">({productCount})</span>
                              )}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {filters.categories.length > 0 && (
                    <button
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, categories: [] }));
                        setPage(1);
                      }}
                      className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Limpiar selección
                    </button>
                  )}
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="all">Todas</option>
                    {brands.map((brand) => (
                      <option key={brand.value} value={brand.value}>
                        {brand.label}
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

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-3">Disponibilidad</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, availability: e.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option value="all">Todas</option>
                    <option value="available">Disponibles</option>
                    <option value="unavailable">No Disponibles</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchInput("");
                    setFilters({
                      search: "",
                      categories: [],
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
                  Mostrando <strong>{filteredProducts.length}</strong> de <strong>{filteredProducts.length === products.length ? total : filteredProducts.length}</strong> productos
                  {filteredProducts.length !== products.length && (
                    <span className="text-xs text-neutral-500 ml-2">
                      (de {products.length} cargados)
                    </span>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  {/* View Mode Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 rounded-lg ${
                        viewMode === "grid"
                          ? "bg-orange-600 text-white"
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
                          ? "bg-orange-600 text-white"
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
                      setSearchInput("");
                      setFilters({
                        search: "",
                        categories: [],
                        brand: "all",
                        priceMin: 0,
                        priceMax: 500000,
                        availability: "all",
                      });
                      setPage(1);
                    }}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const productPrice = Number(product.price ?? product.variantes?.[0]?.precio ?? 0);
                    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg";
                    const productName = product.nombre || product.name || "Producto";
                    
                    // CRÍTICO: Usar SIEMPRE el slug del backend si está disponible
                    // El backend calcula el slug usando slugify de Python, que puede ser diferente
                    let productSlug = ""
                    
                    // Primero intentar con el slug del backend (el más confiable)
                    if (product.slug && typeof product.slug === "string") {
                      const backendSlug = product.slug.trim()
                      if (backendSlug && backendSlug !== "undefined" && backendSlug !== "null") {
                        productSlug = backendSlug
                      }
                    }
                    
                    // Si el slug del backend no está disponible o es inválido, generar uno desde el nombre
                    if (!productSlug && product.nombre) {
                      productSlug = slugifyName(product.nombre)
                    }
                    
                    // Si aún no hay slug válido, usar el ID como último recurso
                    if (!productSlug && product.id) {
                      productSlug = product.id.toString()
                    }

                    // Si definitivamente no hay slug válido, no renderizar este producto
                    if (!productSlug || productSlug === "undefined" || productSlug === "null") {
                      console.warn("⚠️ Producto sin slug válido - ID:", product.id, "Nombre:", product.nombre, "Slug del backend:", product.slug)
                      return null;
                    }

                    // Fallback definitivo: navegar por ID garantiza que el backend encuentre el producto
                    const productHref = `/producto/${product.id}`;
                    // Calcular descuento: todos los productos tienen un 20% de descuento simulado
                    // TODO: En el futuro, obtener descuentos reales desde promociones activas en la BD
                    const originalPrice = productPrice * 1.25; // Precio original = precio actual + 25% (20% descuento)
                    const discount = 20; // Descuento fijo del 20% para todos los productos

                    return (
                      <div
                        key={product.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <Link href={productHref}>
                          <div className="relative bg-neutral-100 h-48 overflow-hidden">
                            {discount > 0 && (
                              <div
                                className="absolute top-3 right-3 text-white text-sm font-bold px-2 py-1 rounded"
                                style={{ backgroundColor: "var(--storefront-cta)" }}
                              >
                                {discount}%
                              </div>
                            )}
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          </div>
                        </Link>
                        <div className="p-4">
                          {product.marca?.nombre && (
                            <p className="text-xs text-neutral-600 mb-1">{product.marca.nombre}</p>
                          )}
                          <Link href={productHref}>
                            <h3 className="font-bold text-neutral-900 text-sm mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                              {productName}
                            </h3>
                          </Link>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-green-600 font-bold">
                              Bs. {productPrice.toLocaleString("es-BO")}
                            </span>
                            {originalPrice > productPrice && (
                              <span className="text-sm text-neutral-400 line-through">
                                Bs. {originalPrice.toLocaleString("es-BO")}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              const variant = product.variantes?.[0]
                              if (variant) {
                                add({
                                  id: product.id,
                                  sku: product.sku || String(product.id),
                                  slug: productSlug,
                                  name: productName,
                                  price: productPrice,
                                  image: productImage,
                                  variantId: variant.id.toString(),
                                  variantSku: String(variant.id),
                                  variantName: variant.nombre || "Variante",
                                  variantPrice: variant.precio ?? 0,
                                }, 1)
                                showToast(`Producto "${productName}" se agregó al carrito`, "success")
                              }
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                          >
                            AÑADIR AL CARRO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const productPrice = Number(product.price ?? product.variantes?.[0]?.precio ?? 0);
                    const productImage = product.image || product.imagenes?.[0]?.url || "/placeholder.svg";
                    const productName = product.nombre || product.name || "Producto";
                    
                    // CRÍTICO: Usar SIEMPRE el slug del backend si está disponible
                    // El backend calcula el slug usando slugify de Python, que puede ser diferente
                    let productSlug = ""
                    
                    // Primero intentar con el slug del backend (el más confiable)
                    if (product.slug && typeof product.slug === "string") {
                      const backendSlug = product.slug.trim()
                      if (backendSlug && backendSlug !== "undefined" && backendSlug !== "null") {
                        productSlug = backendSlug
                      }
                    }
                    
                    // Si el slug del backend no está disponible o es inválido, generar uno desde el nombre
                    if (!productSlug && product.nombre) {
                      productSlug = slugifyName(product.nombre)
                    }
                    
                    // Si aún no hay slug válido, usar el ID como último recurso
                    if (!productSlug && product.id) {
                      productSlug = product.id.toString()
                    }

                    // Si definitivamente no hay slug válido, no renderizar este producto
                    if (!productSlug || productSlug === "undefined" || productSlug === "null") {
                      console.warn("⚠️ Producto sin slug válido - ID:", product.id, "Nombre:", product.nombre, "Slug del backend:", product.slug)
                      return null;
                    }

                    // Usar solo el slug en la URL (sin ID como parámetro)
                    const productHref = `/producto/${productSlug}`;
                    // Calcular descuento: todos los productos tienen un 20% de descuento simulado
                    // TODO: En el futuro, obtener descuentos reales desde promociones activas en la BD
                    const originalPrice = productPrice * 1.25; // Precio original = precio actual + 25% (20% descuento)
                    const discount = 20; // Descuento fijo del 20% para todos los productos

                    return (
                      <Link
                        key={product.id}
                        href={productHref}
                        className="flex gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                      >
                        <div className="relative">
                          {discount > 0 && (
                            <div
                              className="absolute top-1 right-1 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10"
                              style={{ backgroundColor: "var(--storefront-cta)" }}
                            >
                              {discount}%
                            </div>
                          )}
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-24 h-24 object-cover rounded"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          {product.marca?.nombre && (
                            <p className="text-xs text-neutral-600">{product.marca.nombre}</p>
                          )}
                          <h3 className="font-bold text-neutral-900 mb-1">{productName}</h3>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-green-600 font-bold">
                              Bs. {productPrice.toLocaleString("es-BO")}
                            </span>
                            {originalPrice > productPrice && (
                              <span className="text-sm text-neutral-400 line-through">
                                Bs. {originalPrice.toLocaleString("es-BO")}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              const variant = product.variantes?.[0]
                              if (variant) {
                                add({
                                  id: product.id,
                                  sku: product.sku || String(product.id),
                                  slug: productSlug,
                                  name: productName,
                                  price: productPrice,
                                  image: productImage,
                                  variantId: variant.id.toString(),
                                  variantSku: String(variant.id),
                                  variantName: variant.nombre || "Variante",
                                  variantPrice: variant.precio ?? 0,
                                }, 1)
                                showToast(`Producto "${productName}" se agregó al carrito`, "success")
                              }
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                          >
                            AÑADIR AL CARRO
                          </button>
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
  );
}
