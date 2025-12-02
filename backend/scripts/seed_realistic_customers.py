"""
Script para limpiar clientes y crear clientes realistas con datos completos.
"""
import sys
import os

# Agregar el directorio raíz del proyecto al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.cliente import Cliente
from sqlalchemy import text
from datetime import datetime

# Datos de clientes realistas (nombres bolivianos, direcciones de ciudades bolivianas)
REALISTIC_CUSTOMERS = [
    {
        "nombre": "Carlos Alberto Mamani Quispe",
        "correo": "carlos.mamani@email.com",
        "telefono": "70123456",
        "nit_ci": "12345678",
        "direccion": "Av. 6 de Agosto #1234, Zona Sopocachi, La Paz",
    },
    {
        "nombre": "María Elena Fernández Vargas",
        "correo": "maria.fernandez@email.com",
        "telefono": "71234567",
        "nit_ci": "23456789",
        "direccion": "Calle Comercio #567, Zona Central, Cochabamba",
    },
    {
        "nombre": "Juan Pablo Choque Huanca",
        "correo": "juan.choque@email.com",
        "telefono": "72345678",
        "nit_ci": "34567890",
        "direccion": "Av. Libertador #890, Zona Sur, La Paz",
    },
    {
        "nombre": "Ana Patricia Morales Ríos",
        "correo": "ana.morales@email.com",
        "telefono": "73456789",
        "nit_ci": "45678901",
        "direccion": "Calle España #234, Zona Norte, Santa Cruz",
    },
    {
        "nombre": "Roberto Andrés Gutiérrez Salazar",
        "correo": "roberto.gutierrez@email.com",
        "telefono": "74567890",
        "nit_ci": "56789012",
        "direccion": "Av. América #456, Zona Este, Cochabamba",
    },
    {
        "nombre": "Laura Beatriz Apaza Condori",
        "correo": "laura.apaza@email.com",
        "telefono": "75678901",
        "nit_ci": "67890123",
        "direccion": "Calle Potosí #789, Zona Centro, La Paz",
    },
    {
        "nombre": "Fernando José Ticona Flores",
        "correo": "fernando.ticona@email.com",
        "telefono": "76789012",
        "nit_ci": "78901234",
        "direccion": "Av. Busch #123, Zona Plan 3000, Santa Cruz",
    },
    {
        "nombre": "Sofía Isabel Yujra Pari",
        "correo": "sofia.yujra@email.com",
        "telefono": "77890123",
        "nit_ci": "89012345",
        "direccion": "Calle Sucre #345, Zona Cala Cala, Cochabamba",
    },
    {
        "nombre": "Diego Mauricio Quispe Tintaya",
        "correo": "diego.quispe@email.com",
        "telefono": "78901234",
        "nit_ci": "90123456",
        "direccion": "Av. Mariscal Santa Cruz #678, Zona Miraflores, La Paz",
    },
    {
        "nombre": "Valentina Alejandra Cáceres Rojas",
        "correo": "valentina.caceres@email.com",
        "telefono": "79012345",
        "nit_ci": "01234567",
        "direccion": "Calle Ballivián #901, Zona Sur, Cochabamba",
    },
    {
        "nombre": "Luis Miguel Huanca Mamani",
        "correo": "luis.huanca@email.com",
        "telefono": "70123457",
        "nit_ci": "12345679",
        "direccion": "Av. Circunvalación #234, Zona Equipetrol, Santa Cruz",
    },
    {
        "nombre": "Gabriela Fernanda Condori Quispe",
        "correo": "gabriela.condori@email.com",
        "telefono": "71234568",
        "nit_ci": "23456790",
        "direccion": "Calle Linares #567, Zona San Pedro, La Paz",
    },
    {
        "nombre": "Mario Esteban Vargas Choque",
        "correo": "mario.vargas@email.com",
        "telefono": "72345679",
        "nit_ci": "34567891",
        "direccion": "Av. Villazón #890, Zona Obrajes, La Paz",
    },
    {
        "nombre": "Carmen Rosa Flores Apaza",
        "correo": "carmen.flores@email.com",
        "telefono": "73456790",
        "nit_ci": "45678902",
        "direccion": "Calle Ayacucho #123, Zona Central, Cochabamba",
    },
    {
        "nombre": "Jorge Luis Salazar Ticona",
        "correo": "jorge.salazar@email.com",
        "telefono": "74567891",
        "nit_ci": "56789013",
        "direccion": "Av. Beni #456, Zona Los Pozos, Santa Cruz",
    },
]


def clean_customers(db):
    """Limpia todos los clientes que no tienen usuario_id vinculado."""
    print("Limpiando clientes sin usuario vinculado...")
    
    # Eliminar clientes que no tienen usuario_id (clientes invitados/guest)
    # Mantener los que tienen usuario_id para no romper relaciones
    deleted = db.execute(
        text("DELETE FROM dbo.clientes WHERE usuario_id IS NULL")
    )
    db.commit()
    print(f"✓ Eliminados {deleted.rowcount} clientes sin usuario vinculado")


def create_realistic_customers(db):
    """Crea clientes realistas con todos los campos completos."""
    print(f"\nCreando {len(REALISTIC_CUSTOMERS)} clientes realistas...")
    
    created_count = 0
    for customer_data in REALISTIC_CUSTOMERS:
        # Verificar si ya existe un cliente con este correo
        existing = db.query(Cliente).filter(
            Cliente.correo == customer_data["correo"]
        ).first()
        
        if existing:
            print(f"  ⚠ Cliente con correo {customer_data['correo']} ya existe, omitiendo...")
            continue
        
        # Crear nuevo cliente
        cliente = Cliente(
            nombre=customer_data["nombre"],
            correo=customer_data["correo"],
            telefono=customer_data["telefono"],
            nit_ci=customer_data["nit_ci"],
            direccion=customer_data["direccion"],
            usuario_id=None,  # Clientes sin cuenta de usuario
            fecha_registro=datetime.utcnow(),
        )
        
        db.add(cliente)
        created_count += 1
        print(f"  ✓ Creado: {customer_data['nombre']} ({customer_data['correo']})")
    
    db.commit()
    print(f"\n✓ Total de clientes creados: {created_count}")


def main():
    """Función principal."""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("LIMPIEZA Y CREACIÓN DE CLIENTES REALISTAS")
        print("=" * 60)
        
        # Limpiar clientes existentes (sin usuario vinculado)
        clean_customers(db)
        
        # Crear clientes realistas
        create_realistic_customers(db)
        
        # Mostrar resumen
        total_customers = db.query(Cliente).count()
        customers_with_users = db.query(Cliente).filter(Cliente.usuario_id.isnot(None)).count()
        customers_without_users = db.query(Cliente).filter(Cliente.usuario_id.is_(None)).count()
        
        print("\n" + "=" * 60)
        print("RESUMEN:")
        print("=" * 60)
        print(f"Total de clientes: {total_customers}")
        print(f"  - Con usuario vinculado: {customers_with_users}")
        print(f"  - Sin usuario (invitados): {customers_without_users}")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

