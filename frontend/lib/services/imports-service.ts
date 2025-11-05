export interface ImportResult {
  success: boolean
  totalRows: number
  importedCount: number
  skippedCount: number
  errors: RowIssue[]
  warnings: RowIssue[]
  timestamp: Date
}

export interface RowIssue {
  rowNumber: number
  field: string
  message: string
  value?: string
}

export interface ImportConfig {
  entityType: "products" | "customers" | "suppliers"
  columns: Record<string, string> // CSV column -> field mapping
  dryRun: boolean
}

class ImportsService {
  async parseCSV(content: string): Promise<Record<string, unknown>[]> {
    const lines = content.trim().split("\n")
    if (lines.length < 2) throw new Error("CSV vacío")

    const headers = lines[0].split(",").map((h) => h.trim())
    const rows: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      rows.push(row)
    }

    return rows
  }

  async validate(rows: Record<string, unknown>[], config: ImportConfig): Promise<ImportResult> {
    const errors: RowIssue[] = []
    const warnings: RowIssue[] = []
    let importedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      switch (config.entityType) {
        case "products":
          this.validateProductRow(row, rowNum, errors, warnings)
          break
        case "customers":
          this.validateCustomerRow(row, rowNum, errors, warnings)
          break
        case "suppliers":
          this.validateSupplierRow(row, rowNum, errors, warnings)
          break
      }

      if (!errors.some((e) => e.rowNumber === rowNum)) {
        importedCount++
      }
    }

    return {
      success: errors.length === 0,
      totalRows: rows.length,
      importedCount,
      skippedCount: rows.length - importedCount,
      errors,
      warnings,
      timestamp: new Date(),
    }
  }

  private validateProductRow(row: Record<string, unknown>, rowNum: number, errors: RowIssue[], warnings: RowIssue[]) {
    if (!row.sku) {
      errors.push({
        rowNumber: rowNum,
        field: "sku",
        message: "SKU es requerido",
      })
    }

    if (!row.nombre) {
      errors.push({
        rowNumber: rowNum,
        field: "nombre",
        message: "Nombre es requerido",
      })
    }

    if (row.precio && isNaN(Number(row.precio))) {
      errors.push({
        rowNumber: rowNum,
        field: "precio",
        message: "Precio debe ser un número válido",
        value: String(row.precio),
      })
    }
  }

  private validateCustomerRow(row: Record<string, unknown>, rowNum: number, errors: RowIssue[], warnings: RowIssue[]) {
    if (!row.email) {
      errors.push({
        rowNumber: rowNum,
        field: "email",
        message: "Email es requerido",
      })
    } else if (!this.isValidEmail(String(row.email))) {
      errors.push({
        rowNumber: rowNum,
        field: "email",
        message: "Email no es válido",
        value: String(row.email),
      })
    }

    if (!row.nombre) {
      errors.push({
        rowNumber: rowNum,
        field: "nombre",
        message: "Nombre es requerido",
      })
    }
  }

  private validateSupplierRow(row: Record<string, unknown>, rowNum: number, errors: RowIssue[], warnings: RowIssue[]) {
    if (!row.nombre) {
      errors.push({
        rowNumber: rowNum,
        field: "nombre",
        message: "Nombre es requerido",
      })
    }

    if (!row.contacto_email) {
      warnings.push({
        rowNumber: rowNum,
        field: "contacto_email",
        message: "Se recomienda agregar email de contacto",
      })
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  getTemplate(entityType: string): string {
    const templates: Record<string, string> = {
      products: "sku,nombre,descripcion,precio,categoria,marca,stock\n",
      customers: "email,nombre,apellidos,telefono,ciudad,pais\n",
      suppliers: "nombre,contacto,contacto_email,telefono,ciudad,pais\n",
    }

    return templates[entityType] || ""
  }
}

export const importsService = new ImportsService()
