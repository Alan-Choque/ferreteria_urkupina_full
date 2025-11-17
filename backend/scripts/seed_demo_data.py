"""Seed de datos demo para Ferretería Urkupina.

Ejecutar con:

    uvicorn app.main:app --reload  # (en otra terminal, opcional)
    python -m backend.scripts.seed_demo_data

El script es idempotente: solo inserta registros cuando no existen.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Iterable

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import (
    AjusteStock,
    Almacen,
    Categoria,
    Cliente,
    Empresa,
    ImagenProducto,
    ItemAjusteStock,
    ItemOrdenCompra,
    ItemOrdenVenta,
    ItemReserva,
    ItemTransferenciaStock,
    LibroStock,
    Marca,
    OrdenCompra,
    OrdenVenta,
    Producto,
    ProductoAlmacen,
    Promocion,
    Proveedor,
    Reserva,
    ReglaPromocion,
    Rol,
    Sucursal,
    TransferenciaStock,
    UnidadMedida,
    Usuario,
    VarianteProducto,
)


@dataclass(slots=True)
class SeedContext:
    session: SessionLocal
    now: datetime
    roles: Dict[str, Rol]
    users: Dict[str, Usuario]
    empresas: Dict[str, Empresa]
    sucursales: Dict[str, Sucursal]
    almacenes: Dict[str, Almacen]
    categorias: Dict[str, Categoria]
    marcas: Dict[str, Marca]
    unidades: Dict[str, UnidadMedida]
    productos: Dict[str, Producto]
    variantes: Dict[str, VarianteProducto]
    clientes: Dict[str, Cliente]
    proveedores: Dict[str, Proveedor]


class DemoSeeder:
    def __init__(self, session: SessionLocal) -> None:
        self.session = session
        self.ctx = SeedContext(
            session=session,
            now=datetime.utcnow(),
            roles={},
            users={},
            empresas={},
            sucursales={},
            almacenes={},
            categorias={},
            marcas={},
            unidades={},
            productos={},
            variantes={},
            clientes={},
            proveedores={},
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _get_or_create(self, model, defaults=None, **filters):
        stmt = select(model).filter_by(**filters)
        instance = self.session.scalars(stmt).first()
        if instance:
            return instance
        params = dict(filters)
        if defaults:
            params.update(defaults)
        instance = model(**params)
        self.session.add(instance)
        self.session.flush()
        return instance

    def _attach_roles(self, user: Usuario, roles: Iterable[Rol]) -> None:
        for role in roles:
            if role not in user.roles:
                user.roles.append(role)

    # ------------------------------------------------------------------
    # Seed steps
    # ------------------------------------------------------------------
    def seed_roles(self) -> None:
        self.ctx.roles["ADMIN"] = self._get_or_create(
            Rol,
            nombre="ADMIN",
            defaults={"descripcion": "Acceso completo al panel"},
        )
        self.ctx.roles["VENTAS"] = self._get_or_create(
            Rol,
            nombre="VENTAS",
            defaults={"descripcion": "Gestión de clientes y ventas"},
        )
        self.ctx.roles["INVENTARIOS"] = self._get_or_create(
            Rol,
            nombre="INVENTARIOS",
            defaults={"descripcion": "Control de stock y almacenes"},
        )

    def seed_users(self) -> None:
        now = self.ctx.now
        users_data = [
            ("admin", "admin@urkupina.bo", "Admin123!", ["ADMIN"]),
            ("sofia.ventas", "sofia@urkupina.bo", "Ventas2024!", ["VENTAS"]),
            ("martin.logistica", "martin@urkupina.bo", "Logistica2024!", ["INVENTARIOS"]),
        ]
        for username, email, password, role_keys in users_data:
            user = self.session.scalars(select(Usuario).where(Usuario.correo == email)).first()
            if not user:
                user = Usuario(
                    nombre_usuario=username,
                    correo=email,
                    hash_contrasena=get_password_hash(password),
                    fecha_creacion=now,
                    fecha_modificacion=now,
                    activo=True,
                )
                self.session.add(user)
                self.session.flush()
            self._attach_roles(user, (self.ctx.roles[key] for key in role_keys))
            self.ctx.users[username] = user

    def seed_company_structure(self) -> None:
        now = self.ctx.now
        empresa = self._get_or_create(
            Empresa,
            nombre="Ferretería Urkupina SRL",
            defaults={
                "razon_social": "Ferretería Urkupina SRL",
                "nit": "1234567-1",
                "fecha_creacion": now,
            },
        )
        self.ctx.empresas["principal"] = empresa

        sucursales = [
            ("Casa Matriz", "Av. Blanco Galindo 1234, Cochabamba", "4-4455667"),
            ("Sucursal Norte", "Av. Busch 890, Santa Cruz", "3-7766554"),
        ]
        for name, address, phone in sucursales:
            sucursal = self._get_or_create(
                Sucursal,
                nombre=name,
                defaults={
                    "empresa_id": empresa.id,
                    "direccion": address,
                    "telefono": phone,
                    "fecha_creacion": now,
                },
            )
            self.ctx.sucursales[name] = sucursal

        almacenes = [
            ("Almacén Central", "Casa Matriz"),
            ("Depósito Norte", "Sucursal Norte"),
            ("Showroom Matriz", "Casa Matriz"),
        ]
        for name, sucursal_name in almacenes:
            sucursal = self.ctx.sucursales[sucursal_name]
            almacen = self._get_or_create(
                Almacen,
                nombre=name,
                defaults={
                    "sucursal_id": sucursal.id,
                    "descripcion": f"Inventario de la {sucursal.nombre.lower()}",
                    "fecha_creacion": now,
                },
            )
            self.ctx.almacenes[name] = almacen

    def seed_catalogs(self) -> None:
        now = self.ctx.now
        categorias = {
            "Electricidad": "Material eléctrico y cables",
            "Herramientas eléctricas": "Herramientas eléctricas y a batería",
            "Ferretería general": "Herramientas manuales y accesorios",
            "Jardinería": "Equipos para jardinería y exteriores",
        }
        for nombre, descripcion in categorias.items():
            categoria = self._get_or_create(
                Categoria,
                nombre=nombre,
                defaults={"descripcion": descripcion, "fecha_creacion": now},
            )
            self.ctx.categorias[nombre] = categoria

        marcas = {
            "Bosch": "Herramientas de alto desempeño",
            "Tramontina": "Accesorios y equipamiento doméstico",
            "Stanley": "Línea profesional de herramientas manuales",
            "Black+Decker": "Herramientas para hogar y taller",
        }
        for nombre, descripcion in marcas.items():
            marca = self._get_or_create(
                Marca,
                nombre=nombre,
                defaults={"descripcion": descripcion, "fecha_creacion": now},
            )
            self.ctx.marcas[nombre] = marca

        unidades = {
            "Unidad": ("UND", "Unidad individual"),
            "Caja": ("CJ", "Caja con múltiples unidades"),
            "Metro": ("m", "Unidad métrica lineal"),
        }
        for nombre, (simbolo, descripcion) in unidades.items():
            unidad = self._get_or_create(
                UnidadMedida,
                nombre=nombre,
                defaults={"simbolo": simbolo, "descripcion": descripcion, "fecha_creacion": now},
            )
            self.ctx.unidades[nombre] = unidad

    def seed_clients_and_suppliers(self) -> None:
        now = self.ctx.now
        clientes = [
            ("Constructora Andes", "45678901", "4-6677889", "compras@andes.com", "Av. América 1200, Cochabamba"),
            ("Hotel Illimani", "32165498", "2-4477556", "compras@illimani.bo", "Av. Ballivián 340, La Paz"),
            ("Agrocenter SRL", "98765432", "3-5566778", "ventas@agrocenter.bo", "Av. Cristo Redentor 1400, Santa Cruz"),
            ("Universidad Técnica", "40127863", "2-4778899", "compras@utb.bo", "Calle Sucre 89, Oruro"),
        ]
        for nombre, nit, telefono, correo, direccion in clientes:
            cliente = self._get_or_create(
                Cliente,
                nombre=nombre,
                defaults={
                    "nit_ci": nit,
                    "telefono": telefono,
                    "correo": correo,
                    "direccion": direccion,
                    "fecha_registro": now,
                },
            )
            self.ctx.clientes[nombre] = cliente

        proveedores = [
            ("Distribuidora Eléctrica Andina", "56789012", "2-1239876", "contacto@dea.bo", "Calle Murillo 456, La Paz"),
            ("Importadora Industrial UPSA", "78901234", "3-4455667", "ventas@upsaindustrial.bo", "Av. Cristo Redentor 2345, Santa Cruz"),
            ("Herramientas del Sur", "34567890", "4-8877665", "contacto@herrsur.bo", "Circunvalación 567, Cochabamba"),
            ("TecnoJardín", "65432109", "2-9988776", "ventas@tecnojardin.bo", "Av. Blanco Galindo 456, La Paz"),
        ]
        for nombre, nit, telefono, correo, direccion in proveedores:
            proveedor = self._get_or_create(
                Proveedor,
                nombre=nombre,
                defaults={
                    "nit_ci": nit,
                    "telefono": telefono,
                    "correo": correo,
                    "direccion": direccion,
                    "fecha_registro": now,
                },
            )
            self.ctx.proveedores[nombre] = proveedor

    def seed_products(self) -> None:
        now = self.ctx.now
        catalog = [
            {
                "key": "taladro_percutor",
                "nombre": "Taladro percutor 650W",
                "descripcion": "Taladro percutor de 650W con selector de impacto",
                "categoria": "Herramientas eléctricas",
                "marca": "Bosch",
                "variantes": [
                    {"key": "taladro_13mm", "nombre": "Taladro percutor 13mm", "unidad": "Unidad", "precio": Decimal("680.00")},
                    {"key": "taladro_kit", "nombre": "Taladro con kit de brocas", "unidad": "Unidad", "precio": Decimal("750.00")},
                ],
            },
            {
                "key": "atornillador",
                "nombre": "Atornillador inalámbrico 20V",
                "descripcion": "Atornillador inalámbrico con batería de litio 20V",
                "categoria": "Herramientas eléctricas",
                "marca": "Black+Decker",
                "variantes": [
                    {"key": "atornillador_basic", "nombre": "Atornillador 20V (1 batería)", "unidad": "Unidad", "precio": Decimal("420.00")},
                    {"key": "atornillador_plus", "nombre": "Atornillador 20V (2 baterías)", "unidad": "Unidad", "precio": Decimal("560.00")},
                ],
            },
            {
                "key": "escalera",
                "nombre": "Escalera multiuso 4x4",
                "descripcion": "Escalera articulada de aluminio con 4 posiciones",
                "categoria": "Ferretería general",
                "marca": "Stanley",
                "variantes": [
                    {"key": "escalera_4x4", "nombre": "Escalera 4x4 4.7m", "unidad": "Unidad", "precio": Decimal("880.00")},
                ],
            },
            {
                "key": "manguera",
                "nombre": "Manguera reforzada 25m",
                "descripcion": "Manguera reforzada con conectores metálicos",
                "categoria": "Jardinería",
                "marca": "Tramontina",
                "variantes": [
                    {"key": "manguera_25m", "nombre": "Manguera 25 m", "unidad": "Metro", "precio": Decimal("8.50")},
                    {"key": "manguera_50m", "nombre": "Manguera 50 m", "unidad": "Metro", "precio": Decimal("7.90")},
                ],
            },
            {
                "key": "set_destornilladores",
                "nombre": "Set de destornilladores 10 piezas",
                "descripcion": "Set profesional con puntas magnéticas",
                "categoria": "Ferretería general",
                "marca": "Stanley",
                "variantes": [
                    {"key": "destornilladores_prof", "nombre": "Set profesional 10 piezas", "unidad": "Caja", "precio": Decimal("210.00")},
                ],
            },
        ]

        for product_data in catalog:
            categoria = self.ctx.categorias[product_data["categoria"]]
            marca = self.ctx.marcas[product_data["marca"]]
            product = self.session.scalars(select(Producto).where(Producto.nombre == product_data["nombre"])).first()
            if not product:
                product = Producto(
                    categoria_id=categoria.id,
                    marca_id=marca.id,
                    nombre=product_data["nombre"],
                    descripcion=product_data["descripcion"],
                    fecha_creacion=now,
                )
                self.session.add(product)
                self.session.flush()
            self.ctx.productos[product_data["key"]] = product

            for variant_info in product_data["variantes"]:
                unidad = self.ctx.unidades[variant_info["unidad"]]
                variant = self.session.scalars(
                    select(VarianteProducto).where(
                        VarianteProducto.producto_id == product.id,
                        VarianteProducto.nombre == variant_info["nombre"],
                    )
                ).first()
                if not variant:
                    variant = VarianteProducto(
                        producto_id=product.id,
                        nombre=variant_info["nombre"],
                        unidad_medida_id=unidad.id,
                        precio=variant_info["precio"],
                        fecha_creacion=now,
                    )
                    self.session.add(variant)
                    self.session.flush()
                self.ctx.variantes[variant_info["key"]] = variant

    def seed_stock(self) -> None:
        now = self.ctx.now
        central = self.ctx.almacenes["Almacén Central"]
        norte = self.ctx.almacenes["Depósito Norte"]
        showroom = self.ctx.almacenes["Showroom Matriz"]

        stock_plan = [
            ("taladro_13mm", central, Decimal("35"), Decimal("520.00")),
            ("taladro_13mm", showroom, Decimal("10"), Decimal("530.00")),
            ("taladro_kit", central, Decimal("18"), Decimal("580.00")),
            ("atornillador_basic", central, Decimal("42"), Decimal("320.00")),
            ("atornillador_plus", norte, Decimal("25"), Decimal("420.00")),
            ("escalera_4x4", central, Decimal("8"), Decimal("640.00")),
            ("manguera_25m", norte, Decimal("120"), Decimal("5.50")),
            ("manguera_50m", central, Decimal("70"), Decimal("5.30")),
            ("destornilladores_prof", showroom, Decimal("30"), Decimal("140.00")),
        ]

        for variant_key, almacen, cantidad, costo in stock_plan:
            variant = self.ctx.variantes[variant_key]
            record = self.session.scalars(
                select(ProductoAlmacen).where(
                    ProductoAlmacen.variante_producto_id == variant.id,
                    ProductoAlmacen.almacen_id == almacen.id,
                )
            ).first()
            if not record:
                record = ProductoAlmacen(
                    variante_producto_id=variant.id,
                    almacen_id=almacen.id,
                    cantidad_disponible=cantidad,
                    costo_promedio=costo,
                    fecha_actualizacion=now,
                )
                self.session.add(record)
                self.session.flush()
                self.session.add(
                    LibroStock(
                        variante_producto_id=variant.id,
                        almacen_id=almacen.id,
                        tipo_movimiento="ENTRADA",
                        cantidad=cantidad,
                        fecha_movimiento=now - timedelta(days=15),
                        descripcion="Carga inicial de inventario demo",
                    )
                )
            else:
                record.cantidad_disponible = cantidad
                record.costo_promedio = costo
                record.fecha_actualizacion = now

    def seed_purchases(self) -> None:
        admin = self.ctx.users["admin"]
        proveedor1 = self.ctx.proveedores["Distribuidora Eléctrica Andina"]
        proveedor2 = self.ctx.proveedores["Importadora Industrial UPSA"]

        existing = self.session.scalars(select(OrdenCompra)).first()
        if existing:
            return

        oc1 = OrdenCompra(
            proveedor_id=proveedor1.id,
            fecha=self.ctx.now - timedelta(days=12),
            estado="sent",
            usuario_id=admin.id,
        )
        oc1.items.extend(
            [
                ItemOrdenCompra(
                    variante_producto_id=self.ctx.variantes["taladro_13mm"].id,
                    cantidad=Decimal("20"),
                    precio_unitario=Decimal("430.00"),
                ),
                ItemOrdenCompra(
                    variante_producto_id=self.ctx.variantes["atornillador_basic"].id,
                    cantidad=Decimal("35"),
                    precio_unitario=Decimal("260.00"),
                ),
            ]
        )

        oc2 = OrdenCompra(
            proveedor_id=proveedor2.id,
            fecha=self.ctx.now - timedelta(days=5),
            estado="partial",
            usuario_id=admin.id,
        )
        oc2.items.append(
            ItemOrdenCompra(
                variante_producto_id=self.ctx.variantes["escalera_4x4"].id,
                cantidad=Decimal("10"),
                precio_unitario=Decimal("520.00"),
            )
        )

        self.session.add_all([oc1, oc2])

    def seed_sales(self) -> None:
        ventas_user = self.ctx.users["sofia.ventas"]
        cliente1 = self.ctx.clientes["Constructora Andes"]
        cliente2 = self.ctx.clientes["Hotel Illimani"]

        if self.session.scalars(select(OrdenVenta)).first():
            return

        ov1 = OrdenVenta(
            cliente_id=cliente1.id,
            fecha=self.ctx.now - timedelta(days=7),
            estado="PENDIENTE",
            usuario_id=ventas_user.id,
        )
        ov1.items.extend(
            [
                ItemOrdenVenta(
                    variante_producto_id=self.ctx.variantes["taladro_13mm"].id,
                    cantidad=Decimal("4"),
                    precio_unitario=Decimal("680.00"),
                ),
                ItemOrdenVenta(
                    variante_producto_id=self.ctx.variantes["destornilladores_prof"].id,
                    cantidad=Decimal("6"),
                    precio_unitario=Decimal("210.00"),
                ),
            ]
        )

        ov2 = OrdenVenta(
            cliente_id=cliente2.id,
            fecha=self.ctx.now - timedelta(days=3),
            estado="COMPLETADO",
            usuario_id=ventas_user.id,
        )
        ov2.items.append(
            ItemOrdenVenta(
                variante_producto_id=self.ctx.variantes["atornillador_plus"].id,
                cantidad=Decimal("3"),
                precio_unitario=Decimal("560.00"),
            )
        )

        ov3 = OrdenVenta(
            cliente_id=cliente1.id,
            fecha=self.ctx.now - timedelta(days=1),
            estado="CANCELADO",
            usuario_id=ventas_user.id,
        )
        ov3.items.append(
            ItemOrdenVenta(
                variante_producto_id=self.ctx.variantes["manguera_25m"].id,
                cantidad=Decimal("15"),
                precio_unitario=Decimal("11.50"),
            )
        )

        self.session.add_all([ov1, ov2, ov3])

    def seed_reservations(self) -> None:
        inventario_user = self.ctx.users["martin.logistica"]
        cliente = self.ctx.clientes["Agrocenter SRL"]

        if self.session.scalars(select(Reserva)).first():
            return

        reserva = Reserva(
            cliente_id=cliente.id,
            fecha_reserva=self.ctx.now - timedelta(days=2),
            estado="PENDIENTE",
            usuario_id=inventario_user.id,
        )
        reserva.items.append(
            ItemReserva(
                variante_producto_id=self.ctx.variantes["manguera_50m"].id,
                cantidad=Decimal("10"),
            )
        )
        self.session.add(reserva)

    def seed_promotions(self) -> None:
        if self.session.scalars(select(Promocion)).first():
            return

        promo1 = Promocion(
            nombre="Semana de la herramienta",
            descripcion="15% de descuento en herramientas eléctricas seleccionadas",
            fecha_inicio=self.ctx.now - timedelta(days=3),
            fecha_fin=self.ctx.now + timedelta(days=7),
            activo=True,
        )
        promo1.reglas.append(
            ReglaPromocion(
                tipo_regla="PORCENTAJE",
                valor=Decimal("15"),
                descripcion="Aplicable a variaciones de taladros y atornilladores",
            )
        )

        promo2 = Promocion(
            nombre="Combo jardín",
            descripcion="Bs. 50 de descuento en compras de mangueras desde 30 metros",
            fecha_inicio=self.ctx.now - timedelta(days=1),
            fecha_fin=self.ctx.now + timedelta(days=14),
            activo=True,
        )
        promo2.reglas.append(
            ReglaPromocion(
                tipo_regla="MONTO",
                valor=Decimal("50"),
                descripcion="Aplicable a la variante de manguera reforzada",
            )
        )
        self.session.add_all([promo1, promo2])

    def seed_files(self) -> None:
        if self.session.scalars(select(ImagenProducto)).first():
            return

        images = [
            (
                self.ctx.productos["taladro_percutor"],
                "https://images.unsplash.com/photo-1515169067865-5387ec356754",
                "Taladro percutor Bosch en exhibición",
            ),
            (
                self.ctx.productos["manguera"],
                "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1",
                "Mangueras reforzadas en jardín",
            ),
            (
                self.ctx.productos["set_destornilladores"],
                "https://images.unsplash.com/photo-1517976487492-5750f3195933",
                "Set profesional de destornilladores",
            ),
        ]
        for producto, url, descripcion in images:
            imagen = ImagenProducto(
                producto_id=producto.id,
                url=f"{url}?auto=format&fit=crop&w=1200&q=75",
                descripcion=descripcion,
                fecha_creacion=self.ctx.now,
            )
            self.session.add(imagen)

    def seed_inventory_movements(self) -> None:
        if self.session.scalars(select(TransferenciaStock)).first():
            return

        central = self.ctx.almacenes["Almacén Central"]
        norte = self.ctx.almacenes["Depósito Norte"]
        inventario_user = self.ctx.users["martin.logistica"]

        transferencia = TransferenciaStock(
            fecha=self.ctx.now - timedelta(days=4),
            usuario_id=inventario_user.id,
            almacen_origen_id=central.id,
            almacen_destino_id=norte.id,
            descripcion="Reabastecimiento a depósito norte",
        )
        transferencia.items.append(
            ItemTransferenciaStock(
                variante_producto_id=self.ctx.variantes["atornillador_basic"].id,
                cantidad=Decimal("5"),
            )
        )
        self.session.add(transferencia)

        # Ajustar stock en ambos almacenes
        origen_stock = self.session.scalars(
            select(ProductoAlmacen).where(
                ProductoAlmacen.variante_producto_id == self.ctx.variantes["atornillador_basic"].id,
                ProductoAlmacen.almacen_id == central.id,
            )
        ).first()
        destino_stock = self.session.scalars(
            select(ProductoAlmacen).where(
                ProductoAlmacen.variante_producto_id == self.ctx.variantes["atornillador_basic"].id,
                ProductoAlmacen.almacen_id == norte.id,
            )
        ).first()
        if origen_stock and destino_stock:
            origen_stock.cantidad_disponible = Decimal(origen_stock.cantidad_disponible) - Decimal("5")
            destino_stock.cantidad_disponible = Decimal(destino_stock.cantidad_disponible) + Decimal("5")
            origen_stock.fecha_actualizacion = self.ctx.now
            destino_stock.fecha_actualizacion = self.ctx.now

        ajuste = AjusteStock(
            fecha=self.ctx.now - timedelta(days=1),
            descripcion="Regularización por inventario físico showroom",
            usuario_id=inventario_user.id,
        )
        variante = self.ctx.variantes["destornilladores_prof"]
        showroom_stock = self.session.scalars(
            select(ProductoAlmacen).where(
                ProductoAlmacen.variante_producto_id == variante.id,
                ProductoAlmacen.almacen_id == self.ctx.almacenes["Showroom Matriz"].id,
            )
        ).first()
        if showroom_stock:
            cantidad_anterior = Decimal(showroom_stock.cantidad_disponible)
            cantidad_nueva = cantidad_anterior - Decimal("2")
            ajuste.items.append(
                ItemAjusteStock(
                    variante_producto_id=variante.id,
                    cantidad_anterior=cantidad_anterior,
                    cantidad_nueva=cantidad_nueva,
                )
            )
            showroom_stock.cantidad_disponible = cantidad_nueva
            showroom_stock.fecha_actualizacion = self.ctx.now
        self.session.add(ajuste)

    # ------------------------------------------------------------------
    def run(self) -> None:
        self.seed_roles()
        self.seed_users()
        self.seed_company_structure()
        self.seed_catalogs()
        self.seed_clients_and_suppliers()
        self.seed_products()
        self.seed_stock()
        self.seed_purchases()
        self.seed_sales()
        self.seed_reservations()
        self.seed_promotions()
        self.seed_files()
        self.seed_inventory_movements()


def main() -> None:
    session = SessionLocal()
    try:
        with session.begin():
            seeder = DemoSeeder(session)
            seeder.run()
        session.commit()
        print("✅ Seed demo ejecutado correctamente.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
