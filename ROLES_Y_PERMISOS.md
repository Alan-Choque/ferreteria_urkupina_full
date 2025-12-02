# Roles y Permisos del Sistema

## Roles Disponibles

### 1. ADMIN
**Acceso completo a todo el sistema**

**Módulos y permisos:**
- ✅ **Productos**: Crear, editar, eliminar, cambiar estado, listar
- ✅ **Inventario**: Ver, actualizar stock, registrar ingresos, transferencias, ajustes
- ✅ **Ventas**: Crear, editar, gestionar pagos, logística, reportes
- ✅ **Compras**: Crear, editar, recibir órdenes, reportes
- ✅ **Clientes**: Crear, editar, eliminar, listar
- ✅ **Proveedores**: Crear, editar, eliminar, listar
- ✅ **Promociones**: Crear, editar, activar/desactivar, historial
- ✅ **Reservaciones**: Crear, editar, gestionar, imprimir
- ✅ **Usuarios**: Crear, editar, eliminar, asignar roles
- ✅ **Reportes**: Ver todos los reportes, exportar
- ✅ **Configuración**: Acceso completo

---

### 2. VENTAS
**Acceso al módulo de ventas y clientes**

**Módulos y permisos:**
- ❌ **Productos**: Sin acceso (solo ADMIN puede gestionar productos)
- ❌ **Inventario**: Sin acceso (solo ADMIN, INVENTARIOS, SUPERVISOR)
- ✅ **Ventas**: Crear, editar, gestionar pagos, logística, reportes, imprimir
- ✅ **Clientes**: Ver, crear, editar (para gestionar clientes de ventas)
- ❌ **Compras**: Sin acceso
- ❌ **Proveedores**: Sin acceso
- ✅ **Promociones**: Ver, aplicar (para usar en ventas)
- ✅ **Reservaciones**: Ver, crear, gestionar (relacionadas con ventas)
- ❌ **Usuarios**: Sin acceso
- ✅ **Reportes**: Ver reportes de ventas (limitado)
- ❌ **Configuración**: Sin acceso

**Nota**: El rol VENTAS está diseñado para personal de ventas que necesita gestionar órdenes y clientes, pero no tiene acceso a gestión de productos o inventario.

---

### 3. INVENTARIOS
**Acceso a inventario y actualización de stock**

**Módulos y permisos:**
- ❌ **Productos**: Sin acceso (solo ADMIN puede gestionar productos)
- ✅ **Inventario**: 
  - Ver stock por almacén
  - Registrar ingresos de inventario
  - Realizar transferencias entre almacenes
  - Hacer ajustes y mermas
  - Exportar inventario
- ❌ **Ventas**: Sin acceso
- ❌ **Compras**: Sin acceso (aunque podría ver para coordinar recepciones)
- ❌ **Clientes**: Sin acceso
- ❌ **Proveedores**: Sin acceso
- ❌ **Promociones**: Sin acceso
- ❌ **Reservaciones**: Sin acceso
- ❌ **Usuarios**: Sin acceso
- ❌ **Reportes**: Sin acceso
- ❌ **Configuración**: Sin acceso

**Nota**: El rol INVENTARIOS puede actualizar stock (ingresos, transferencias, ajustes) pero NO puede crear, editar o eliminar productos. Solo ADMIN puede gestionar el catálogo de productos.

---

### 4. SUPERVISOR
**Solo consulta de inventario**

**Módulos y permisos:**
- ❌ **Productos**: Sin acceso
- ✅ **Inventario**: 
  - Ver stock por almacén (solo lectura)
  - Exportar inventario
  - ❌ NO puede actualizar stock
  - ❌ NO puede registrar ingresos
  - ❌ NO puede hacer transferencias
  - ❌ NO puede hacer ajustes
- ❌ **Ventas**: Sin acceso
- ❌ **Compras**: Sin acceso
- ❌ **Clientes**: Sin acceso
- ❌ **Proveedores**: Sin acceso
- ❌ **Promociones**: Sin acceso
- ❌ **Reservaciones**: Sin acceso
- ❌ **Usuarios**: Sin acceso
- ❌ **Reportes**: Sin acceso
- ❌ **Configuración**: Sin acceso

**Nota**: El rol SUPERVISOR es el más restrictivo, diseñado para supervisores que solo necesitan consultar el estado del inventario sin poder modificarlo.

---

## Resumen de Permisos por Módulo

| Módulo | ADMIN | VENTAS | INVENTARIOS | SUPERVISOR |
|--------|-------|--------|-------------|------------|
| **Productos** | ✅ Todo | ❌ | ❌ | ❌ |
| **Inventario (Ver)** | ✅ | ❌ | ✅ | ✅ |
| **Inventario (Actualizar)** | ✅ | ❌ | ✅ | ❌ |
| **Ventas** | ✅ Todo | ✅ Todo | ❌ | ❌ |
| **Compras** | ✅ Todo | ❌ | ❌ | ❌ |
| **Clientes** | ✅ Todo | ✅ Ver/Crear/Editar | ❌ | ❌ |
| **Proveedores** | ✅ Todo | ❌ | ❌ | ❌ |
| **Promociones** | ✅ Todo | ✅ Ver/Aplicar | ❌ | ❌ |
| **Reservaciones** | ✅ Todo | ✅ Ver/Crear/Gestionar | ❌ | ❌ |
| **Usuarios** | ✅ Todo | ❌ | ❌ | ❌ |
| **Reportes** | ✅ Todo | ✅ Limitado | ❌ | ❌ |
| **Configuración** | ✅ Todo | ❌ | ❌ | ❌ |

---

## Asignación de Roles a Usuarios Existentes

Para los usuarios que mencionaste:
- **admin.root** (admin@ferreteria.com) → **ADMIN** (acceso completo)
- **victor** (victor@gmail.com) → Asignar según necesidad (sugerencia: ADMIN o VENTAS)
- **jose** (jose@gmail.com) → Asignar según necesidad (sugerencia: INVENTARIOS o SUPERVISOR)

