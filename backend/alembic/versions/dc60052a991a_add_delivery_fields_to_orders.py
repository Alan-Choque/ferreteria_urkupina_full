"""add_delivery_fields_to_orders

Revision ID: dc60052a991a
Revises: beab77980fda
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

Agrega campos para rastrear entregas, pagos y recogidas en tienda.
Soporta los flujos: prepago, contra entrega, y recoger en tienda.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text

# revision identifiers, used by Alembic.
revision = 'dc60052a991a'
down_revision = 'beab77980fda'
branch_labels = None
depends_on = None


def upgrade():
    # Agregar columnas a ordenes_venta (solo si no existen)
    
    # Método de pago/entrega
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'metodo_pago')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD metodo_pago VARCHAR(50) NULL
        END
    """)
    
    # Fechas de eventos
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_pago')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD fecha_pago DATETIME NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_preparacion')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD fecha_preparacion DATETIME NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_envio')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD fecha_envio DATETIME NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD fecha_entrega DATETIME NULL
        END
    """)
    
    # Información de entrega/recogida
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'direccion_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD direccion_entrega VARCHAR(255) NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'sucursal_recogida_id')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD sucursal_recogida_id INTEGER NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'persona_recibe')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD persona_recibe VARCHAR(100) NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'repartidor_id')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD repartidor_id INTEGER NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'observaciones_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta ADD observaciones_entrega TEXT NULL
        END
    """)
    
    # Foreign keys (solo si no existen)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_venta' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'sucursal_recogida_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_ordenes_venta_sucursal_recogida')
        BEGIN
            ALTER TABLE dbo.ordenes_venta
            ADD CONSTRAINT fk_ordenes_venta_sucursal_recogida
            FOREIGN KEY (sucursal_recogida_id) REFERENCES dbo.sucursales(id) ON DELETE SET NULL
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_venta' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'repartidor_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_ordenes_venta_repartidor')
        BEGIN
            ALTER TABLE dbo.ordenes_venta
            ADD CONSTRAINT fk_ordenes_venta_repartidor
            FOREIGN KEY (repartidor_id) REFERENCES dbo.usuarios(id)
        END
    """)
    
    # Índices para mejorar búsquedas
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_metodo_pago' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            CREATE INDEX ix_ordenes_venta_metodo_pago ON dbo.ordenes_venta (metodo_pago)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_fecha_entrega' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            CREATE INDEX ix_ordenes_venta_fecha_entrega ON dbo.ordenes_venta (fecha_entrega)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_repartidor_id' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            CREATE INDEX ix_ordenes_venta_repartidor_id ON dbo.ordenes_venta (repartidor_id)
        END
    """)


def downgrade():
    # Eliminar índices
    op.execute("""
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_repartidor_id' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            DROP INDEX ix_ordenes_venta_repartidor_id ON dbo.ordenes_venta
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_fecha_entrega' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            DROP INDEX ix_ordenes_venta_fecha_entrega ON dbo.ordenes_venta
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_ordenes_venta_metodo_pago' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
        BEGIN
            DROP INDEX ix_ordenes_venta_metodo_pago ON dbo.ordenes_venta
        END
    """)
    
    # Eliminar foreign keys
    op.execute("""
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_ordenes_venta_repartidor')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP CONSTRAINT fk_ordenes_venta_repartidor
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_ordenes_venta_sucursal_recogida')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP CONSTRAINT fk_ordenes_venta_sucursal_recogida
        END
    """)
    
    # Eliminar columnas
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'observaciones_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN observaciones_entrega
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'repartidor_id')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN repartidor_id
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'persona_recibe')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN persona_recibe
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'sucursal_recogida_id')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN sucursal_recogida_id
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'direccion_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN direccion_entrega
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_entrega')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN fecha_entrega
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_envio')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN fecha_envio
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_preparacion')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN fecha_preparacion
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'fecha_pago')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN fecha_pago
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_venta') AND name = 'metodo_pago')
        BEGIN
            ALTER TABLE dbo.ordenes_venta DROP COLUMN metodo_pago
        END
    """)
