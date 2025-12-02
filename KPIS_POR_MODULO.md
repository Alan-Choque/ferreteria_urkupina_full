# Estructura de KPIs por Módulo

## 📊 Estrategia de KPIs

### Dashboard Principal (`/admin`)
**KPIs Generales del Negocio:**
- Ventas Totales (30 días)
- Órdenes Pendientes
- Ticket Promedio
- Stock Bajo
- Total de Órdenes
- Clientes Activos (30 días)
- Tasa de Conversión
- Pipeline Total

---

## 🎯 KPIs por Módulo

### 1. **Módulo de Ventas** (`/admin/sales`)
**KPIs Específicos de Ventas:**
- ✅ **Ventas del Mes** - Total de ventas del mes actual
- ✅ **Órdenes Pendientes** - Órdenes que requieren pago
- ✅ **Órdenes Pagadas** - Órdenes con pago confirmado
- ✅ **Órdenes Entregadas** - Órdenes completadas
- ✅ **Ticket Promedio** - Valor promedio por orden
- ✅ **Tasa de Conversión** - % de órdenes pagadas vs. total
- ✅ **Ingresos del Mes** - Total de ingresos del mes
- ✅ **Órdenes por Estado** - Distribución de estados

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 2. **Módulo de Productos** (`/admin/products`)
**KPIs Específicos de Productos:**
- ✅ **Total de Productos** - Cantidad total en catálogo
- ✅ **Productos Activos** - Productos disponibles para venta
- ✅ **Productos Inactivos** - Productos pausados
- ✅ **Productos con Stock Bajo** - Productos que requieren reposición
- ✅ **Total de Variantes** - Variantes disponibles
- ✅ **Productos con Imágenes** - % de productos con imágenes
- ✅ **Productos por Categoría** - Distribución por categoría
- ✅ **Productos por Estado** - Distribución por estado

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 3. **Módulo de Clientes** (`/admin/customers`)
**KPIs Específicos de Clientes:**
- ✅ **Total de Clientes** - Clientes registrados
- ✅ **Clientes Activos (30 días)** - Clientes con compras recientes
- ✅ **Clientes Nuevos (30 días)** - Clientes registrados este mes
- ✅ **Clientes con Email** - % de clientes con email
- ✅ **Clientes con Teléfono** - % de clientes con teléfono
- ✅ **Clientes sin Contacto** - Clientes sin email ni teléfono
- ✅ **Crecimiento de Clientes** - % de crecimiento mensual
- ✅ **Clientes por Mes** - Tendencia de registro

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 4. **Módulo de Inventario** (`/admin/inventory`)
**KPIs Específicos de Inventario:**
- ✅ **Valor Total del Inventario** - Valor total del stock
- ✅ **Productos con Stock Bajo** - Productos bajo umbral
- ✅ **Productos sin Stock** - Productos agotados
- ✅ **Rotación de Inventario** - Tasa de rotación
- ✅ **Ingresos del Mes** - Productos ingresados este mes
- ✅ **Transferencias Pendientes** - Transferencias en proceso
- ✅ **Ajustes del Mes** - Ajustes realizados
- ✅ **Stock por Almacén** - Distribución por almacén

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 5. **Módulo de Compras** (`/admin/purchases`)
**KPIs Específicos de Compras:**
- ✅ **Órdenes de Compra** - Total de órdenes
- ✅ **Órdenes Pendientes** - Órdenes en borrador/enviadas
- ✅ **Órdenes Recibidas** - Órdenes completadas
- ✅ **Valor Total de Compras** - Total gastado
- ✅ **Ticket Promedio de Compra** - Valor promedio por orden
- ✅ **Proveedores Activos** - Proveedores con órdenes
- ✅ **Compras del Mes** - Compras realizadas este mes
- ✅ **Órdenes por Estado** - Distribución por estado

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 6. **Módulo de Proveedores** (`/admin/suppliers`)
**KPIs Específicos de Proveedores:**
- ✅ **Total de Proveedores** - Proveedores registrados
- ✅ **Proveedores Activos** - Proveedores con órdenes recientes
- ✅ **Proveedores con Email** - % con email
- ✅ **Proveedores con Teléfono** - % con teléfono
- ✅ **Proveedores Nuevos (30 días)** - Proveedores nuevos
- ✅ **Órdenes por Proveedor** - Distribución de órdenes
- ✅ **Valor Total de Compras** - Total comprado a proveedores
- ✅ **Proveedores por Mes** - Tendencia de registro

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 7. **Módulo de Usuarios** (`/admin/users`)
**KPIs Específicos de Usuarios:**
- ✅ **Total de Usuarios** - Usuarios del sistema
- ✅ **Usuarios Activos** - Usuarios activos
- ✅ **Usuarios por Rol** - Distribución por rol (ADMIN, VENTAS, etc.)
- ✅ **Usuarios Nuevos (30 días)** - Usuarios nuevos
- ✅ **Usuarios Inactivos** - Usuarios desactivados
- ✅ **Usuarios por Mes** - Tendencia de registro
- ✅ **Tasa de Actividad** - % de usuarios activos
- ✅ **Distribución por Rol** - Gráfico de roles

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

### 8. **Módulo de Reportes** (`/admin/reports`)
**KPIs Específicos de Reportes:**
- ✅ **Ventas Mensuales** - Ventas últimos 30 días
- ✅ **Órdenes Pendientes** - Órdenes por completar
- ✅ **Productos con Stock Bajo** - Productos bajo umbral
- ✅ **Clientes Activos** - Clientes últimos 30 días
- ✅ **Top Productos** - Productos más vendidos
- ✅ **Ventas por Categoría** - Distribución por categoría
- ✅ **Tendencia de Ventas** - Gráfico de tendencia
- ✅ **Comparación de Períodos** - Mes actual vs. anterior

**Ubicación:** Dashboard del módulo (cuando `selectedAction === null`)

---

## 🎨 Componente Reutilizable

He creado un componente `KPICard` que se puede usar en todos los módulos:

```tsx
import { KPICard } from "@/components/admin/KPICard"
import { TrendingUp, Package, Users } from "lucide-react"

// Ejemplo de uso:
<KPICard
  title="Ventas del Mes"
  value={formatCurrency(15000)}
  subtitle="Últimos 30 días"
  icon={TrendingUp}
  change={{ value: 12.5, label: "vs. mes anterior" }}
  color="success"
  delay={0.2}
/>
```

**Props del componente:**
- `title`: Título del KPI
- `value`: Valor principal (string o number)
- `subtitle`: Subtítulo opcional
- `icon`: Icono de Lucide React
- `change`: Objeto con `value` (número) y `label` opcional
- `color`: "primary" | "success" | "warning" | "danger" | "info"
- `delay`: Delay para animación (segundos)

---

## 📋 Implementación Recomendada

1. **Dashboard Principal**: KPIs generales del negocio (ya implementado)
2. **Cada Módulo**: KPIs específicos del módulo usando el componente `KPICard`
3. **Consistencia Visual**: Todos los KPIs usan el mismo diseño y colores
4. **Datos Reales**: Todos los KPIs usan datos reales de la base de datos o mock data

---

## ✅ Ventajas de esta Estructura

- ✅ **Consistencia**: Mismo diseño en todos los módulos
- ✅ **Reutilizable**: Componente único para todos los KPIs
- ✅ **Específico**: Cada módulo muestra métricas relevantes
- ✅ **Escalable**: Fácil agregar nuevos KPIs
- ✅ **Mantenible**: Cambios en un lugar afectan todos los módulos

