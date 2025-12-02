"""remove_unused_tables

Revision ID: 004_remove_unused_tables
Revises: 003_add_performance_indexes
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

Elimina tablas no utilizadas en el sistema para optimizar la base de datos.
Mantiene todas las tablas de auditoría y seguridad como se solicitó.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_remove_unused_tables'
down_revision = '003_add_performance_indexes'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================
    # ELIMINAR TABLAS NO UTILIZADAS
    # ============================================
    # NOTA: Las tablas de auditoría se MANTIENEN:
    # - bitacora_auditoria
    # - historial_contrasenas
    # - credenciales_biometricas
    # - metodos_mfa
    #
    # NOTA: NO eliminamos facturas_venta, items_factura_venta, pagos_cliente
    # porque las vamos a implementar
    
    # Primero eliminar foreign keys que referencian tablas que vamos a eliminar
    op.execute("""
        DECLARE @sql NVARCHAR(MAX) = '';
        SELECT @sql += 'ALTER TABLE dbo.' + OBJECT_NAME(parent_object_id) + ' DROP CONSTRAINT ' + name + ';'
        FROM sys.foreign_keys
        WHERE referenced_object_id IN (
            SELECT object_id FROM sys.tables 
            WHERE name IN ('facturas_proveedor', 'items_factura_proveedor', 'pagos_proveedor', 
                          'envios', 'items_envio', 'contactos', 'contactos_proveedor', 'direcciones',
                          'recepciones_mercancia', 'items_recepcion_mercancia', 'conteos_ciclicos',
                          'items_conteo_ciclico', 'ubicaciones_bin', 'lotes', 'listas_precios',
                          'items_lista_precios', 'lotes_ajuste_precios', 'garantias', 'gastos',
                          'programas_fidelidad', 'puntos_fidelidad', 'notificaciones', 
                          'plantillas_notificaciones', 'metodos_pago', 'cuentas_auth_usuarios',
                          'proveedores_autenticacion', 'llaves_api', 'numeros_serie',
                          'periodos_fiscales', 'lineas_financieras', 'producto_proveedor',
                          'reglas_reposicion', 'cierre_categoria', 'intenciones_chatbot',
                          'mensajes_chatbot', 'registros_entrenamiento_ai', 
                          'sugerencias_reposicion_ai', 'horarios_sucursal')
            AND schema_id = SCHEMA_ID('dbo')
        );
        EXEC sp_executesql @sql;
    """)
    
    # Lista de tablas a eliminar (en orden de dependencias)
    # NOTA: NO eliminamos facturas_venta, items_factura_venta, pagos_cliente
    tables_to_drop = [
        # Tablas de contactos y direcciones
        'contactos',
        'contactos_proveedor',
        'direcciones',
        
        # Tablas de empresas y sucursales (no implementadas completamente)
        'horarios_sucursal',
        
        # Tablas de facturación de proveedores (no usamos)
        'facturas_proveedor',
        'items_factura_proveedor',
        
        # Tablas de pagos a proveedores (no gestionamos)
        'pagos_proveedor',
        
        # Tablas de envíos (no gestionamos envíos separados)
        'envios',
        'items_envio',
        
        # Tablas de recepción de mercancía
        'recepciones_mercancia',
        'items_recepcion_mercancia',
        
        # Tablas de inventario avanzado
        'conteos_ciclicos',
        'items_conteo_ciclico',
        'ubicaciones_bin',
        'lotes',
        
        # Tablas de precios y listas
        'listas_precios',
        'items_lista_precios',
        'lotes_ajuste_precios',
        
        # Tablas de garantías y servicios
        'garantias',
        
        # Tablas de gastos
        'gastos',
        
        # Tablas de fidelización
        'programas_fidelidad',
        'puntos_fidelidad',
        
        # Tablas de notificaciones
        'notificaciones',
        'plantillas_notificaciones',
        
        # Tablas de métodos de pago
        'metodos_pago',
        
        # Tablas de autenticación externa
        'cuentas_auth_usuarios',
        'proveedores_autenticacion',
        
        # Tablas de API
        'llaves_api',
        
        # Tablas de números de serie
        'numeros_serie',
        
        # Tablas de períodos fiscales
        'periodos_fiscales',
        
        # Tablas de líneas financieras
        'lineas_financieras',
        
        # Tablas de producto-proveedor
        'producto_proveedor',
        
        # Tablas de reglas de reposición
        'reglas_reposicion',
        
        # Tablas de cierre de categorías (no implementado)
        'cierre_categoria',
        
        # Tablas de atributos (no implementado activamente)
        # NOTA: Mantenemos 'atributos', 'valores_atributos', 'valores_atributo_variante'
        # porque están en el modelo ORM aunque no se usen activamente
        
        # Tablas de chatbot e IA
        'intenciones_chatbot',
        'mensajes_chatbot',
        'registros_entrenamiento_ai',
        'sugerencias_reposicion_ai',
    ]
    
    # Eliminar tablas que existen
    for table_name in tables_to_drop:
        op.execute(f"""
            IF EXISTS (SELECT * FROM sys.tables WHERE name = '{table_name}' AND schema_id = SCHEMA_ID('dbo'))
            BEGIN
                DROP TABLE dbo.{table_name};
            END
        """)


def downgrade():
    # NOTA: No podemos recrear las tablas eliminadas sin conocer su estructura exacta
    # Si necesitas revertir, deberás restaurar desde un backup
    # Por eso este downgrade está vacío - es una operación destructiva
    pass


