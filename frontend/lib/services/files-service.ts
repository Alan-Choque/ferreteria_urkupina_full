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
  query?: string
  type?: string
  tag?: string
  page?: number
  limit?: number
}

export interface FileListResult {
  files: MediaFile[]
  total: number
  page: number
  limit: number
}

class FilesService {
  private files: Map<string, MediaFile> = new Map()
  private mockData: MediaFile[] = [
    {
      id: "1",
      filename: "product-hammer.jpg",
      mime: "image/jpeg",
      size: 245000,
      dimensions: { width: 1200, height: 800 },
      type: "image",
      createdAt: new Date("2025-01-15"),
      tags: ["products", "tools"],
      usedIn: [{ type: "product", id: "101", title: "Martillo de Construcción" }],
      publicUrl: "/claw-hammer.png",
      previewUrl: "/claw-hammer.png",
      alt: "Martillo de construcción profesional",
    },
    {
      id: "2",
      filename: "invoice-2025-01.pdf",
      mime: "application/pdf",
      size: 512000,
      type: "pdf",
      createdAt: new Date("2025-01-10"),
      tags: ["purchases", "invoices"],
      usedIn: [{ type: "purchase", id: "PO-001", title: "Compra Enero 2025" }],
      publicUrl: "/pdf-icon.svg",
      previewUrl: "/pdf-placeholder.svg",
    },
  ]

  constructor() {
    this.mockData.forEach((file) => this.files.set(file.id, file))
  }

  async list(params: FileListParams): Promise<FileListResult> {
    await this.simulateLatency(300)

    let filtered = Array.from(this.files.values())

    if (params.query) {
      filtered = filtered.filter((f) => f.filename.toLowerCase().includes(params.query!.toLowerCase()))
    }

    if (params.type) {
      filtered = filtered.filter((f) => f.type === params.type)
    }

    if (params.tag) {
      filtered = filtered.filter((f) => f.tags.includes(params.tag!))
    }

    const page = params.page || 1
    const limit = params.limit || 20
    const start = (page - 1) * limit

    return {
      files: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  async upload(files: File[]): Promise<MediaFile[]> {
    await this.simulateLatency(500)
    const uploaded: MediaFile[] = []

    for (const file of files) {
      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        mime: file.type,
        size: file.size,
        type: this.getFileType(file.type),
        createdAt: new Date(),
        tags: [],
        usedIn: [],
        publicUrl: URL.createObjectURL(file),
        previewUrl: URL.createObjectURL(file),
      }

      if (file.type.startsWith("image/")) {
        mediaFile.dimensions = await this.getImageDimensions(file)
      }

      this.files.set(mediaFile.id, mediaFile)
      uploaded.push(mediaFile)
    }

    return uploaded
  }

  async remove(ids: string[]): Promise<void> {
    await this.simulateLatency(200)
    ids.forEach((id) => this.files.delete(id))
  }

  async updateMeta(id: string, meta: { alt?: string; tags?: string[] }): Promise<MediaFile> {
    await this.simulateLatency(200)
    const file = this.files.get(id)
    if (!file) throw new Error("File not found")

    if (meta.alt) file.alt = meta.alt
    if (meta.tags) file.tags = meta.tags

    return file
  }

  async get(id: string): Promise<MediaFile> {
    await this.simulateLatency(100)
    const file = this.files.get(id)
    if (!file) throw new Error("File not found")
    return file
  }

  private getFileType(mime: string): "image" | "pdf" | "doc" | "video" | "other" {
    if (mime.startsWith("image/")) return "image"
    if (mime === "application/pdf") return "pdf"
    if (mime.includes("word") || mime.includes("document")) return "doc"
    if (mime.startsWith("video/")) return "video"
    return "other"
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const filesService = new FilesService()
