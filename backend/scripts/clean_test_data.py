"""
Script Python para limpiar todos los datos de prueba de la base de datos.
Mantiene solo los productos originales y un usuario admin.
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models import (
    Usuario, Rol, OrdenVenta, ItemOrdenVenta, OrdenCompra, ItemOrdenCompra,
    Reserva, ItemReserva, Cliente, Proveedor, FacturaVenta, ItemFacturaVenta,
    PagoCliente, ContactoProveedor, Promocion, ReglaPromocion
)
from app.core.security import get_password_hash


def clean_test_data(db: Session) -> dict:
    """
    Limpia todos los datos de prueba, manteniendo solo productos originales y un usuario admin.
    """
    removed_count = {
        "pagos_cliente": 0,
        "items_factura_venta": 0,
        "facturas_venta": 0,
        "items_reserva": 0,
        "reservas": 0,
        "items_orden_compra": 0,
        "ordenes_compra": 0,
        "items_orden_venta": 0,
        "ordenes_venta": 0,
        "contactos_proveedor": 0,
        "proveedor_producto": 0,
        "proveedores": 0,
        "clientes": 0,
        "usuarios": 0,
        "promociones": 0,
    }
    
    try:
        # 1. Eliminar pagos de clientes
        removed_count["pagos_cliente"] = db.query(PagoCliente).delete()
        
        # 2. Eliminar items de facturas
        removed_count["items_factura_venta"] = db.execute(
            text("DELETE FROM dbo.items_factura_venta")
        ).rowcount
        
        # 3. Eliminar facturas
        removed_count["facturas_venta"] = db.query(FacturaVenta).delete()
        
        # 4. Eliminar items de reservas
        removed_count["items_reserva"] = db.query(ItemReserva).delete()
        
        # 5. Eliminar reservas
        removed_count["reservas"] = db.query(Reserva).delete()
        
        # 6. Eliminar items de órdenes de compra
        removed_count["items_orden_compra"] = db.query(ItemOrdenCompra).delete()
        
        # 7. Eliminar órdenes de compra
        removed_count["ordenes_compra"] = db.query(OrdenCompra).delete()
        
        # 8. Eliminar items de órdenes de venta
        removed_count["items_orden_venta"] = db.query(ItemOrdenVenta).delete()
        
        # 9. Eliminar órdenes de venta
        removed_count["ordenes_venta"] = db.query(OrdenVenta).delete()
        
        # 10. Eliminar contactos de proveedores
        removed_count["contactos_proveedor"] = db.query(ContactoProveedor).delete()
        
        # 11. Eliminar relación proveedor-producto
        removed_count["proveedor_producto"] = db.execute(
            text("DELETE FROM dbo.proveedor_producto")
        ).rowcount
        
        # 12. Eliminar proveedores
        removed_count["proveedores"] = db.query(Proveedor).delete()
        
        # 13. Obtener usuarios admin antes de eliminar
        admin_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
        admin_user_ids = set()
        if admin_role:
            admin_users = db.query(Usuario).join(Usuario.roles).filter(Rol.id == admin_role.id).all()
            admin_user_ids = {u.id for u in admin_users}
        
        # 14. Desvincular clientes de usuarios no admin
        if admin_user_ids:
            admin_ids_str = ",".join(str(uid) for uid in admin_user_ids)
            db.execute(
                text(f"""
                    UPDATE dbo.clientes 
                    SET usuario_id = NULL 
                    WHERE usuario_id IS NOT NULL 
                    AND usuario_id NOT IN ({admin_ids_str})
                """)
            )
        else:
            # Si no hay admin, desvincular todos
            db.execute(text("UPDATE dbo.clientes SET usuario_id = NULL WHERE usuario_id IS NOT NULL"))
        
        # 15. Eliminar clientes no vinculados a admin
        if admin_user_ids:
            removed_count["clientes"] = db.query(Cliente).filter(
                ~Cliente.usuario_id.in_(list(admin_user_ids))
            ).delete()
        else:
            removed_count["clientes"] = db.query(Cliente).delete()
        
        # 16. Dejar solo UN usuario admin (el primero que encontremos o crear uno nuevo)
        admin_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
        if admin_role:
            admin_users = db.query(Usuario).join(Usuario.roles).filter(
                Rol.id == admin_role.id,
                Usuario.activo == True
            ).all()
            
            if len(admin_users) == 0:
                # Crear un usuario admin si no existe ninguno
                admin_user = Usuario(
                    nombre_usuario="admin",
                    correo="admin@ferreteria.com",
                    hash_contrasena=get_password_hash("admin123"),
                    activo=True
                )
                db.add(admin_user)
                db.flush()
                admin_user.roles.append(admin_role)
                print(f"Usuario admin creado con ID: {admin_user.id}")
                admin_to_keep_id = admin_user.id
            else:
                # Mantener solo el primer admin, eliminar los demás
                admin_to_keep_id = admin_users[0].id
                if len(admin_users) > 1:
                    # Desvincular roles de los otros admins
                    for admin_user in admin_users[1:]:
                        admin_user.roles.clear()
                    # Eliminar los otros usuarios admin
                    removed_count["usuarios"] += db.query(Usuario).filter(
                        Usuario.id.in_([u.id for u in admin_users[1:]])
                    ).delete()
                    print(f"Mantenido usuario admin con ID: {admin_to_keep_id}")
                    print(f"Eliminados {len(admin_users) - 1} usuarios admin adicionales")
            
            # Eliminar usuarios no admin
            removed_count["usuarios"] += db.query(Usuario).filter(
                Usuario.id != admin_to_keep_id
            ).delete()
        else:
            # Si no hay rol ADMIN, eliminar todos los usuarios
            removed_count["usuarios"] = db.query(Usuario).delete()
            print("ADVERTENCIA: No se encontró el rol ADMIN. Todos los usuarios fueron eliminados.")
        
        # 17. Eliminar reglas de promociones
        db.query(ReglaPromocion).delete()
        
        # 18. Eliminar promociones
        removed_count["promociones"] = db.query(Promocion).delete()
        
        # 19. Verificar que quede al menos un usuario admin
        admin_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
        if admin_role:
            admin_count = db.query(Usuario).join(Usuario.roles).filter(
                Rol.id == admin_role.id,
                Usuario.activo == True
            ).count()
            
            if admin_count == 0:
                raise Exception("No quedan usuarios admin activos después de la limpieza")
            
            print(f"✓ Usuarios admin restantes: {admin_count}")
        
        # 20. Contar productos mantenidos
        from app.models.producto import Producto
        product_count = db.query(Producto).count()
        print(f"✓ Productos mantenidos: {product_count}")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Datos de prueba eliminados exitosamente",
            "removed": removed_count,
            "products_kept": product_count,
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error durante la limpieza: {str(e)}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("Iniciando limpieza de datos de prueba...")
        print("=" * 60)
        
        result = clean_test_data(db)
        
        print("=" * 60)
        print("Limpieza completada exitosamente!")
        print(f"\nResumen:")
        print(f"- Productos mantenidos: {result['products_kept']}")
        print(f"\nDatos eliminados:")
        for key, value in result["removed"].items():
            if value > 0:
                print(f"  - {key}: {value}")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

