"""add_usuario_cliente_relation

Revision ID: 002_add_usuario_cliente_relation
Revises: 001_add_idempotency_keys
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

Mejoras críticas a la base de datos:
1. Agregar relación usuario_id en Cliente (ForeignKey a usuarios.id)
2. Agregar índices para mejorar rendimiento en búsquedas frecuentes
3. Vincular clientes existentes con usuarios cuando sea posible
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import String, Integer, ForeignKey, Index

# revision identifiers, used by Alembic.
revision = '002_add_usuario_cliente_relation'
down_revision = '001_add_idempotency_keys'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Agregar columna usuario_id en clientes
    op.add_column(
        'clientes',
        sa.Column('usuario_id', Integer(), nullable=True),
        schema='dbo'
    )
    
    # 2. Vincular clientes existentes con usuarios ANTES de crear el índice único
    # Esto evita problemas con múltiples NULLs
    op.execute("""
        UPDATE dbo.clientes
        SET usuario_id = (
            SELECT TOP 1 id 
            FROM dbo.usuarios 
            WHERE LOWER(LTRIM(RTRIM(usuarios.correo))) = LOWER(LTRIM(RTRIM(clientes.correo)))
            AND clientes.correo IS NOT NULL
            AND clientes.correo != ''
        )
        WHERE usuario_id IS NULL
        AND correo IS NOT NULL
        AND correo != ''
    """)
    
    # 3. Crear ForeignKey de clientes.usuario_id -> usuarios.id
    # Nota: En SQL Server con Alembic, usar source_schema y referent_schema
    op.create_foreign_key(
        'fk_clientes_usuario_id_usuarios',
        'clientes',
        'usuarios',
        ['usuario_id'],
        ['id'],
        source_schema='dbo',
        referent_schema='dbo',
        ondelete='SET NULL'  # Si se elimina usuario, cliente.usuario_id se pone NULL (mantiene historial)
    )
    
    # 4. Crear índice único filtrado en usuario_id (un usuario solo puede tener UN cliente)
    # El índice filtrado permite múltiples NULLs pero solo un valor no-null por usuario
    op.execute("""
        CREATE UNIQUE INDEX uq_clientes_usuario_id 
        ON dbo.clientes (usuario_id) 
        WHERE usuario_id IS NOT NULL
    """)
    
    # 4. Crear índices para mejorar rendimiento en búsquedas frecuentes
    # Índice en clientes.correo (para búsquedas por email)
    op.create_index(
        'ix_clientes_correo',
        'clientes',
        ['correo'],
        schema='dbo'
    )
    
    # Índice en usuarios.correo (para login)
    op.create_index(
        'ix_usuarios_correo',
        'usuarios',
        ['correo'],
        schema='dbo'
    )
    
    # Índice en usuarios.nombre_usuario (para búsquedas por username)
    op.create_index(
        'ix_usuarios_nombre_usuario',
        'usuarios',
        ['nombre_usuario'],
        schema='dbo'
    )
    


def downgrade():
    # Eliminar índices
    op.drop_index('ix_usuarios_nombre_usuario', table_name='usuarios', schema='dbo')
    op.drop_index('ix_usuarios_correo', table_name='usuarios', schema='dbo')
    op.drop_index('ix_clientes_correo', table_name='clientes', schema='dbo')
    op.drop_index('uq_clientes_usuario_id', table_name='clientes', schema='dbo')
    
    # Eliminar ForeignKey
    op.drop_constraint('fk_clientes_usuario_id_usuarios', 'clientes', schema='dbo', type_='foreignkey')
    
    # Eliminar columna usuario_id
    op.drop_column('clientes', 'usuario_id', schema='dbo')

