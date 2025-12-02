"""add_performance_indexes

Revision ID: 003_add_performance_indexes
Revises: 002_add_usuario_cliente_relation
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

Optimizaciones de rendimiento:
1. Índices para búsquedas de texto (productos, clientes, usuarios)
2. Índices para filtros por estado y fecha (órdenes, reservas)
3. Índices para foreign keys críticas
4. Índices compuestos para consultas frecuentes
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_performance_indexes'
down_revision = '002_add_usuario_cliente_relation'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # 1. ÍNDICES PARA BÚSQUEDAS DE TEXTO
    # ============================================
    
    # Usuarios - búsqueda por nombre y email
    op.create_index(
        'idx_usuarios_busqueda',
        'usuarios',
        ['nombre_usuario', 'correo'],
        schema='dbo'
    )
    
    # Clientes - búsqueda por nombre y email
    op.create_index(
        'idx_clientes_busqueda',
        'clientes',
        ['nombre', 'correo'],
        schema='dbo'
    )
    
    # Productos - búsqueda por nombre
    op.create_index(
        'idx_productos_nombre',
        'productos',
        ['nombre'],
        schema='dbo'
    )
    
    # Productos - búsqueda por descripción (filtrado, solo valores no-null)
    op.execute("""
        CREATE INDEX idx_productos_descripcion 
        ON dbo.productos (descripcion) 
        WHERE descripcion IS NOT NULL
    """)
    
    # ============================================
    # 2. ÍNDICES PARA FILTROS POR ESTADO Y FECHA
    # ============================================
    
    # Órdenes de venta - filtro por estado y fecha (con ORDER BY DESC)
    op.execute("""
        CREATE INDEX idx_ordenes_venta_estado_fecha 
        ON dbo.ordenes_venta (estado, fecha DESC, id DESC)
    """)
    
    # Órdenes de venta - filtro por cliente y fecha
    op.execute("""
        CREATE INDEX idx_ordenes_venta_cliente_fecha 
        ON dbo.ordenes_venta (cliente_id, fecha DESC)
    """)
    
    # Órdenes de venta - índice compuesto cliente, estado, fecha
    op.execute("""
        CREATE INDEX idx_ordenes_venta_cliente_estado_fecha 
        ON dbo.ordenes_venta (cliente_id, estado, fecha DESC)
    """)
    
    # Órdenes de compra - filtro por estado y fecha
    op.execute("""
        CREATE INDEX idx_ordenes_compra_estado_fecha 
        ON dbo.ordenes_compra (estado, fecha DESC, id DESC)
    """)
    
    # Reservas - filtro por estado y fecha
    op.execute("""
        CREATE INDEX idx_reservas_estado_fecha 
        ON dbo.reservas (estado, fecha_reserva DESC)
    """)
    
    # Usuarios activos - índice filtrado
    op.execute("""
        CREATE INDEX idx_usuarios_activo 
        ON dbo.usuarios (activo) 
        WHERE activo = 1
    """)
    
    # ============================================
    # 3. ÍNDICES PARA FOREIGN KEYS CRÍTICAS
    # ============================================
    
    # Items de orden de venta - por variante
    op.create_index(
        'idx_items_orden_venta_variante',
        'items_orden_venta',
        ['variante_producto_id'],
        schema='dbo'
    )
    
    # Items de orden de venta - por orden
    op.create_index(
        'idx_items_orden_venta_orden',
        'items_orden_venta',
        ['orden_venta_id'],
        schema='dbo'
    )
    
    # Items de orden de compra - por variante
    op.create_index(
        'idx_items_orden_compra_variante',
        'items_orden_compra',
        ['variante_producto_id'],
        schema='dbo'
    )
    
    # Variantes de producto - por producto
    op.create_index(
        'idx_variantes_producto_producto',
        'variantes_producto',
        ['producto_id'],
        schema='dbo'
    )
    
    # Productos - por categoría (filtrado)
    op.execute("""
        CREATE INDEX idx_productos_categoria 
        ON dbo.productos (categoria_id) 
        WHERE categoria_id IS NOT NULL
    """)
    
    # Productos - por marca (filtrado)
    op.execute("""
        CREATE INDEX idx_productos_marca 
        ON dbo.productos (marca_id) 
        WHERE marca_id IS NOT NULL
    """)
    
    # Stock por almacén - índice compuesto
    op.create_index(
        'idx_producto_almacen_variante_almacen',
        'producto_almacen',
        ['variante_producto_id', 'almacen_id'],
        schema='dbo'
    )
    
    # ============================================
    # 4. ÍNDICES COMPUESTOS ADICIONALES
    # ============================================
    
    # Productos - búsqueda por categoría, marca y nombre
    op.create_index(
        'idx_productos_categoria_marca_nombre',
        'productos',
        ['categoria_id', 'marca_id', 'nombre'],
        schema='dbo'
    )
    
    # ============================================
    # 5. ACTUALIZAR ESTADÍSTICAS
    # ============================================
    # Nota: UPDATE STATISTICS se ejecuta automáticamente en SQL Server
    # pero podemos forzarlo para tablas críticas
    op.execute("UPDATE STATISTICS dbo.usuarios")
    op.execute("UPDATE STATISTICS dbo.clientes")
    op.execute("UPDATE STATISTICS dbo.productos")
    op.execute("UPDATE STATISTICS dbo.ordenes_venta")
    op.execute("UPDATE STATISTICS dbo.items_orden_venta")
    op.execute("UPDATE STATISTICS dbo.variantes_producto")
    op.execute("UPDATE STATISTICS dbo.ordenes_compra")
    op.execute("UPDATE STATISTICS dbo.producto_almacen")


def downgrade():
    # Eliminar índices compuestos
    op.drop_index('idx_productos_categoria_marca_nombre', table_name='productos', schema='dbo')
    
    # Eliminar índices de foreign keys
    op.drop_index('idx_producto_almacen_variante_almacen', table_name='producto_almacen', schema='dbo')
    op.drop_index('idx_productos_marca', table_name='productos', schema='dbo')
    op.drop_index('idx_productos_categoria', table_name='productos', schema='dbo')
    op.drop_index('idx_variantes_producto_producto', table_name='variantes_producto', schema='dbo')
    op.drop_index('idx_items_orden_compra_variante', table_name='items_orden_compra', schema='dbo')
    op.drop_index('idx_items_orden_venta_orden', table_name='items_orden_venta', schema='dbo')
    op.drop_index('idx_items_orden_venta_variante', table_name='items_orden_venta', schema='dbo')
    
    # Eliminar índices filtrados (usando SQL directo)
    op.execute("DROP INDEX IF EXISTS idx_usuarios_activo ON dbo.usuarios")
    op.execute("DROP INDEX IF EXISTS idx_productos_descripcion ON dbo.productos")
    
    # Eliminar índices de estado y fecha
    op.drop_index('idx_reservas_estado_fecha', table_name='reservas', schema='dbo')
    op.drop_index('idx_ordenes_compra_estado_fecha', table_name='ordenes_compra', schema='dbo')
    op.drop_index('idx_ordenes_venta_cliente_estado_fecha', table_name='ordenes_venta', schema='dbo')
    op.drop_index('idx_ordenes_venta_cliente_fecha', table_name='ordenes_venta', schema='dbo')
    op.drop_index('idx_ordenes_venta_estado_fecha', table_name='ordenes_venta', schema='dbo')
    
    # Eliminar índices de búsqueda de texto
    op.drop_index('idx_productos_nombre', table_name='productos', schema='dbo')
    op.drop_index('idx_clientes_busqueda', table_name='clientes', schema='dbo')
    op.drop_index('idx_usuarios_busqueda', table_name='usuarios', schema='dbo')

