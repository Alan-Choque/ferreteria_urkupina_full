from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.factura import FacturaVenta, ItemFacturaVenta


@dataclass(slots=True)
class InvoiceFilter:
    cliente_id: Optional[int] = None
    usuario_id: Optional[int] = None
    estado: Optional[str] = None
    numero_factura: Optional[str] = None


class InvoiceRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(FacturaVenta)
            .options(
                joinedload(FacturaVenta.cliente),
                joinedload(FacturaVenta.usuario),
                joinedload(FacturaVenta.orden_venta),
                joinedload(FacturaVenta.items).joinedload(ItemFacturaVenta.variante),
            )
        )

    def _apply_filters(self, stmt, filters: InvoiceFilter):
        if filters.cliente_id:
            stmt = stmt.where(FacturaVenta.cliente_id == filters.cliente_id)
        if filters.usuario_id:
            stmt = stmt.where(FacturaVenta.usuario_id == filters.usuario_id)
        if filters.estado:
            stmt = stmt.where(FacturaVenta.estado == filters.estado)
        if filters.numero_factura:
            stmt = stmt.where(FacturaVenta.numero_factura == filters.numero_factura)
        return stmt

    def list(self, filters: InvoiceFilter, page: int, page_size: int) -> tuple[list[FacturaVenta], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(FacturaVenta.fecha_emision.desc(), FacturaVenta.id.desc()),
            filters,
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(FacturaVenta), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).unique()
        return list(result.scalars().all()), total

    def get(self, invoice_id: int) -> Optional[FacturaVenta]:
        stmt = self._base_stmt().where(FacturaVenta.id == invoice_id)
        result = self._db.execute(stmt).unique()
        return result.scalar_one_or_none()

    def get_by_number(self, numero_factura: str) -> Optional[FacturaVenta]:
        stmt = self._base_stmt().where(FacturaVenta.numero_factura == numero_factura)
        result = self._db.execute(stmt).unique()
        return result.scalar_one_or_none()

    def create(self, **kwargs) -> FacturaVenta:
        invoice = FacturaVenta(**kwargs)
        self._db.add(invoice)
        self._db.flush()
        return invoice

    def get_next_invoice_number(self) -> str:
        """Genera el siguiente número de factura secuencial"""
        # Obtener el último número de factura
        last_invoice = (
            self._db.query(FacturaVenta)
            .order_by(FacturaVenta.id.desc())
            .first()
        )
        
        if not last_invoice:
            # Primera factura
            return "FAC-000001"
        
        # Extraer el número del último número de factura
        try:
            # Asumiendo formato FAC-XXXXXX
            if last_invoice.numero_factura and last_invoice.numero_factura.startswith("FAC-"):
                last_num = int(last_invoice.numero_factura.split("-")[1])
                next_num = last_num + 1
            else:
                # Si no tiene formato, usar el ID
                next_num = last_invoice.id + 1
        except (ValueError, AttributeError):
            # Si falla, usar el ID
            next_num = last_invoice.id + 1
        
        return f"FAC-{next_num:06d}"

