"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { productsService, type ProductListItem } from "@/lib/services/products-service";
import { categoriesService } from "@/lib/services/categories-service";
import { LoadingState, ErrorState, ProductSkeleton } from "@/components/api-boundary";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/lib/contexts/wishlist-context";
import { useToast } from "@/lib/contexts/toast-context";
import { Heart } from "lucide-react";

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
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  
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
        // Si falla, dejar el array vacío para que la página siga funcionando
        setAllCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Cargar todos los productos una vez para contar por categoría y obtener todas las marcas
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        // Cargar más productos para obtener todas las marcas disponibles
        // Hacer múltiples peticiones si es necesario
        let allItems: ProductListItem[] = [];
        let currentPage = 1;
        const pageSize = 200;
        let hasMore = true;

        while (hasMore && currentPage <= 5) { // Limitar a 5 páginas (1000 productos máximo)
          const data = await productsService.listProducts({ page: currentPage, page_size: pageSize });
          allItems = [...allItems, ...data.items.map((item) => ({ ...item, name: item.nombre }))];
          
          // Si hay menos productos que el page_size, no hay más páginas
          if (data.items.length < pageSize || allItems.length >= data.total) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }
        
        setAllProductsForCount(allItems);
      } catch (err) {
        console.error("Error loading all products for count:", err);
        // Si falla, dejar el array vacío para que la página siga funcionando
        setAllProductsForCount([]);
      }
    };
    loadAllProducts();
  }, []);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [brandsExpanded, setBrandsExpanded] = useState(true);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(true);
  const [brandsDropdownOpen, setBrandsDropdownOpen] = useState(false);
  const [availabilityDropdownOpen, setAvailabilityDropdownOpen] = useState(false);

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
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      // Si es un error 500, mostrar mensaje más amigable
      if ((err as any)?.status === 500) {
        setError(new Error("Error al conectar con el servidor. Por favor, intenta más tarde."));
      } else {
        setError(err instanceof Error ? err : new Error(errorMessage));
      }
      console.error("Error loading products:", err);
      // En caso de error, dejar arrays vacíos para que la página siga funcionando
      setProducts([]);
      setTotal(0);
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

  // Get unique brands from all products loaded (including allProductsForCount for more brands)
  const brands = useMemo(() => {
    const brandMap = new Map<number, string>();
    // Usar allProductsForCount para obtener todas las marcas disponibles
    allProductsForCount.forEach((p) => {
      if (p.marca?.id && p.marca?.nombre) {
        brandMap.set(p.marca.id, p.marca.nombre);
      }
    });
    // También agregar marcas de productos actuales por si acaso
    products.forEach((p) => {
      if (p.marca?.id && p.marca?.nombre) {
        brandMap.set(p.marca.id, p.marca.nombre);
      }
    });
    // Ordenar alfabéticamente
    return Array.from(brandMap.entries())
      .map(([id, nombre]) => ({
        value: String(id),
        label: nombre,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [products, allProductsForCount]);

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

  // Calcular el número máximo de páginas basado en el total real de productos
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

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
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error al cargar el catálogo</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => {
                setError(null);
                loadProducts();
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
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
                  <button
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
                  >
                    <label className="block text-sm font-bold text-neutral-900 cursor-pointer">Categoría</label>
                    {categoriesExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                  {categoriesExpanded && (
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
                  )}
                  {filters.categories.length > 0 && categoriesExpanded && (
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

                {/* Brand Filter - Desplegable */}
                <div>
                  <button
                    onClick={() => setBrandsExpanded(!brandsExpanded)}
                    className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
                  >
                    <label className="block text-sm font-bold text-neutral-900 cursor-pointer">Marca</label>
                    {brandsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                  {brandsExpanded && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBrandsDropdownOpen(!brandsDropdownOpen)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 text-left flex items-center justify-between bg-white"
                      >
                        <span className="text-neutral-700">
                          {filters.brand === "all" ? "Todas" : brands.find(b => b.value === filters.brand)?.label || "Todas"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform ${brandsDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {brandsDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setBrandsDropdownOpen(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({ ...prev, brand: "all" }));
                                setPage(1);
                                setBrandsDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center justify-between ${
                                filters.brand === "all" ? "bg-orange-50 text-orange-600" : "text-neutral-700"
                              }`}
                            >
                              <span>Todas</span>
                              {filters.brand === "all" && <Check className="w-4 h-4" />}
                            </button>
                            {brands.map((brand) => (
                              <button
                                key={brand.value}
                                type="button"
                                onClick={() => {
                                  setFilters((prev) => ({ ...prev, brand: brand.value }));
                                  setPage(1);
                                  setBrandsDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center justify-between ${
                                  filters.brand === brand.value ? "bg-orange-50 text-orange-600" : "text-neutral-700"
                                }`}
                              >
                                <span>{brand.label}</span>
                                {filters.brand === brand.value && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
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

                {/* Availability Filter - Desplegable */}
                <div>
                  <button
                    onClick={() => setAvailabilityExpanded(!availabilityExpanded)}
                    className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
                  >
                    <label className="block text-sm font-bold text-neutral-900 cursor-pointer">Disponibilidad</label>
                    {availabilityExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                  {availabilityExpanded && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAvailabilityDropdownOpen(!availabilityDropdownOpen)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 text-left flex items-center justify-between bg-white"
                      >
                        <span className="text-neutral-700">
                          {filters.availability === "all" ? "Todas" : 
                           filters.availability === "available" ? "Disponibles" : "No Disponibles"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform ${availabilityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {availabilityDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setAvailabilityDropdownOpen(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({ ...prev, availability: "all" }));
                                setAvailabilityDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center justify-between ${
                                filters.availability === "all" ? "bg-orange-50 text-orange-600" : "text-neutral-700"
                              }`}
                            >
                              <span>Todas</span>
                              {filters.availability === "all" && <Check className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({ ...prev, availability: "available" }));
                                setAvailabilityDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center justify-between ${
                                filters.availability === "available" ? "bg-orange-50 text-orange-600" : "text-neutral-700"
                              }`}
                            >
                              <span>Disponibles</span>
                              {filters.availability === "available" && <Check className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilters((prev) => ({ ...prev, availability: "unavailable" }));
                                setAvailabilityDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-neutral-100 flex items-center justify-between ${
                                filters.availability === "unavailable" ? "bg-orange-50 text-orange-600" : "text-neutral-700"
                              }`}
                            >
                              <span>No Disponibles</span>
                              {filters.availability === "unavailable" && <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
                  {(() => {
                    const start = (page - 1) * pageSize + 1
                    const end = Math.min(page * pageSize, total)
                    const showing = filteredProducts.length
                    return (
                      <>
                        Mostrando <strong>{start}-{end}</strong> de <strong>{total}</strong> productos
                        {showing !== (end - start + 1) && (
                          <span className="text-xs text-neutral-500 ml-2">
                            ({showing} visibles después de filtros)
                          </span>
                        )}
                      </>
                    )
                  })()}
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

                    // Usar slug si está disponible, de lo contrario usar ID como fallback
                    const productHref = productSlug ? `/producto/${productSlug}` : `/producto/${product.id}?id=${product.id}`;
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
                              // No requiere autenticación para agregar al carrito
                              // El carrito funciona sin cuenta (se guarda en localStorage)
                              // Solo se requiere autenticación al finalizar la compra (checkout)
                              
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
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // No requiere autenticación para agregar al carrito
                                // El carrito funciona sin cuenta (se guarda en localStorage)
                                // Solo se requiere autenticación al finalizar la compra (checkout)
                                
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
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                            >
                              AÑADIR AL CARRO
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (isInWishlist(product.id)) {
                                  removeFromWishlist(product.id)
                                  showToast("Producto eliminado de tu lista de deseos", "info")
                                } else {
                                  addToWishlist(product)
                                  showToast("Producto agregado a tu lista de deseos", "success")
                                }
                              }}
                              className={`p-2 rounded-lg border-2 transition-colors ${
                                isInWishlist(product.id)
                                  ? "bg-red-50 border-red-600 text-red-600"
                                  : "bg-white border-neutral-300 text-neutral-600 hover:border-red-600 hover:text-red-600"
                              }`}
                              aria-label={isInWishlist(product.id) ? "Eliminar de lista de deseos" : "Agregar a lista de deseos"}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {total > 0 && maxPage > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, page - 1)
                      setPage(newPage)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={page === 1}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors font-medium"
                  >
                    ← Anterior
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(maxPage, 7) }, (_, i) => {
                      let pageNum: number
                      if (maxPage <= 7) {
                        pageNum = i + 1
                      } else if (page <= 4) {
                        pageNum = i + 1
                      } else if (page >= maxPage - 3) {
                        pageNum = maxPage - 6 + i
                      } else {
                        pageNum = page - 3 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={`px-3 py-2 min-w-[40px] rounded-lg transition-colors font-medium ${
                            page === pageNum
                              ? "bg-orange-600 text-white"
                              : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => {
                      const newPage = Math.min(maxPage, page + 1)
                      setPage(newPage)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={page === maxPage}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors font-medium"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </main>
  );
}
