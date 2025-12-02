"""Migrate purchase order statuses from old to new format

Revision ID: 006_migrate_purchase_statuses
Revises: 005_add_purchase_order_fields
Create Date: 2024-01-XX XX:XX:XX.XXXXXX
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_migrate_purchase_statuses'
down_revision = '005_add_purchase_order_fields'
branch_labels = None
depends_on = None


def upgrade():
    """
    Migrate old purchase order statuses to new format:
    - draft -> BORRADOR
    - sent -> ENVIADO
    - received -> RECIBIDO
    - partial -> RECIBIDO (as partial receipt is still received)
    - canceled -> RECHAZADO
    """
    op.execute("""
        UPDATE dbo.ordenes_compra
        SET estado = CASE 
            WHEN estado = 'draft' THEN 'BORRADOR'
            WHEN estado = 'sent' THEN 'ENVIADO'
            WHEN estado = 'received' THEN 'RECIBIDO'
            WHEN estado = 'partial' THEN 'RECIBIDO'
            WHEN estado = 'canceled' THEN 'RECHAZADO'
            WHEN estado = 'BORRADOR' THEN 'BORRADOR'
            WHEN estado = 'ENVIADO' THEN 'ENVIADO'
            WHEN estado = 'CONFIRMADO' THEN 'CONFIRMADO'
            WHEN estado = 'RECHAZADO' THEN 'RECHAZADO'
            WHEN estado = 'RECIBIDO' THEN 'RECIBIDO'
            WHEN estado = 'FACTURADO' THEN 'FACTURADO'
            WHEN estado = 'CERRADO' THEN 'CERRADO'
            ELSE estado
        END
        WHERE estado IN ('draft', 'sent', 'received', 'partial', 'canceled')
           OR LOWER(estado) IN ('draft', 'sent', 'received', 'partial', 'canceled')
           OR estado NOT IN ('BORRADOR', 'ENVIADO', 'CONFIRMADO', 'RECHAZADO', 'RECIBIDO', 'FACTURADO', 'CERRADO')
    """)


def downgrade():
    """
    Revert to old status format (if needed):
    - BORRADOR -> draft
    - ENVIADO -> sent
    - RECIBIDO -> received
    - RECHAZADO -> canceled
    """
    op.execute("""
        UPDATE dbo.ordenes_compra
        SET estado = CASE 
            WHEN estado = 'BORRADOR' THEN 'draft'
            WHEN estado = 'ENVIADO' THEN 'sent'
            WHEN estado = 'RECIBIDO' THEN 'received'
            WHEN estado = 'RECHAZADO' THEN 'canceled'
            ELSE estado
        END
        WHERE estado IN ('BORRADOR', 'ENVIADO', 'RECIBIDO', 'RECHAZADO', 'FACTURADO', 'CERRADO', 'CONFIRMADO')
    """)

