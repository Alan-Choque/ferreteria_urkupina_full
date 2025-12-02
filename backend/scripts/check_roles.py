#!/usr/bin/env python3
"""Script para consultar los roles existentes en la base de datos"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.models.usuario import Rol

def main():
    db = SessionLocal()
    try:
        roles = db.query(Rol).order_by(Rol.nombre.asc()).all()
        
        if not roles:
            print("No hay roles en la base de datos.")
            return
        
        print(f"\n{'='*60}")
        print(f"ROLES EN LA BASE DE DATOS ({len(roles)} total)")
        print(f"{'='*60}\n")
        
        for role in roles:
            print(f"ID: {role.id:3d} | Nombre: {role.nombre:20s} | Descripción: {role.descripcion or 'N/A'}")
        
        print(f"\n{'='*60}\n")
        
    except Exception as e:
        print(f"Error al consultar roles: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

