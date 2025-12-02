"""Add reservation fields for deposit, confirmation, and completion

Revision ID: 007_add_reservation_fields
Revises: 006_migrate_purchase_statuses
Create Date: 2024-01-XX XX:XX:XX.XXXXXX
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql


# revision identifiers, used by Alembic.
revision = '007_add_reservation_fields'
down_revision = '006_migrate_purchase_statuses'
branch_labels = None
depends_on = None


def upgrade():
    # Agregar campos de anticipio y pago
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'monto_anticipio')
        ALTER TABLE dbo.reservas ADD monto_anticipio DECIMAL(10, 2) NULL
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_anticipio')
        ALTER TABLE dbo.reservas ADD fecha_anticipio DATETIME NULL
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'metodo_pago_anticipio')
        ALTER TABLE dbo.reservas ADD metodo_pago_anticipio VARCHAR(50) NULL
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'numero_comprobante_anticipio')
        ALTER TABLE dbo.reservas ADD numero_comprobante_anticipio VARCHAR(100) NULL
    """)
    
    # Agregar campos de confirmación y recordatorio
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_confirmacion')
        ALTER TABLE dbo.reservas ADD fecha_confirmacion DATETIME NULL
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_recordatorio')
        ALTER TABLE dbo.reservas ADD fecha_recordatorio DATETIME NULL
    """)
    
    # Agregar campos de completado
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_completado')
        ALTER TABLE dbo.reservas ADD fecha_completado DATETIME NULL
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'orden_venta_id')
        ALTER TABLE dbo.reservas ADD orden_venta_id INT NULL
    """)
    
    # Agregar foreign key para orden_venta_id
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_reservas_orden_venta')
        ALTER TABLE dbo.reservas 
        ADD CONSTRAINT fk_reservas_orden_venta 
        FOREIGN KEY (orden_venta_id) REFERENCES dbo.ordenes_venta(id)
    """)
    
    # Agregar campo de observaciones
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'observaciones')
        ALTER TABLE dbo.reservas ADD observaciones VARCHAR(500) NULL
    """)


def downgrade():
    # Eliminar foreign key
    op.execute("""
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_reservas_orden_venta')
        ALTER TABLE dbo.reservas DROP CONSTRAINT fk_reservas_orden_venta
    """)
    
    # Eliminar columnas
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'observaciones')
        ALTER TABLE dbo.reservas DROP COLUMN observaciones
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'orden_venta_id')
        ALTER TABLE dbo.reservas DROP COLUMN orden_venta_id
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_completado')
        ALTER TABLE dbo.reservas DROP COLUMN fecha_completado
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_recordatorio')
        ALTER TABLE dbo.reservas DROP COLUMN fecha_recordatorio
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_confirmacion')
        ALTER TABLE dbo.reservas DROP COLUMN fecha_confirmacion
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'numero_comprobante_anticipio')
        ALTER TABLE dbo.reservas DROP COLUMN numero_comprobante_anticipio
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'metodo_pago_anticipio')
        ALTER TABLE dbo.reservas DROP COLUMN metodo_pago_anticipio
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'fecha_anticipio')
        ALTER TABLE dbo.reservas DROP COLUMN fecha_anticipio
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.reservas') AND name = 'monto_anticipio')
        ALTER TABLE dbo.reservas DROP COLUMN monto_anticipio
    """)

