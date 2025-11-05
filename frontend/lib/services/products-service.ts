// lib/services/products-service.ts
import { api } from "@/lib/apiClient";

// Tipos basados en el backend FastAPI
// TODO: Generar desde OpenAPI con: npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts

export interface ProductListItem {
  id: number;
  sku?: string | null;
  nombre: string; // Backend devuelve 'nombre', no 'name'
  slug: string;
  image?: string | null;
  short?: string | null;
  price?: number | null;
  status: string;
  descripcion?: string | null;
  marca?: { id: number; nombre: string } | null;
  categoria?: { id: number; nombre: string } | null;
  variantes?: Array<{
    id: number;
    nombre?: string | null;
    precio?: number | null;
    unidad_medida_nombre?: string | null;
  }>;
  imagenes?: Array<{
    id: number;
    url: string;
    descripcion?: string | null;
  }>;
  // Helper: name para compatibilidad con UI
  name?: string;
}

export interface ProductDetail extends ProductListItem {
  descripcion?: string | null;
  // Campos adicionales del detalle
}

export interface ProductListResponse {
  items: ProductListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface ProductVariant {
  id: number;
  nombre?: string | null;
  precio?: number | null;
  unidad_medida_nombre?: string | null;
}

export interface StockResponse {
  variante_id: number;
  cantidad_disponible: number;
  almacen_id: number;
  almacen_nombre: string;
}

export const productsService = {
  // Listado público (usa /api/v1/products)
  async listProducts(params?: {
    q?: string;
    brand_id?: number;
    category_id?: number;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const path = `/products${queryString ? `?${queryString}` : ""}`;
    return api.get<ProductListResponse>(path);
  },

  // Detalle por slug (usa /api/v1/products/{slug})
  async getProductBySlug(slug: string): Promise<ProductDetail> {
    return api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  },

  // Detalle por ID (temporal, para migración)
  async getProductById(id: string | number): Promise<ProductDetail> {
    return api.get<ProductDetail>(`/products/by-id/${id}`);
  },

  // Variantes por slug
  async listVariantsBySlug(slug: string): Promise<ProductVariant[]> {
    return api.get<ProductVariant[]>(`/products/${encodeURIComponent(slug)}/variants`);
  },

  // Stock por variante
  async getStockByVariant(variantId: number | string): Promise<StockResponse[]> {
    return api.get<StockResponse[]>(`/inventory/stock/${variantId}`);
  },

  // ====== Métodos Admin (aún no implementados) ======
  async createProduct() {
    throw new Error("Admin API no implementada aún");
  },
  async updateProduct() {
    throw new Error("Admin API no implementada aún");
  },
  async deleteProduct() {
    throw new Error("Admin API no implementada aún");
  },
  async createVariant() {
    throw new Error("Admin API no implementada aún");
  },
  async deleteVariant() {
    throw new Error("Admin API no implementada aún");
  },
  async listBrands() {
    return [];
  },
  async listCategories() {
    return [];
  },
};
