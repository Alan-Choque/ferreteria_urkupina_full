import { api } from "@/lib/apiClient"

export interface MediaFile {
  id: string
  filename: string
  mime: string
  size: number
  dimensions?: { width: number; height: number }
  type: "image" | "pdf" | "doc" | "video" | "other"
  createdAt: Date
  tags: string[]
  usedIn: Array<{ type: string; id: string; title: string }>
  publicUrl: string
  previewUrl: string
  alt?: string
}

export interface FileListParams {
  productoId?: number
  search?: string
  page?: number
  limit?: number
}

export interface FileListResult {
  files: MediaFile[]
  total: number
  page: number
  limit: number
}

type FileAssetResponse = {
  id: number
  producto_id: number
  url: string
  descripcion?: string | null
  fecha_creacion: string
}

type FileAssetListResponse = {
  items: FileAssetResponse[]
  total: number
  page: number
  page_size: number
}

function guessMimeFromUrl(url: string): string {
  const extension = url.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    default:
      return "application/octet-stream"
  }
}

function toMediaFile(asset: FileAssetResponse): MediaFile {
  const mime = guessMimeFromUrl(asset.url)
  const type = mime.startsWith("image/") ? "image" : "other"
  const filename = asset.url.split("/").pop() || `asset-${asset.id}`

  return {
    id: asset.id.toString(),
    filename,
    mime,
    size: 0,
    type,
    createdAt: new Date(asset.fecha_creacion),
    tags: [],
    usedIn: [],
    publicUrl: asset.url,
    previewUrl: asset.url,
    alt: asset.descripcion ?? undefined,
  }
}

export const filesService = {
  async list(params: FileListParams = {}): Promise<FileListResult> {
    const searchParams = new URLSearchParams()
    if (params.productoId) searchParams.set("producto_id", String(params.productoId))
    if (params.search) searchParams.set("search", params.search)
    if (params.page) searchParams.set("page", String(params.page))
    if (params.limit) searchParams.set("page_size", String(params.limit))

    const query = searchParams.toString()
    const response = await api.get<FileAssetListResponse>(`/files${query ? `?${query}` : ""}`, {
      requireAuth: false,
    })

    return {
      files: response.items.map(toMediaFile),
      total: response.total,
      page: response.page,
      limit: response.page_size,
    }
  },

  async get(id: string): Promise<MediaFile> {
    const response = await api.get<FileAssetResponse>(`/files/${id}`, { requireAuth: false })
    return toMediaFile(response)
  },

  async upload(_files: File[]): Promise<MediaFile[]> {
    throw new Error("La carga de archivos aún no está disponible desde el frontend")
  },

  async remove(_ids: string[]): Promise<void> {
    throw new Error("El borrado de archivos no está implementado todavía")
  },

  async updateMeta(id: string, meta: { alt?: string; tags?: string[] }): Promise<MediaFile> {
    // No existe endpoint específico, por lo que devolvemos el archivo actual
    const file = await this.get(id)
    if (meta.alt) file.alt = meta.alt
    if (meta.tags) file.tags = meta.tags
    return file
  },
}
