from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.compra import ItemOrdenCompra, OrdenCompra


@dataclass(slots=True)
class PurchaseFilter:
    supplier_id: Optional[int] = None
    estado: Optional[str] = None


class PurchaseRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(OrdenCompra)
            .options(
                joinedload(OrdenCompra.proveedor),
                joinedload(OrdenCompra.usuario),
                joinedload(OrdenCompra.items).joinedload(ItemOrdenCompra.variante),
            )
        )

    def _apply_filters(self, stmt, filters: PurchaseFilter):
        if filters.supplier_id:
            stmt = stmt.where(OrdenCompra.proveedor_id == filters.supplier_id)
        if filters.estado:
            stmt = stmt.where(OrdenCompra.estado == filters.estado)
        return stmt

    def list(self, filters: PurchaseFilter, page: int, page_size: int) -> tuple[list[OrdenCompra], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(OrdenCompra.fecha.desc(), OrdenCompra.id.desc()), filters
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(OrdenCompra), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).unique()
        rows: Sequence[OrdenCompra] = result.scalars().all()
        return list(rows), total

    def get(self, order_id: int) -> OrdenCompra | None:
        stmt = self._base_stmt().where(OrdenCompra.id == order_id)
        return self._db.scalars(stmt).first()

    def create(
        self,
        proveedor_id: int,
        items: list[dict],
        estado: str = "BORRADOR",
        usuario_id: Optional[int] = None,
        observaciones: Optional[str] = None,
    ) -> OrdenCompra:
        from datetime import datetime
        from decimal import Decimal
        from app.models.compra import ItemOrdenCompra

        orden = OrdenCompra(
            proveedor_id=proveedor_id,
            fecha=datetime.now(),
            estado=estado,
            usuario_id=usuario_id,
            observaciones=observaciones,
        )
        self._db.add(orden)
        self._db.flush()

        for item_data in items:
            item = ItemOrdenCompra(
                orden_compra_id=orden.id,
                variante_producto_id=item_data["variante_producto_id"],
                cantidad=Decimal(str(item_data["cantidad"])),
                precio_unitario=Decimal(str(item_data["precio_unitario"])) if item_data.get("precio_unitario") else None,
            )
            self._db.add(item)

        self._db.commit()
        self._db.refresh(orden)
        return orden

    def update(self, orden: OrdenCompra, data: dict) -> OrdenCompra:
        from decimal import Decimal
        from app.models.compra import ItemOrdenCompra

        if "proveedor_id" in data:
            orden.proveedor_id = data["proveedor_id"]
        if "observaciones" in data:
            orden.observaciones = data["observaciones"]
        if "items" in data:
            # Eliminar items existentes
            for item in orden.items:
                self._db.delete(item)
            # Agregar nuevos items
            for item_data in data["items"]:
                item = ItemOrdenCompra(
                    orden_compra_id=orden.id,
                    variante_producto_id=item_data["variante_producto_id"],
                    cantidad=Decimal(str(item_data["cantidad"])),
                    precio_unitario=Decimal(str(item_data["precio_unitario"])) if item_data.get("precio_unitario") else None,
                )
                self._db.add(item)

        self._db.commit()
        self._db.refresh(orden)
        return orden

