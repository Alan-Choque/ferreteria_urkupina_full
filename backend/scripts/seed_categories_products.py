"""
Script para poblar categorías y productos en la base de datos.
Ejecutar con: python -m scripts.seed_categories_products
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.categoria import Categoria
from app.models.marca import Marca
from app.models.producto import Producto
from app.models.variante_producto import VarianteProducto, UnidadMedida
from app.models.imagen_producto import ImagenProducto


# Definición de categorías principales
CATEGORIES = [
    {"nombre": "Herramientas de Construcción", "descripcion": "Herramientas para construcción y obra"},
    {"nombre": "Pintura", "descripcion": "Pinturas y accesorios de pintura"},
    {"nombre": "Equipos de Industria y Taller", "descripcion": "Equipos profesionales para industria y taller"},
    {"nombre": "Insumos y Accesorios", "descripcion": "Insumos y accesorios diversos"},
    {"nombre": "Aseo y Jardín", "descripcion": "Productos de aseo y jardinería"},
    {"nombre": "Outlet", "descripcion": "Productos en oferta y promoción"},
]

# Marcas comunes
BRANDS = [
    "BOSCH",
    "DEWALT",
    "MAKITA",
    "BLACK+DECKER",
    "STANLEY",
    "TRUPER",
    "3M",
    "RUST-OLEUM",
    "SHERWIN-WILLIAMS",
    "GENERICO",
]

# Unidades de medida comunes
UNITS = [
    {"nombre": "Unidad", "simbolo": "und"},
    {"nombre": "Kilogramo", "simbolo": "kg"},
    {"nombre": "Litro", "simbolo": "L"},
    {"nombre": "Metro", "simbolo": "m"},
    {"nombre": "Metro cuadrado", "simbolo": "m²"},
    {"nombre": "Caja", "simbolo": "caja"},
    {"nombre": "Paquete", "simbolo": "pkg"},
]

# Productos por categoría
PRODUCTS_BY_CATEGORY = {
    "Herramientas de Construcción": [
        {"nombre": "Taladro Percutor 1/2''", "precio": 450.00, "marca": "BOSCH"},
        {"nombre": "Martillo de Uña 20 oz", "precio": 85.00, "marca": "STANLEY"},
        {"nombre": "Destornillador Phillips #2", "precio": 25.00, "marca": "TRUPER"},
        {"nombre": "Llave Stillson 12''", "precio": 120.00, "marca": "TRUPER"},
        {"nombre": "Sierra Circular 7 1/4''", "precio": 380.00, "marca": "DEWALT"},
        {"nombre": "Atornillador Inalámbrico", "precio": 320.00, "marca": "BLACK+DECKER"},
        {"nombre": "Nivel de Burbuja 60 cm", "precio": 45.00, "marca": "STANLEY"},
        {"nombre": "Cinta Métrica 5m", "precio": 18.00, "marca": "STANLEY"},
        {"nombre": "Alicate Universal 8''", "precio": 55.00, "marca": "TRUPER"},
        {"nombre": "Esmeril Angular 4 1/2''", "precio": 280.00, "marca": "BOSCH"},
        {"nombre": "Multímetro Digital", "precio": 95.00, "marca": "GENERICO"},
        {"nombre": "Pistola de Calor 2000W", "precio": 150.00, "marca": "BOSCH"},
        {"nombre": "Sierra Caladora", "precio": 420.00, "marca": "MAKITA"},
        {"nombre": "Lijadora Orbital", "precio": 290.00, "marca": "DEWALT"},
        {"nombre": "Rotomartillo SDS Plus", "precio": 680.00, "marca": "BOSCH"},
    ],
    "Pintura": [
        {"nombre": "Pintura Látex Interior 1 Galón", "precio": 180.00, "marca": "SHERWIN-WILLIAMS"},
        {"nombre": "Pintura Esmalte Exterior 1 Galón", "precio": 220.00, "marca": "RUST-OLEUM"},
        {"nombre": "Rodillo de Lana 9''", "precio": 35.00, "marca": "GENERICO"},
        {"nombre": "Brocha 4'' Cerdas Naturales", "precio": 28.00, "marca": "GENERICO"},
        {"nombre": "Bandeja para Pintura", "precio": 15.00, "marca": "GENERICO"},
        {"nombre": "Cinta de Enmascarar 1''", "precio": 12.00, "marca": "3M"},
        {"nombre": "Lona Protectora 3x4m", "precio": 45.00, "marca": "GENERICO"},
        {"nombre": "Pintura Anticorrosiva 1L", "precio": 95.00, "marca": "RUST-OLEUM"},
        {"nombre": "Barniz Transparente 1L", "precio": 125.00, "marca": "GENERICO"},
        {"nombre": "Pintura en Aerosol 400ml", "precio": 32.00, "marca": "RUST-OLEUM"},
        {"nombre": "Espátula de Acero 4''", "precio": 18.00, "marca": "GENERICO"},
        {"nombre": "Masilla para Madera 1kg", "precio": 25.00, "marca": "GENERICO"},
        {"nombre": "Primer Sellador 1 Galón", "precio": 140.00, "marca": "SHERWIN-WILLIAMS"},
        {"nombre": "Pintura Epóxica 1 Galón", "precio": 380.00, "marca": "RUST-OLEUM"},
        {"nombre": "Rodillo de Espuma 4''", "precio": 22.00, "marca": "GENERICO"},
    ],
    "Equipos de Industria y Taller": [
        {"nombre": "Compresor de Aire 20 Galones", "precio": 850.00, "marca": "BOSCH"},
        {"nombre": "Soldadora Inversora 200A", "precio": 1200.00, "marca": "GENERICO"},
        {"nombre": "Mesa de Trabajo Acero 120cm", "precio": 450.00, "marca": "GENERICO"},
        {"nombre": "Torno de Banco 6''", "precio": 680.00, "marca": "GENERICO"},
        {"nombre": "Prensa Hidráulica 10 Ton", "precio": 950.00, "marca": "GENERICO"},
        {"nombre": "Taladro de Columna", "precio": 520.00, "marca": "GENERICO"},
        {"nombre": "Sierra de Cinta 14''", "precio": 780.00, "marca": "GENERICO"},
        {"nombre": "Pulidora de Pisos", "precio": 650.00, "marca": "GENERICO"},
        {"nombre": "Extractor de Aire Industrial", "precio": 420.00, "marca": "GENERICO"},
        {"nombre": "Carro de Herramientas 5 Cajones", "precio": 380.00, "marca": "STANLEY"},
        {"nombre": "Escalera de Aluminio 12 Escalones", "precio": 280.00, "marca": "GENERICO"},
        {"nombre": "Andamio Modular 1.5x1m", "precio": 320.00, "marca": "GENERICO"},
        {"nombre": "Generador Eléctrico 3500W", "precio": 850.00, "marca": "GENERICO"},
        {"nombre": "Bomba de Agua 1/2 HP", "precio": 280.00, "marca": "GENERICO"},
        {"nombre": "Cortadora de Concreto 14''", "precio": 1200.00, "marca": "GENERICO"},
    ],
    "Insumos y Accesorios": [
        {"nombre": "Tornillo Autorroscante #8 x 1''", "precio": 0.50, "marca": "GENERICO"},
        {"nombre": "Clavo Galvanizado 2 1/2''", "precio": 0.20, "marca": "GENERICO"},
        {"nombre": "Pernos Hexagonales M8 x 50mm", "precio": 1.20, "marca": "GENERICO"},
        {"nombre": "Tuercas M8", "precio": 0.30, "marca": "GENERICO"},
        {"nombre": "Arandelas Planas M8", "precio": 0.15, "marca": "GENERICO"},
        {"nombre": "Cable Eléctrico THWN #12", "precio": 8.50, "marca": "GENERICO"},
        {"nombre": "Caja Eléctrica 4x4", "precio": 12.00, "marca": "GENERICO"},
        {"nombre": "Interruptor Simple", "precio": 8.00, "marca": "GENERICO"},
        {"nombre": "Enchufe 110V", "precio": 15.00, "marca": "GENERICO"},
        {"nombre": "Cinta Aislante 3M", "precio": 5.00, "marca": "3M"},
        {"nombre": "Terminales Eléctricos", "precio": 2.50, "marca": "GENERICO"},
        {"nombre": "Tubo PVC 1/2'' x 3m", "precio": 18.00, "marca": "GENERICO"},
        {"nombre": "Codo PVC 1/2'' 90°", "precio": 3.50, "marca": "GENERICO"},
        {"nombre": "Cinta Teflón 1/2''", "precio": 4.00, "marca": "GENERICO"},
        {"nombre": "Válvula de Compuerta 1/2''", "precio": 45.00, "marca": "GENERICO"},
    ],
    "Aseo y Jardín": [
        {"nombre": "Manguera de Jardín 1/2'' x 15m", "precio": 85.00, "marca": "GENERICO"},
        {"nombre": "Aspersor Oscilante", "precio": 45.00, "marca": "GENERICO"},
        {"nombre": "Pala de Jardín", "precio": 35.00, "marca": "GENERICO"},
        {"nombre": "Rastrillo de Metal", "precio": 28.00, "marca": "GENERICO"},
        {"nombre": "Tijeras de Podar", "precio": 42.00, "marca": "GENERICO"},
        {"nombre": "Guantes de Jardinería", "precio": 15.00, "marca": "GENERICO"},
        {"nombre": "Fertilizante 20-20-20 1kg", "precio": 35.00, "marca": "GENERICO"},
        {"nombre": "Semillas de Césped 1kg", "precio": 28.00, "marca": "GENERICO"},
        {"nombre": "Maceta Plástica 20cm", "precio": 8.00, "marca": "GENERICO"},
        {"nombre": "Sustrato para Plantas 20L", "precio": 25.00, "marca": "GENERICO"},
        {"nombre": "Escoba de Paja", "precio": 12.00, "marca": "GENERICO"},
        {"nombre": "Recogedor de Basura", "precio": 15.00, "marca": "GENERICO"},
        {"nombre": "Trapeador con Cubo", "precio": 38.00, "marca": "GENERICO"},
        {"nombre": "Detergente Líquido 1L", "precio": 18.00, "marca": "GENERICO"},
        {"nombre": "Desinfectante 1L", "precio": 22.00, "marca": "GENERICO"},
    ],
    "Outlet": [
        {"nombre": "Taladro Eléctrico (Outlet)", "precio": 180.00, "marca": "BLACK+DECKER"},
        {"nombre": "Juego de Destornilladores (Outlet)", "precio": 35.00, "marca": "TRUPER"},
        {"nombre": "Pintura Látex (Outlet)", "precio": 120.00, "marca": "GENERICO"},
        {"nombre": "Rodillo 9'' (Outlet)", "precio": 20.00, "marca": "GENERICO"},
        {"nombre": "Martillo 16 oz (Outlet)", "precio": 45.00, "marca": "STANLEY"},
        {"nombre": "Cinta Métrica 5m (Outlet)", "precio": 12.00, "marca": "STANLEY"},
        {"nombre": "Alicate Universal (Outlet)", "precio": 35.00, "marca": "TRUPER"},
        {"nombre": "Llave Stillson 10'' (Outlet)", "precio": 85.00, "marca": "TRUPER"},
        {"nombre": "Nivel 40cm (Outlet)", "precio": 28.00, "marca": "STANLEY"},
        {"nombre": "Brocha 3'' (Outlet)", "precio": 18.00, "marca": "GENERICO"},
        {"nombre": "Pala de Jardín (Outlet)", "precio": 25.00, "marca": "GENERICO"},
        {"nombre": "Manguera 10m (Outlet)", "precio": 55.00, "marca": "GENERICO"},
        {"nombre": "Fertilizante 1kg (Outlet)", "precio": 22.00, "marca": "GENERICO"},
        {"nombre": "Tornillos Varios (Outlet)", "precio": 8.00, "marca": "GENERICO"},
        {"nombre": "Cable Eléctrico #14 (Outlet)", "precio": 6.50, "marca": "GENERICO"},
    ],
}


def get_or_create_category(db: Session, nombre: str, descripcion: str = None) -> Categoria:
    """Obtiene o crea una categoría."""
    categoria = db.query(Categoria).filter(Categoria.nombre == nombre).first()
    if not categoria:
        categoria = Categoria(
            nombre=nombre,
            descripcion=descripcion,
            fecha_creacion=datetime.utcnow()
        )
        db.add(categoria)
        db.commit()
        db.refresh(categoria)
        print(f"✅ Categoría creada: {nombre} (ID: {categoria.id})")
    else:
        print(f"ℹ️ Categoría existente: {nombre} (ID: {categoria.id})")
    return categoria


def get_or_create_brand(db: Session, nombre: str) -> Marca:
    """Obtiene o crea una marca."""
    from app.models.marca import Marca
    marca = db.query(Marca).filter(Marca.nombre == nombre).first()
    if not marca:
        marca = Marca(
            nombre=nombre,
            fecha_creacion=datetime.utcnow()
        )
        db.add(marca)
        db.commit()
        db.refresh(marca)
        print(f"✅ Marca creada: {nombre} (ID: {marca.id})")
    else:
        print(f"ℹ️ Marca existente: {nombre} (ID: {marca.id})")
    return marca


def get_or_create_unit(db: Session, nombre: str, simbolo: str = None) -> UnidadMedida:
    """Obtiene o crea una unidad de medida."""
    unidad = db.query(UnidadMedida).filter(UnidadMedida.nombre == nombre).first()
    if not unidad:
        unidad = UnidadMedida(
            nombre=nombre,
            simbolo=simbolo,
            fecha_creacion=datetime.utcnow()
        )
        db.add(unidad)
        db.commit()
        db.refresh(unidad)
        print(f"✅ Unidad creada: {nombre} (ID: {unidad.id})")
    else:
        print(f"ℹ️ Unidad existente: {nombre} (ID: {unidad.id})")
    return unidad


def create_product(
    db: Session,
    nombre: str,
    precio: float,
    categoria: Categoria,
    marca: Marca = None,
    unidad: UnidadMedida = None
) -> Producto:
    """Crea un producto con su variante."""
    # Verificar si el producto ya existe
    existing = db.query(Producto).filter(Producto.nombre == nombre).first()
    if existing:
        print(f"ℹ️ Producto existente: {nombre} (ID: {existing.id})")
        return existing

    # Crear producto
    producto = Producto(
        nombre=nombre,
        categoria_id=categoria.id,
        marca_id=marca.id if marca else None,
        fecha_creacion=datetime.utcnow()
    )
    db.add(producto)
    db.flush()  # Para obtener el ID

    # Crear variante con precio
    if not unidad:
        unidad = get_or_create_unit(db, "Unidad", "und")

    variante = VarianteProducto(
        producto_id=producto.id,
        nombre=None,
        unidad_medida_id=unidad.id,
        precio=precio,
        fecha_creacion=datetime.utcnow()
    )
    db.add(variante)
    db.commit()
    db.refresh(producto)
    
    print(f"✅ Producto creado: {nombre} (ID: {producto.id}, Precio: Bs. {precio})")
    return producto


# URLs de imágenes de Unsplash por tipo de producto
IMAGE_URLS = {
    "Herramientas de Construcción": [
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?w=800&q=80",  # Taladro
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Martillo
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Destornillador
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Llave
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Sierra
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?w=800&q=80",  # Atornillador
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Nivel
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Cinta
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Alicate
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Esmeril
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?w=800&q=80",  # Multímetro
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Pistola
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Sierra caladora
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Lijadora
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?w=800&q=80",  # Rotomartillo
    ],
    "Pintura": [
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Pintura
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Esmalte
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Rodillo
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Brocha
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Bandeja
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Cinta
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Lona
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Anticorrosiva
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Barniz
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Aerosol
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Espátula
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Masilla
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Primer
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Epóxica
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Rodillo espuma
    ],
    "Equipos de Industria y Taller": [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Compresor
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Soldadora
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Mesa
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Torno
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Prensa
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Taladro columna
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Sierra cinta
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Pulidora
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Extractor
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Carro
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Escalera
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Andamio
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Generador
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Bomba
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Cortadora
    ],
    "Insumos y Accesorios": [
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Tornillo
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Clavo
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Pernos
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Tuercas
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Arandelas
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Cable
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Caja eléctrica
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Interruptor
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Enchufe
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Cinta aislante
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Terminales
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Tubo PVC
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Codo PVC
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Cinta teflón
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Válvula
    ],
    "Aseo y Jardín": [
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Manguera
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Aspersor
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Pala
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Rastrillo
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Tijeras
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Guantes
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Fertilizante
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Semillas
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Maceta
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Sustrato
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Escoba
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Recogedor
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Trapeador
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Detergente
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Desinfectante
    ],
    "Outlet": [
        "https://images.unsplash.com/photo-1515169067865-5387ec356754?w=800&q=80",  # Taladro outlet
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Destornilladores
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Pintura
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Rodillo
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Martillo
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Cinta
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&q=80",  # Alicate
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Llave
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Nivel
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",  # Brocha
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Pala
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Manguera
        "https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?w=800&q=80",  # Fertilizante
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80",  # Tornillos
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",  # Cable
    ],
}


def add_image_to_product(db: Session, producto: Producto, image_url: str, descripcion: str = None):
    """Agrega una imagen a un producto si no existe."""
    existing = db.query(ImagenProducto).filter(
        ImagenProducto.producto_id == producto.id,
        ImagenProducto.url == image_url
    ).first()
    
    if not existing:
        imagen = ImagenProducto(
            producto_id=producto.id,
            url=image_url,
            descripcion=descripcion or f"Imagen de {producto.nombre}",
            fecha_creacion=datetime.utcnow()
        )
        db.add(imagen)
        db.commit()
        print(f"  📷 Imagen agregada a: {producto.nombre}")


def run_seed(db: Session):
    """Ejecuta el seed de categorías y productos."""
    print("🌱 Iniciando seed de categorías y productos...\n")

    # Crear unidades de medida
    print("📦 Creando unidades de medida...")
    unidades = {}
    for unit_data in UNITS:
        unidad = get_or_create_unit(db, unit_data["nombre"], unit_data.get("simbolo"))
        unidades[unit_data["nombre"]] = unidad
    print()

    # Crear marcas
    print("🏷️ Creando marcas...")
    marcas = {}
    for brand_name in BRANDS:
        marca = get_or_create_brand(db, brand_name)
        marcas[brand_name] = marca
    print()

    # Crear categorías y productos
    print("📂 Creando categorías y productos...\n")
    productos_creados = {}  # Guardar productos por categoría para agregar imágenes
    
    for cat_data in CATEGORIES:
        categoria = get_or_create_category(db, cat_data["nombre"], cat_data["descripcion"])
        
        productos = PRODUCTS_BY_CATEGORY.get(cat_data["nombre"], [])
        print(f"  📦 Agregando {len(productos)} productos a '{cat_data['nombre']}'...")
        
        productos_categoria = []
        image_urls = IMAGE_URLS.get(cat_data["nombre"], [])
        
        for idx, prod_data in enumerate(productos):
            marca = marcas.get(prod_data.get("marca", "GENERICO"))
            unidad = unidades.get("Unidad")
            producto = create_product(
                db,
                prod_data["nombre"],
                prod_data["precio"],
                categoria,
                marca,
                unidad
            )
            productos_categoria.append(producto)
            
            # Agregar imagen al producto
            if idx < len(image_urls):
                add_image_to_product(db, producto, image_urls[idx], f"Imagen de {prod_data['nombre']}")
        
        productos_creados[cat_data["nombre"]] = productos_categoria
        print(f"  ✅ Categoría '{cat_data['nombre']}' completada\n")

    print("🎉 Seed completado exitosamente!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        run_seed(db)
    except Exception as e:
        print(f"❌ Error durante el seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

