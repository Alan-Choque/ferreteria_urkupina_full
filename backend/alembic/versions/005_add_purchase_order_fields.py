"""add_purchase_order_fields

Revision ID: 005_add_purchase_order_fields
Revises: dc60052a991a
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import DateTime, String

# revision identifiers, used by Alembic.
revision = '005_add_purchase_order_fields'
down_revision = 'dc60052a991a'
branch_labels = None
depends_on = None


def upgrade():
    # Agregar nuevos campos a ordenes_compra
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_envio')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD fecha_envio DATETIME NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_confirmacion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD fecha_confirmacion DATETIME NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_recepcion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD fecha_recepcion DATETIME NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_facturacion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD fecha_facturacion DATETIME NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_cierre')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD fecha_cierre DATETIME NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'numero_factura_proveedor')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD numero_factura_proveedor NVARCHAR(50) NULL
        END
    """)
    
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'observaciones')
        BEGIN
            ALTER TABLE dbo.ordenes_compra ADD observaciones NVARCHAR(500) NULL
        END
    """)


def downgrade():
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'observaciones')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN observaciones
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'numero_factura_proveedor')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN numero_factura_proveedor
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_cierre')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN fecha_cierre
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_facturacion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN fecha_facturacion
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_recepcion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN fecha_recepcion
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_confirmacion')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN fecha_confirmacion
        END
    """)
    
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ordenes_compra') AND name = 'fecha_envio')
        BEGIN
            ALTER TABLE dbo.ordenes_compra DROP COLUMN fecha_envio
        END
    """)

