"""add supplier management fields

Revision ID: 008_supplier_management
Revises: 007_add_reservation_fields
Create Date: 2024-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_supplier_management'
down_revision = '007_add_reservation_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar campo activo a proveedores
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.proveedores') AND name = 'activo')
        BEGIN
            ALTER TABLE dbo.proveedores ADD activo BIT NOT NULL DEFAULT 1;
            PRINT '  ✓ Agregado campo activo a proveedores';
        END
    """)
    
    # Crear tabla de contactos_proveedor
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contactos_proveedor' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            CREATE TABLE dbo.contactos_proveedor (
                id INT IDENTITY(1,1) PRIMARY KEY,
                proveedor_id INT NOT NULL,
                nombre NVARCHAR(100) NOT NULL,
                cargo NVARCHAR(50) NULL,
                telefono NVARCHAR(20) NULL,
                correo NVARCHAR(100) NULL,
                observaciones NVARCHAR(255) NULL,
                activo BIT NOT NULL DEFAULT 1,
                CONSTRAINT fk_contactos_proveedor_proveedor 
                    FOREIGN KEY (proveedor_id) REFERENCES dbo.proveedores(id) ON DELETE CASCADE
            );
            CREATE INDEX ix_contactos_proveedor_proveedor_id ON dbo.contactos_proveedor(proveedor_id);
            PRINT '  ✓ Creada tabla contactos_proveedor';
        END
    """)
    
    # Crear tabla de asociación proveedor_producto
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'proveedor_producto' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            CREATE TABLE dbo.proveedor_producto (
                proveedor_id INT NOT NULL,
                producto_id INT NOT NULL,
                CONSTRAINT pk_proveedor_producto PRIMARY KEY (proveedor_id, producto_id),
                CONSTRAINT fk_proveedor_producto_proveedor 
                    FOREIGN KEY (proveedor_id) REFERENCES dbo.proveedores(id) ON DELETE CASCADE,
                CONSTRAINT fk_proveedor_producto_producto 
                    FOREIGN KEY (producto_id) REFERENCES dbo.productos(id) ON DELETE CASCADE
            );
            CREATE INDEX ix_proveedor_producto_proveedor_id ON dbo.proveedor_producto(proveedor_id);
            CREATE INDEX ix_proveedor_producto_producto_id ON dbo.proveedor_producto(producto_id);
            PRINT '  ✓ Creada tabla proveedor_producto';
        END
    """)


def downgrade() -> None:
    # Eliminar tabla proveedor_producto
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'proveedor_producto' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            DROP TABLE dbo.proveedor_producto;
            PRINT '  ✓ Eliminada tabla proveedor_producto';
        END
    """)
    
    # Eliminar tabla contactos_proveedor
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'contactos_proveedor' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            DROP TABLE dbo.contactos_proveedor;
            PRINT '  ✓ Eliminada tabla contactos_proveedor';
        END
    """)
    
    # Eliminar campo activo de proveedores
    op.execute("""
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.proveedores') AND name = 'activo')
        BEGIN
            ALTER TABLE dbo.proveedores DROP COLUMN activo;
            PRINT '  ✓ Eliminado campo activo de proveedores';
        END
    """)

