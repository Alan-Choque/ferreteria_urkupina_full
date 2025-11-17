"""
Script para agregar imágenes con fondo de color y nombre del producto como texto.
Usa dummyimage.com para generar imágenes con fondo de color y texto.
Ejecuta con: python -m scripts.add_product_images
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.producto import Producto
from app.models.imagen_producto import ImagenProducto
from app.models.categoria import Categoria
from urllib.parse import quote

def generate_product_image_url(product_name: str, category: str = None) -> str:
    """
    Genera una URL de imagen con fondo de color y el nombre del producto como texto.
    Usa dummyimage.com que es más confiable que placeholder.com
    """
    # Limpiar el nombre del producto para la URL
    # Limitar a 40 caracteres para evitar URLs muy largas
    clean_name = product_name.replace("'", "").replace('"', "").replace("''", "").replace("×", "x")[:40]
    # Codificar el nombre para la URL
    encoded_name = quote(clean_name)
    
    # Colores por categoría
    color_map = {
        "Herramientas de Construcción": "4A5568",  # Gris oscuro
        "Pintura": "ED8936",  # Naranja
        "Equipos de Industria y Taller": "2D3748",  # Gris muy oscuro
        "Insumos y Accesorios": "4299E1",  # Azul
        "Aseo y Jardín": "48BB78",  # Verde
        "Outlet": "E53E3E",  # Rojo
    }
    
    bg_color = color_map.get(category, "718096")  # Gris por defecto
    text_color = "FFFFFF"  # Texto blanco
    
    # Usar dummyimage.com con el nombre del producto
    # Formato: https://dummyimage.com/800x800/COLOR/TEXT_COLOR.png?text=PRODUCTO
    url = f"https://dummyimage.com/800x800/{bg_color}/{text_color}.png?text={encoded_name}"
    return url


def add_images_to_products(db: Session):
    """Agrega imágenes con fondo de color y nombre del producto a productos existentes."""
    print("🖼️ Agregando imágenes con fondo de color y nombre del producto...\n")
    
    total_imagenes = 0
    productos_sin_categoria = []
    
    # Obtener todos los productos con sus categorías
    productos = db.query(Producto).all()
    
    for producto in productos:
        # Verificar si el producto ya tiene imágenes
        existing_images = db.query(ImagenProducto).filter(
            ImagenProducto.producto_id == producto.id
        ).count()
        
        if existing_images == 0:
            # Obtener la categoría del producto
            categoria_nombre = None
            if producto.categoria_id:
                categoria = db.query(Categoria).filter(Categoria.id == producto.categoria_id).first()
                if categoria:
                    categoria_nombre = categoria.nombre
            
            if categoria_nombre:
                # Generar URL de imagen con fondo de color específico para esta categoría
                image_url = generate_product_image_url(producto.nombre, categoria_nombre)
                
                imagen = ImagenProducto(
                    producto_id=producto.id,
                    url=image_url,
                    descripcion=f"Imagen de {producto.nombre}",
                    fecha_creacion=datetime.utcnow()
                )
                db.add(imagen)
                total_imagenes += 1
                print(f"  ✅ Imagen agregada: {producto.nombre} (Categoría: {categoria_nombre})")
            else:
                # Si no tiene categoría, usar color por defecto
                image_url = generate_product_image_url(producto.nombre)
                imagen = ImagenProducto(
                    producto_id=producto.id,
                    url=image_url,
                    descripcion=f"Imagen de {producto.nombre}",
                    fecha_creacion=datetime.utcnow()
                )
                db.add(imagen)
                total_imagenes += 1
                productos_sin_categoria.append(producto.nombre)
                print(f"  ✅ Imagen agregada (sin categoría): {producto.nombre}")
    
    db.commit()
    
    print(f"\n🎉 Total de imágenes agregadas: {total_imagenes}")
    if productos_sin_categoria:
        print(f"ℹ️ Productos sin categoría: {len(productos_sin_categoria)}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        add_images_to_products(db)
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
