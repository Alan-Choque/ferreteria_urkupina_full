"""Script para verificar que los clientes se muestren correctamente."""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.cliente import Cliente

db = SessionLocal()

print("=" * 60)
print("VERIFICACIÓN DE CLIENTES EN LA BASE DE DATOS")
print("=" * 60)

total = db.query(Cliente).count()
print(f"\nTotal de clientes: {total}")

customers = db.query(Cliente).order_by(Cliente.id.desc()).limit(10).all()

print("\nÚltimos 10 clientes creados:")
print("-" * 60)

for i, c in enumerate(customers, 1):
    print(f"\n{i}. {c.nombre}")
    print(f"   Email: {c.correo or '(sin email)'}")
    print(f"   Teléfono: {c.telefono or '(sin teléfono)'}")
    print(f"   NIT/CI: {c.nit_ci or '(sin NIT/CI)'}")
    print(f"   Dirección: {c.direccion or '(sin dirección)'}")
    print(f"   Fecha registro: {c.fecha_registro}")

print("\n" + "=" * 60)
print("✓ Verificación completada")
print("=" * 60)

db.close()

