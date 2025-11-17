// lib/services/products-service.ts
import { api } from "@/lib/apiClient";

// Tipos basados en el backend FastAPI
// TODO: Generar desde OpenAPI con: npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts

export interface ProductListItem {
  id: number;
  sku?: string | null;
  nombre: string;
  slug: string;
  image?: string | null;
  short?: string | null;
  price?: number | null;
  status: string;
  descripcion?: string | null;
  marca?: { id: number; nombre: string; descripcion?: string | null } | null;
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
  name?: string;
}

export interface ProductDetail extends ProductListItem {
  descripcion?: string | null;
}

export interface ProductListResponse {
  items: ProductListItem[];
  page: number;
  page_size: number;
  total: number;
}

export interface ProductVariantInput {
  id?: number;
  nombre?: string | null;
  unidad_medida_id: number;
  precio?: number | null;
  delete?: boolean;
}

export interface ProductImageInput {
  id?: number;
  url: string;
  descripcion?: string | null;
  delete?: boolean;
}

export interface ProductCreatePayload {
  nombre: string;
  descripcion?: string | null;
  categoria_id?: number | null;
  marca_id?: number | null;
  status?: "ACTIVE" | "INACTIVE";
  variantes: ProductVariantInput[];
  imagenes?: ProductImageInput[];
}

export interface ProductUpdatePayload {
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: number | null;
  marca_id?: number | null;
  status?: "ACTIVE" | "INACTIVE";
  variantes?: ProductVariantInput[];
  imagenes?: ProductImageInput[];
}

export interface ProductStatusPayload {
  status: "ACTIVE" | "INACTIVE";
}

export interface ProductMetaResponse {
  marcas: Array<{ id: number; nombre: string; descripcion?: string | null }>;
  categorias: Array<{ id: number; nombre: string }>;
  unidades: Array<{ id: number; nombre: string; simbolo?: string | null }>;
}

export const productsService = {
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

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    return api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  },

  async getProductById(id: string | number): Promise<ProductDetail> {
    const detail = await api.get<ProductDetail>(`/products/by-id/${id}`);
    return { ...detail, name: detail.nombre };
  },

  async listVariantsBySlug(slug: string): Promise<ProductVariant[]> {
    return api.get<ProductVariant[]>(`/products/${encodeURIComponent(slug)}/variants`);
  },

  async getStockByVariant(variantId: number | string): Promise<StockResponse[]> {
    return api.get<StockResponse[]>(`/inventory/stock/${variantId}`);
  },

  // Admin endpoints
  async adminListProducts(params?: {
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
    const path = `/admin/products${queryString ? `?${queryString}` : ""}`;
    return api.get<ProductListResponse>(path);
  },

  async fetchMeta(): Promise<ProductMetaResponse> {
    return api.get<ProductMetaResponse>(`/admin/products/meta`);
  },

  async createProduct(payload: ProductCreatePayload): Promise<ProductDetail> {
    return api.post<ProductDetail>(`/admin/products`, payload);
  },

  async adminGetProduct(productId: number): Promise<ProductDetail> {
    return api.get<ProductDetail>(`/admin/products/${productId}`);
  },

  async updateProduct(productId: number, payload: ProductUpdatePayload): Promise<ProductDetail> {
    return api.put<ProductDetail>(`/admin/products/${productId}`, payload);
  },

  async updateProductStatus(productId: number, payload: ProductStatusPayload): Promise<ProductDetail> {
    return api.patch<ProductDetail>(`/admin/products/${productId}/status`, payload);
  },
};

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
