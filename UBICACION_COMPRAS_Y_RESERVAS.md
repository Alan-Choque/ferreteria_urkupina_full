# Ubicación de Archivos - Compras y Reservas

## 📦 COMPRAS (PURCHASES)

### Backend

#### Modelos (Models)
- **`backend/app/models/compra.py`** - Modelo ORM de `OrdenCompra` e `ItemOrdenCompra`

#### API Endpoints
- **`backend/app/api/v1/purchases.py`** - Endpoints REST para gestión de órdenes de compra
  - `GET /purchases` - Listar órdenes de compra
  - `GET /purchases/{id}` - Obtener orden por ID
  - `POST /purchases` - Crear nueva orden
  - `PUT /purchases/{id}` - Actualizar orden
  - `POST /purchases/{id}/send` - Enviar orden a proveedor
  - `POST /purchases/{id}/confirm` - Confirmar orden
  - `POST /purchases/{id}/reject` - Rechazar orden
  - `POST /purchases/{id}/receive` - Registrar recepción
  - `POST /purchases/{id}/invoice` - Asociar factura
  - `POST /purchases/{id}/close` - Cerrar orden

#### Servicios (Services)
- **`backend/app/services/purchase_service.py`** - Lógica de negocio para órdenes de compra

#### Repositorios (Repositories)
- **`backend/app/repositories/purchase_repo.py`** - Acceso a datos de órdenes de compra

#### Schemas (Pydantic)
- **`backend/app/schemas/purchase.py`** - Schemas para requests/responses de órdenes de compra
- **`backend/app/schemas/purchase_status.py`** - Schemas para cambios de estado de órdenes

#### Migraciones (Migrations)
- **`backend/alembic/versions/005_add_purchase_order_fields.py`** - Agrega campos de gestión de compras
- **`backend/alembic/versions/006_migrate_purchase_order_statuses.py`** - Migra estados antiguos a nuevos

#### Documentación
- **`backend/FLUJO_GESTION_COMPRAS.md`** - Documentación del flujo de gestión de compras

### Frontend

#### Páginas Principales
- **`frontend/app/admin/purchases/page.tsx`** - Página principal de gestión de compras
  - Dashboard con métricas
  - Lista de órdenes de compra
  - Crear nueva orden
  - Reportes

#### Páginas Secundarias
- **`frontend/app/admin/purchases/create/page.tsx`** - Página para crear nueva orden de compra
- **`frontend/app/admin/purchases/[id]/edit/page.tsx`** - Página para editar orden de compra (solo en estado BORRADOR)
- **`frontend/app/admin/purchases/receiving/page.tsx`** - Página para gestionar recepciones
- **`frontend/app/admin/purchases/reports/page.tsx`** - Página de reportes de compras

#### Servicios (Services)
- **`frontend/lib/services/purchases-service.ts`** - Servicio para llamadas API de compras

#### Tipos (Types)
- **`frontend/lib/types/admin.ts`** - Tipos TypeScript para órdenes de compra

---

## 📅 RESERVAS (RESERVATIONS)

### Backend

#### Modelos (Models)
- **`backend/app/models/reserva.py`** - Modelo ORM de `Reserva` e `ItemReserva`

#### API Endpoints
- **`backend/app/api/v1/reservations.py`** - Endpoints REST para gestión de reservas
  - `GET /reservations` - Listar reservas (admin)
  - `GET /reservations/my-reservations` - Listar reservas del usuario autenticado
  - `GET /reservations/{id}` - Obtener reserva por ID
  - `GET /reservations/availability/{variante_producto_id}` - Consultar disponibilidad
  - `POST /reservations` - Crear nueva reserva
  - `POST /reservations/{id}/cancel` - Cancelar reserva
  - `POST /reservations/{id}/deposit` - Procesar anticipo
  - `POST /reservations/{id}/confirm` - Enviar confirmación/recordatorio
  - `POST /reservations/{id}/complete` - Completar reserva (convertir a orden de venta)

#### Servicios (Services)
- **`backend/app/services/reservation_service.py`** - Lógica de negocio para reservas

#### Repositorios (Repositories)
- **`backend/app/repositories/reservation_repo.py`** - Acceso a datos de reservas

#### Schemas (Pydantic)
- **`backend/app/schemas/reservation.py`** - Schemas para requests/responses de reservas
- **`backend/app/schemas/reservation_status.py`** - Schemas para cambios de estado de reservas

#### Migraciones (Migrations)
- **`backend/alembic/versions/007_add_reservation_fields.py`** - Agrega campos de gestión de reservas

### Frontend

#### Páginas Principales
- **`frontend/app/admin/reservations/page.tsx`** - Página principal de gestión de reservas
  - Dashboard con métricas
  - Lista de reservas
  - Crear nueva reserva
  - Acciones: procesar anticipo, enviar confirmación, completar, cancelar

#### Páginas Secundarias
- **`frontend/app/admin/reservations/create/page.tsx`** - Página para crear nueva reserva
- **`frontend/app/admin/reservations/pickups/page.tsx`** - Página para gestionar recogidas
- **`frontend/app/admin/reservations/reports/page.tsx`** - Página de reportes de reservas

#### Páginas de Usuario
- **`frontend/app/account/reservations/page.tsx`** - Página para que los clientes vean sus propias reservas

#### Servicios (Services)
- **`frontend/lib/services/reservations-service.ts`** - Servicio para llamadas API de reservas

#### Tipos (Types)
- **`frontend/lib/types/admin.ts`** - Tipos TypeScript para reservas

---

## 📋 Resumen de Rutas API

### Compras
- Base: `/api/v1/purchases`
- Ejemplos:
  - `GET /api/v1/purchases` - Listar todas las órdenes
  - `POST /api/v1/purchases` - Crear orden
  - `POST /api/v1/purchases/{id}/send` - Enviar orden

### Reservas
- Base: `/api/v1/reservations`
- Ejemplos:
  - `GET /api/v1/reservations` - Listar todas las reservas (admin)
  - `GET /api/v1/reservations/my-reservations` - Mis reservas (cliente)
  - `POST /api/v1/reservations` - Crear reserva
  - `POST /api/v1/reservations/{id}/complete` - Completar reserva

---

## 📁 Estructura de Carpetas

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── purchases.py          # Endpoints de compras
│   │   └── reservations.py      # Endpoints de reservas
│   ├── models/
│   │   ├── compra.py             # Modelo OrdenCompra
│   │   └── reserva.py            # Modelo Reserva
│   ├── services/
│   │   ├── purchase_service.py   # Lógica de compras
│   │   └── reservation_service.py # Lógica de reservas
│   ├── repositories/
│   │   ├── purchase_repo.py      # Repositorio de compras
│   │   └── reservation_repo.py   # Repositorio de reservas
│   └── schemas/
│       ├── purchase.py            # Schemas de compras
│       ├── purchase_status.py     # Schemas de estado de compras
│       ├── reservation.py         # Schemas de reservas
│       └── reservation_status.py  # Schemas de estado de reservas
└── alembic/versions/
    ├── 005_add_purchase_order_fields.py
    ├── 006_migrate_purchase_order_statuses.py
    └── 007_add_reservation_fields.py

frontend/
├── app/admin/
│   ├── purchases/
│   │   ├── page.tsx               # Página principal
│   │   ├── create/page.tsx        # Crear orden
│   │   ├── [id]/edit/page.tsx     # Editar orden
│   │   ├── receiving/page.tsx     # Recepciones
│   │   └── reports/page.tsx       # Reportes
│   └── reservations/
│       ├── page.tsx                # Página principal
│       ├── create/page.tsx        # Crear reserva
│       ├── pickups/page.tsx       # Recogidas
│       └── reports/page.tsx       # Reportes
├── app/account/
│   └── reservations/page.tsx      # Mis reservas (cliente)
└── lib/
    ├── services/
    │   ├── purchases-service.ts   # Servicio de compras
    │   └── reservations-service.ts # Servicio de reservas
    └── types/
        └── admin.ts                # Tipos TypeScript
```

---

## 🔗 Archivos Relacionados

### Registro en Router Principal
- **`backend/app/api/v1/routes.py`** - Registra los routers de `purchases` y `reservations`

### Modelos Relacionados
- **`backend/app/models/venta.py`** - OrdenVenta (relacionada con reservas completadas)
- **`backend/app/models/cliente.py`** - Cliente (relacionado con reservas y órdenes)
- **`backend/app/models/proveedor.py`** - Proveedor (relacionado con órdenes de compra)
- **`backend/app/models/producto_almacen.py`** - ProductoAlmacen (stock afectado por reservas y compras)

