"""create_facturas_and_pagos

Revision ID: beab77980fda
Revises: 004_remove_unused_tables
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

Crea las tablas de facturas de venta y pagos de cliente.
Estas son funcionalidades críticas para cumplir con requisitos legales en Bolivia.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, Text, Index

# revision identifiers, used by Alembic.
revision = 'beab77980fda'
down_revision = '004_remove_unused_tables'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # CREAR TABLA facturas_venta (si no existe)
    # Si existe, agregar columnas faltantes
    # ============================================
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'facturas_venta' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            CREATE TABLE dbo.facturas_venta (
                id INTEGER NOT NULL IDENTITY(1,1),
                numero_factura VARCHAR(50) NOT NULL,
                orden_venta_id INTEGER NULL,
                cliente_id INTEGER NOT NULL,
                usuario_id INTEGER NULL,
                nit_cliente VARCHAR(20) NULL,
                razon_social VARCHAR(150) NULL,
                fecha_emision DATETIME NOT NULL,
                fecha_vencimiento DATETIME NULL,
                subtotal NUMERIC(10, 2) NOT NULL,
                descuento NUMERIC(10, 2) NOT NULL DEFAULT 0,
                impuesto NUMERIC(10, 2) NOT NULL DEFAULT 0,
                total NUMERIC(10, 2) NOT NULL,
                estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDA',
                CONSTRAINT pk_facturas_venta PRIMARY KEY (id)
            )
        END
        ELSE
        BEGIN
            -- Agregar columnas faltantes si la tabla ya existe
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'numero_factura')
                ALTER TABLE dbo.facturas_venta ADD numero_factura VARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'orden_venta_id')
                ALTER TABLE dbo.facturas_venta ADD orden_venta_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'cliente_id')
                ALTER TABLE dbo.facturas_venta ADD cliente_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'usuario_id')
                ALTER TABLE dbo.facturas_venta ADD usuario_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'nit_cliente')
                ALTER TABLE dbo.facturas_venta ADD nit_cliente VARCHAR(20) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'razon_social')
                ALTER TABLE dbo.facturas_venta ADD razon_social VARCHAR(150) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'fecha_emision')
                ALTER TABLE dbo.facturas_venta ADD fecha_emision DATETIME NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'fecha_vencimiento')
                ALTER TABLE dbo.facturas_venta ADD fecha_vencimiento DATETIME NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'subtotal')
                ALTER TABLE dbo.facturas_venta ADD subtotal NUMERIC(10, 2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'descuento')
                ALTER TABLE dbo.facturas_venta ADD descuento NUMERIC(10, 2) NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'impuesto')
                ALTER TABLE dbo.facturas_venta ADD impuesto NUMERIC(10, 2) NOT NULL DEFAULT 0;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'total')
                ALTER TABLE dbo.facturas_venta ADD total NUMERIC(10, 2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.facturas_venta') AND name = 'estado')
                ALTER TABLE dbo.facturas_venta ADD estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDA';
        END
    """)
    
    # Foreign keys para facturas_venta (solo si no existen)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_facturas_venta_orden_venta')
        BEGIN
            ALTER TABLE dbo.facturas_venta
            ADD CONSTRAINT fk_facturas_venta_orden_venta
            FOREIGN KEY (orden_venta_id) REFERENCES dbo.ordenes_venta(id) ON DELETE SET NULL
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_facturas_venta_cliente')
        BEGIN
            ALTER TABLE dbo.facturas_venta
            ADD CONSTRAINT fk_facturas_venta_cliente
            FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_facturas_venta_usuario')
        BEGIN
            ALTER TABLE dbo.facturas_venta
            ADD CONSTRAINT fk_facturas_venta_usuario
            FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id) ON DELETE SET NULL
        END
    """)
    
    # Índices para facturas_venta (solo si no existen)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_facturas_venta_numero_factura' AND object_id = OBJECT_ID('dbo.facturas_venta'))
        BEGIN
            CREATE UNIQUE INDEX ix_facturas_venta_numero_factura ON dbo.facturas_venta (numero_factura)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_facturas_venta_cliente_id' AND object_id = OBJECT_ID('dbo.facturas_venta'))
        BEGIN
            CREATE INDEX ix_facturas_venta_cliente_id ON dbo.facturas_venta (cliente_id)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_facturas_venta_fecha_emision' AND object_id = OBJECT_ID('dbo.facturas_venta'))
        BEGIN
            CREATE INDEX ix_facturas_venta_fecha_emision ON dbo.facturas_venta (fecha_emision)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_facturas_venta_estado' AND object_id = OBJECT_ID('dbo.facturas_venta'))
        BEGIN
            CREATE INDEX ix_facturas_venta_estado ON dbo.facturas_venta (estado)
        END
    """)
    
    # ============================================
    # CREAR TABLA items_factura_venta (si no existe)
    # ============================================
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'items_factura_venta' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            CREATE TABLE dbo.items_factura_venta (
                id INTEGER NOT NULL IDENTITY(1,1),
                factura_id INTEGER NOT NULL,
                variante_producto_id INTEGER NOT NULL,
                cantidad NUMERIC(10, 2) NOT NULL,
                precio_unitario NUMERIC(10, 2) NOT NULL,
                descuento NUMERIC(10, 2) NOT NULL DEFAULT 0,
                subtotal NUMERIC(10, 2) NOT NULL,
                CONSTRAINT pk_items_factura_venta PRIMARY KEY (id)
            )
        END
    """)
    
    # Foreign keys para items_factura_venta (solo si no existen)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_items_factura_venta_factura')
        BEGIN
            ALTER TABLE dbo.items_factura_venta
            ADD CONSTRAINT fk_items_factura_venta_factura
            FOREIGN KEY (factura_id) REFERENCES dbo.facturas_venta(id) ON DELETE CASCADE
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_items_factura_venta_variante')
        BEGIN
            ALTER TABLE dbo.items_factura_venta
            ADD CONSTRAINT fk_items_factura_venta_variante
            FOREIGN KEY (variante_producto_id) REFERENCES dbo.variantes_producto(id)
        END
    """)
    
    # Índices para items_factura_venta (solo si no existen y la columna existe)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_factura_venta' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.items_factura_venta') AND name = 'factura_id')
        AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_items_factura_venta_factura_id' AND object_id = OBJECT_ID('dbo.items_factura_venta'))
        BEGIN
            CREATE INDEX ix_items_factura_venta_factura_id ON dbo.items_factura_venta (factura_id)
        END
    """)
    
    # ============================================
    # CREAR TABLA pagos_cliente (si no existe)
    # Si existe, agregar columnas faltantes
    # ============================================
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
            CREATE TABLE dbo.pagos_cliente (
                id INTEGER NOT NULL IDENTITY(1,1),
                cliente_id INTEGER NOT NULL,
                factura_id INTEGER NULL,
                orden_venta_id INTEGER NULL,
                usuario_id INTEGER NULL,
                monto NUMERIC(10, 2) NOT NULL,
                metodo_pago VARCHAR(50) NOT NULL,
                numero_comprobante VARCHAR(100) NULL,
                fecha_pago DATETIME NOT NULL,
                fecha_registro DATETIME NOT NULL,
                observaciones TEXT NULL,
                estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
                CONSTRAINT pk_pagos_cliente PRIMARY KEY (id)
            )
        END
        ELSE
        BEGIN
            -- Agregar columnas faltantes si la tabla ya existe
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'cliente_id')
                ALTER TABLE dbo.pagos_cliente ADD cliente_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'factura_id')
                ALTER TABLE dbo.pagos_cliente ADD factura_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'orden_venta_id')
                ALTER TABLE dbo.pagos_cliente ADD orden_venta_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'usuario_id')
                ALTER TABLE dbo.pagos_cliente ADD usuario_id INTEGER NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'monto')
                ALTER TABLE dbo.pagos_cliente ADD monto NUMERIC(10, 2) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'metodo_pago')
                ALTER TABLE dbo.pagos_cliente ADD metodo_pago VARCHAR(50) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'numero_comprobante')
                ALTER TABLE dbo.pagos_cliente ADD numero_comprobante VARCHAR(100) NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'fecha_pago')
                ALTER TABLE dbo.pagos_cliente ADD fecha_pago DATETIME NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'fecha_registro')
                ALTER TABLE dbo.pagos_cliente ADD fecha_registro DATETIME NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'observaciones')
                ALTER TABLE dbo.pagos_cliente ADD observaciones TEXT NULL;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'estado')
                ALTER TABLE dbo.pagos_cliente ADD estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO';
        END
    """)
    
    # Foreign keys para pagos_cliente (solo si no existen)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'cliente_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_pagos_cliente_cliente')
        BEGIN
            ALTER TABLE dbo.pagos_cliente
            ADD CONSTRAINT fk_pagos_cliente_cliente
            FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id)
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'factura_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_pagos_cliente_factura')
        BEGIN
            ALTER TABLE dbo.pagos_cliente
            ADD CONSTRAINT fk_pagos_cliente_factura
            FOREIGN KEY (factura_id) REFERENCES dbo.facturas_venta(id)
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'orden_venta_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_pagos_cliente_orden_venta')
        BEGIN
            ALTER TABLE dbo.pagos_cliente
            ADD CONSTRAINT fk_pagos_cliente_orden_venta
            FOREIGN KEY (orden_venta_id) REFERENCES dbo.ordenes_venta(id) ON DELETE SET NULL
        END
    """)
    op.execute("""
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
        AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagos_cliente') AND name = 'usuario_id')
        AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_pagos_cliente_usuario')
        BEGIN
            ALTER TABLE dbo.pagos_cliente
            ADD CONSTRAINT fk_pagos_cliente_usuario
            FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id) ON DELETE SET NULL
        END
    """)
    
    # Índices para pagos_cliente (solo si no existen)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_pagos_cliente_cliente_id' AND object_id = OBJECT_ID('dbo.pagos_cliente'))
        BEGIN
            CREATE INDEX ix_pagos_cliente_cliente_id ON dbo.pagos_cliente (cliente_id)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_pagos_cliente_factura_id' AND object_id = OBJECT_ID('dbo.pagos_cliente'))
        BEGIN
            CREATE INDEX ix_pagos_cliente_factura_id ON dbo.pagos_cliente (factura_id)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_pagos_cliente_fecha_pago' AND object_id = OBJECT_ID('dbo.pagos_cliente'))
        BEGIN
            CREATE INDEX ix_pagos_cliente_fecha_pago ON dbo.pagos_cliente (fecha_pago)
        END
    """)
    op.execute("""
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_pagos_cliente_estado' AND object_id = OBJECT_ID('dbo.pagos_cliente'))
        BEGIN
            CREATE INDEX ix_pagos_cliente_estado ON dbo.pagos_cliente (estado)
        END
    """)


def downgrade():
    # Eliminar índices
    op.drop_index('ix_pagos_cliente_estado', table_name='pagos_cliente', schema='dbo')
    op.drop_index('ix_pagos_cliente_fecha_pago', table_name='pagos_cliente', schema='dbo')
    op.drop_index('ix_pagos_cliente_factura_id', table_name='pagos_cliente', schema='dbo')
    op.drop_index('ix_pagos_cliente_cliente_id', table_name='pagos_cliente', schema='dbo')
    op.drop_index('ix_items_factura_venta_factura_id', table_name='items_factura_venta', schema='dbo')
    op.drop_index('ix_facturas_venta_estado', table_name='facturas_venta', schema='dbo')
    op.drop_index('ix_facturas_venta_fecha_emision', table_name='facturas_venta', schema='dbo')
    op.drop_index('ix_facturas_venta_cliente_id', table_name='facturas_venta', schema='dbo')
    op.drop_index('ix_facturas_venta_numero_factura', table_name='facturas_venta', schema='dbo')
    
    # Eliminar tablas (las foreign keys se eliminan automáticamente)
    op.drop_table('pagos_cliente', schema='dbo')
    op.drop_table('items_factura_venta', schema='dbo')
    op.drop_table('facturas_venta', schema='dbo')
