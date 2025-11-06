"""add_idempotency_keys_table

Revision ID: 001_add_idempotency_keys
Revises: 
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import String, Integer, DateTime, Text, Index

# revision identifiers, used by Alembic.
revision = '001_add_idempotency_keys'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Crear tabla idempotency_keys en schema dbo
    op.create_table(
        'idempotency_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('route', sa.String(length=255), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('request_hash', sa.String(length=64), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('response_body', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        schema='dbo'
    )
    
    # Crear PK
    op.create_primary_key(
        'pk_idempotency_keys',
        'idempotency_keys',
        ['id'],
        schema='dbo'
    )
    
    # Crear índice único en key
    op.create_index(
        'uq_idempotency_keys_key',
        'idempotency_keys',
        ['key'],
        unique=True,
        schema='dbo'
    )
    
    # Crear índice compuesto en (key, route, method)
    op.create_index(
        'idx_idempotency_key_route',
        'idempotency_keys',
        ['key', 'route', 'method'],
        schema='dbo'
    )


def downgrade():
    # Eliminar índices
    op.drop_index('idx_idempotency_key_route', table_name='idempotency_keys', schema='dbo')
    op.drop_index('uq_idempotency_keys_key', table_name='idempotency_keys', schema='dbo')
    
    # Eliminar tabla
    op.drop_table('idempotency_keys', schema='dbo')

