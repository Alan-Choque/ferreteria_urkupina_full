# Estructura Completa del Backend - Ferretería Urkupina

## 📁 Arquitectura General

El backend sigue una **arquitectura en capas** (3 capas):

```
Frontend → API Endpoints → Services → Repositories → Database
```

---

## 🗂️ Estructura de Directorios

```
backend/app/
├── api/v1/          # Endpoints REST (rutas HTTP)
├── services/         # Lógica de negocio
├── repositories/     # Acceso a datos (ORM)
├── models/           # Modelos de base de datos (SQLAlchemy)
├── schemas/          # Validación de datos (Pydantic)
├── core/             # Configuración y utilidades
└── db/               # Configuración de base de datos
```

---

## 🔐 1. ALTA DE USUARIOS

### Endpoint (Ruta HTTP)
**Archivo**: `backend/app/api/v1/users.py`
- **Línea 93-99**: `POST /api/v1/users`
- **Función**: `create_user()`
- **Permisos**: Requiere rol ADMIN

```python
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_user(payload)
```

### Servicio (Lógica de Negocio)
**Archivo**: `backend/app/services/user_service.py`
- **Línea 214-230**: `create_user()`
- **Qué hace**:
  - Valida los datos
  - Llama al repositorio para crear el usuario
  - Maneja errores (usuario duplicado, etc.)
  - Retorna el usuario creado

```python
def create_user(self, payload: UserCreateRequest) -> UserResponse:
    try:
        user = self._repo.create(
            nombre_usuario=payload.username,
            correo=payload.email,
            password=payload.password,
            activo=payload.activo,
            roles=payload.role_ids,
        )
    except IntegrityError:
        raise HTTPException(...)
    return self._map_user_response(user)
```

### Repositorio (Acceso a Datos)
**Archivo**: `backend/app/repositories/user_repo.py`
- **Línea ~100-150**: `create()`
- **Qué hace**:
  - Crea el objeto `Usuario` en la base de datos
  - Asigna roles
  - Guarda en la BD

### Modelo (Base de Datos)
**Archivo**: `backend/app/models/usuario.py`
- **Línea 27-45**: Clase `Usuario`
- **Tabla**: `dbo.usuarios`

### Schema (Validación)
**Archivo**: `backend/app/schemas/user.py`
- **Línea 39-49**: `UserCreateRequest`
- **Valida**: username, email, password, activo, role_ids

---

## 👥 2. ALTA DE CLIENTES

### Endpoint
**Archivo**: `backend/app/api/v1/customers.py`
- **Línea 43-49**: `POST /api/v1/customers`
- **Función**: `create_customer()`
- **Permisos**: Requiere rol ADMIN

```python
@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreateRequest,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_customer(payload)
```

### Servicio
**Archivo**: `backend/app/services/customer_service.py`
- **Línea 44-46**: `create_customer()`

```python
def create_customer(self, payload: CustomerCreateRequest) -> CustomerResponse:
    customer = self._repo.create(payload.model_dump())
    return CustomerResponse.model_validate(customer)
```

### Repositorio
**Archivo**: `backend/app/repositories/customer_repo.py`
- **Función**: `create()`
- **Tabla**: `dbo.clientes`

### Modelo
**Archivo**: `backend/app/models/cliente.py`
- **Clase**: `Cliente`

### Schema
**Archivo**: `backend/app/schemas/customer.py`
- **Clase**: `CustomerCreateRequest`

---

## 📦 3. ALTA DE PRODUCTOS

### Endpoint
**Archivo**: `backend/app/api/v1/admin/products.py`
- **Línea ~50-70**: `POST /api/v1/admin/products`
- **Función**: `create_product()`
- **Permisos**: Requiere permisos de gestión de productos

```python
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreateRequest,
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_product_management()),
):
    return service.create_product(payload)
```

### Servicio
**Archivo**: `backend/app/services/product_service.py`
- **Función**: `create_product()`
- **Qué hace**:
  - Crea el producto
  - Crea las variantes
  - Crea las imágenes
  - Asocia categoría y marca

### Repositorio
**Archivo**: `backend/app/repositories/product_repo.py`
- **Función**: `create()`
- **Tablas**: `dbo.productos`, `dbo.variantes_producto`, `dbo.imagenes_producto`

### Modelo
**Archivo**: `backend/app/models/producto.py`
- **Clase**: `Producto`

### Schema
**Archivo**: `backend/app/schemas/product.py`
- **Clase**: `ProductCreateRequest`

---

## 🏢 4. ALTA DE PROVEEDORES

### Endpoint
**Archivo**: `backend/app/api/v1/suppliers.py`
- **Función**: `create_supplier()`
- **Ruta**: `POST /api/v1/suppliers`

### Servicio
**Archivo**: `backend/app/services/supplier_service.py`
- **Función**: `create_supplier()`

### Repositorio
**Archivo**: `backend/app/repositories/supplier_repo.py`
- **Tabla**: `dbo.proveedores`

### Modelo
**Archivo**: `backend/app/models/proveedor.py`
- **Clase**: `Proveedor`

---

## 🛒 5. REGISTRO DE VENTAS (Órdenes de Venta)

### Endpoint
**Archivo**: `backend/app/api/v1/sales.py`
- **Función**: `create_sale()` o `create_order()`
- **Ruta**: `POST /api/v1/sales`

### Servicio
**Archivo**: `backend/app/services/sale_service.py`
- **Función**: `create_sale()`
- **Qué hace**:
  - Crea la orden de venta
  - Crea los items de la orden
  - Actualiza el stock

### Repositorio
**Archivo**: `backend/app/repositories/sale_repo.py`
- **Tablas**: `dbo.ordenes_venta`, `dbo.items_orden_venta`

### Modelo
**Archivo**: `backend/app/models/venta.py`
- **Clases**: `OrdenVenta`, `ItemOrdenVenta`

---

## 📥 6. REGISTRO DE COMPRAS (Órdenes de Compra)

### Endpoint
**Archivo**: `backend/app/api/v1/purchases.py`
- **Función**: `create_purchase()`
- **Ruta**: `POST /api/v1/purchases`

### Servicio
**Archivo**: `backend/app/services/purchase_service.py`
- **Función**: `create_purchase()`

### Repositorio
**Archivo**: `backend/app/repositories/purchase_repo.py`
- **Tablas**: `dbo.ordenes_compra`, `dbo.items_orden_compra`

### Modelo
**Archivo**: `backend/app/models/compra.py`
- **Clases**: `OrdenCompra`, `ItemOrdenCompra`

---

## 🎁 7. REGISTRO DE PROMOCIONES

### Endpoint
**Archivo**: `backend/app/api/v1/promotions.py`
- **Función**: `create_promotion()`
- **Ruta**: `POST /api/v1/promotions`

### Servicio
**Archivo**: `backend/app/services/promotion_service.py`
- **Tablas**: `dbo.promociones`, `dbo.reglas_promocion`

---

## 📋 8. REGISTRO DE RESERVAS

### Endpoint
**Archivo**: `backend/app/api/v1/reservations.py`
- **Función**: `create_reservation()`
- **Ruta**: `POST /api/v1/reservations`

### Servicio
**Archivo**: `backend/app/services/reservation_service.py`
- **Tablas**: `dbo.reservas`, `dbo.items_reserva`

---

## 🔐 9. REGISTRO PÚBLICO (Autoregistro de Usuarios)

### Endpoint
**Archivo**: `backend/app/api/v1/auth.py`
- **Línea 99-139**: `POST /api/v1/auth/register`
- **Función**: `register()`
- **Público**: No requiere autenticación

```python
@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    request_obj: Request,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key")
):
    user_service = UserService(db=db)
    user_response, token_response = user_service.register_user(...)
    return RegisterResponse(user=user_response, token=token_response)
```

**Qué hace**:
- Crea un usuario
- Crea un cliente asociado
- Asigna rol por defecto (SUPERVISOR)
- Retorna token JWT para iniciar sesión

---

## 📊 Flujo Completo de una Operación

### Ejemplo: Crear un Usuario

1. **Frontend** envía: `POST /api/v1/users` con datos del usuario
2. **Endpoint** (`users.py`): Recibe la petición, valida permisos
3. **Service** (`user_service.py`): Aplica lógica de negocio
4. **Repository** (`user_repo.py`): Accede a la base de datos
5. **Model** (`usuario.py`): Mapea a la tabla `dbo.usuarios`
6. **Database**: Guarda el registro
7. **Response**: Retorna el usuario creado

---

## 🔑 Autenticación y Permisos

### Archivo: `backend/app/core/dependencies.py`
- **`require_role("ADMIN")`**: Requiere rol ADMIN
- **`require_inventory_view()`**: Requiere permiso para ver inventario
- **`require_stock_update()`**: Requiere permiso para actualizar stock
- **`require_product_management()`**: Requiere permiso para gestionar productos
- **`require_sales_management()`**: Requiere permiso para gestionar ventas

### Archivo: `backend/app/core/security.py`
- **`get_password_hash()`**: Hashea contraseñas
- **`verify_password()`**: Verifica contraseñas
- **`create_access_token()`**: Crea tokens JWT
- **`get_current_user()`**: Obtiene usuario actual del token

---

## 📝 Schemas (Validación de Datos)

Todos los schemas están en `backend/app/schemas/`:

- **`user.py`**: `UserCreateRequest`, `UserUpdateRequest`, `UserResponse`
- **`customer.py`**: `CustomerCreateRequest`, `CustomerResponse`
- **`product.py`**: `ProductCreateRequest`, `ProductResponse`
- **`sale.py`**: `SaleCreateRequest`, `SaleResponse`
- **`purchase.py`**: `PurchaseCreateRequest`, `PurchaseResponse`
- **`auth.py`**: `RegisterRequest`, `LoginRequest`, `Token`

---

## 🗄️ Modelos (Base de Datos)

Todos los modelos están en `backend/app/models/`:

- **`usuario.py`**: `Usuario`, `Rol`, `Permiso`
- **`cliente.py`**: `Cliente`
- **`proveedor.py`**: `Proveedor`
- **`producto.py`**: `Producto`
- **`variante_producto.py`**: `VarianteProducto`, `UnidadMedida`
- **`venta.py`**: `OrdenVenta`, `ItemOrdenVenta`
- **`compra.py`**: `OrdenCompra`, `ItemOrdenCompra`
- **`reserva.py`**: `Reserva`, `ItemReserva`
- **`promocion.py`**: `Promocion`, `ReglaPromocion`
- **`inventario.py`**: `LibroStock`, `AjusteStock`, `TransferenciaStock`
- **`almacen.py`**: `Almacen`, `Sucursal`, `Empresa`

---

## 🛣️ Rutas Principales

### Archivo: `backend/app/api/v1/routes.py`
Registra todos los routers:

```python
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
# ... etc
```

### Archivo: `backend/app/main.py`
Aplicación principal FastAPI:

```python
app.include_router(api_router, prefix=settings.api_v1_prefix)  # /api/v1
```

---

## 📍 Resumen de Ubicaciones

| Funcionalidad | Endpoint | Service | Repository | Model | Schema |
|--------------|----------|---------|------------|-------|--------|
| **Alta Usuarios** | `users.py:93` | `user_service.py:214` | `user_repo.py:create()` | `usuario.py:Usuario` | `user.py:UserCreateRequest` |
| **Alta Clientes** | `customers.py:43` | `customer_service.py:44` | `customer_repo.py:create()` | `cliente.py:Cliente` | `customer.py:CustomerCreateRequest` |
| **Alta Productos** | `admin/products.py:50` | `product_service.py:create_product()` | `product_repo.py:create()` | `producto.py:Producto` | `product.py:ProductCreateRequest` |
| **Alta Proveedores** | `suppliers.py:create_supplier()` | `supplier_service.py:create_supplier()` | `supplier_repo.py:create()` | `proveedor.py:Proveedor` | `supplier.py:SupplierCreateRequest` |
| **Registro Ventas** | `sales.py:create_sale()` | `sale_service.py:create_sale()` | `sale_repo.py:create()` | `venta.py:OrdenVenta` | `sale.py:SaleCreateRequest` |
| **Registro Compras** | `purchases.py:create_purchase()` | `purchase_service.py:create_purchase()` | `purchase_repo.py:create()` | `compra.py:OrdenCompra` | `purchase.py:PurchaseCreateRequest` |
| **Registro Público** | `auth.py:99` | `user_service.py:register_user()` | `user_repo.py:create()` | `usuario.py:Usuario` | `auth.py:RegisterRequest` |

---

## 🔍 Cómo Buscar una Funcionalidad

1. **Busca el endpoint** en `backend/app/api/v1/`
2. **Revisa el servicio** en `backend/app/services/`
3. **Revisa el repositorio** en `backend/app/repositories/`
4. **Revisa el modelo** en `backend/app/models/`
5. **Revisa el schema** en `backend/app/schemas/`

---

## 💡 Tips

- **Endpoints**: Solo reciben peticiones HTTP y validan permisos
- **Services**: Contienen la lógica de negocio
- **Repositories**: Solo acceden a la base de datos
- **Models**: Definen la estructura de las tablas
- **Schemas**: Validan y transforman datos

