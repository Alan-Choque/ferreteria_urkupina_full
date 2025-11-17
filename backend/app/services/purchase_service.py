from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.compra import OrdenCompra
from app.repositories.purchase_repo import PurchaseFilter, PurchaseRepository
from app.schemas.purchase import (
    PurchaseItemResponse,
    PurchaseOrderListResponse,
    PurchaseOrderResponse,
    PurchaseSupplier,
    PurchaseUser,
)


@dataclass(slots=True)
class PurchaseService:
    db: Session
    _repo: PurchaseRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = PurchaseRepository(self.db)

    def list_orders(
        self,
        *,
        supplier_id: Optional[int],
        estado: Optional[str],
        page: int,
        page_size: int,
    ) -> PurchaseOrderListResponse:
        filters = PurchaseFilter(supplier_id=supplier_id, estado=estado)
        orders, total = self._repo.list(filters, page, page_size)
        items = [self._map_order(order) for order in orders]
        return PurchaseOrderListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_order(self, order_id: int) -> PurchaseOrderResponse:
        order = self._repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")
        return self._map_order(order)

    def _map_order(self, order: OrdenCompra) -> PurchaseOrderResponse:
        total = 0.0
        items: list[PurchaseItemResponse] = []
        for item in order.items:
            price = float(item.precio_unitario) if item.precio_unitario is not None else 0.0
            line_total = float(item.cantidad) * price
            total += line_total
            items.append(
                PurchaseItemResponse(
                    id=item.id,
                    variante_producto_id=item.variante_producto_id,
                    variante_nombre=item.variante.nombre if item.variante else None,
                    cantidad=float(item.cantidad),
                    precio_unitario=price if item.precio_unitario is not None else None,
                )
            )
        proveedor = (
            PurchaseSupplier(id=order.proveedor.id, nombre=order.proveedor.nombre)
            if order.proveedor
            else None
        )
        usuario = (
            PurchaseUser(id=order.usuario.id, nombre_usuario=order.usuario.nombre_usuario)
            if order.usuario
            else None
        )
        return PurchaseOrderResponse(
            id=order.id,
            fecha=order.fecha,
            estado=order.estado,
            proveedor=proveedor,
            usuario=usuario,
            items=items,
            total=round(total, 2),
        )

