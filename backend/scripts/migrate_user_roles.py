#!/usr/bin/env python3
"""Script para migrar usuarios existentes con roles inventados a roles reales"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.models.usuario import Usuario, Rol

def migrate_user_roles():
    """Migra usuarios con roles antiguos a roles reales"""
    db = SessionLocal()
    try:
        # Obtener roles reales
        admin_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
        ventas_role = db.query(Rol).filter(Rol.nombre == "VENTAS").first()
        inventarios_role = db.query(Rol).filter(Rol.nombre == "INVENTARIOS").first()
        supervisor_role = db.query(Rol).filter(Rol.nombre == "SUPERVISOR").first()
        
        print("\n" + "="*60)
        print("ROLES DISPONIBLES")
        print("="*60)
        roles = db.query(Rol).all()
        for role in roles:
            print(f"ID: {role.id:3d} | Nombre: {role.nombre:20s} | Descripción: {role.descripcion or 'N/A'}")
        
        # Obtener todos los usuarios
        usuarios = db.query(Usuario).all()
        
        print("\n" + "="*60)
        print(f"MIGRANDO {len(usuarios)} USUARIOS")
        print("="*60 + "\n")
        
        migrated_count = 0
        
        # Mapeo específico de usuarios conocidos
        user_role_mapping = {
            "admin.root": "ADMIN",
            "admin@ferreteria.com": "ADMIN",
            # Agrega más mapeos según necesites
        }
        
        for usuario in usuarios:
            # Obtener roles actuales del usuario
            current_roles = [r.nombre.upper() for r in usuario.roles]
            
            print(f"Usuario {usuario.id}: {usuario.nombre_usuario}")
            print(f"  Email: {usuario.correo}")
            print(f"  Roles actuales: {', '.join(current_roles) if current_roles else 'NINGUNO'}")
            
            # Verificar si hay un mapeo específico para este usuario
            target_role_name = None
            if usuario.nombre_usuario in user_role_mapping:
                target_role_name = user_role_mapping[usuario.nombre_usuario]
            elif usuario.correo in user_role_mapping:
                target_role_name = user_role_mapping[usuario.correo]
            
            # Si el usuario no tiene roles válidos
            valid_roles = ["ADMIN", "VENTAS", "INVENTARIOS", "SUPERVISOR"]
            has_valid_role = any(r in valid_roles for r in current_roles)
            
            if not has_valid_role:
                # Limpiar roles antiguos
                usuario.roles.clear()
                
                # Determinar qué rol asignar
                role_to_assign = None
                if target_role_name == "ADMIN" and admin_role:
                    role_to_assign = admin_role
                elif target_role_name == "VENTAS" and ventas_role:
                    role_to_assign = ventas_role
                elif target_role_name == "INVENTARIOS" and inventarios_role:
                    role_to_assign = inventarios_role
                elif target_role_name == "SUPERVISOR" and supervisor_role:
                    role_to_assign = supervisor_role
                else:
                    # Por defecto: SUPERVISOR (más restrictivo)
                    role_to_assign = supervisor_role
                    target_role_name = "SUPERVISOR"
                
                if role_to_assign:
                    usuario.roles.append(role_to_assign)
                    print(f"  → Migrado a: {target_role_name}")
                    migrated_count += 1
                else:
                    print(f"  ⚠ ERROR: No se encontró el rol {target_role_name or 'SUPERVISOR'}")
            else:
                print(f"  ✓ Ya tiene roles válidos: {', '.join(current_roles)}")
            
            print()
        
        db.commit()
        
        print("="*60)
        print(f"MIGRACIÓN COMPLETADA: {migrated_count} usuarios migrados")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR durante la migración: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_user_roles()

