from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.venta import OrdenVenta
from app.repositories.sale_repo import SaleFilter, SaleRepository
from app.schemas.sale import (
    SaleCustomer,
    SaleItemResponse,
    SaleOrderListResponse,
    SaleOrderResponse,
    SaleUser,
)


@dataclass(slots=True)
class SaleService:
    db: Session
    _repo: SaleRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = SaleRepository(self.db)

    def list_orders(
        self,
        *,
        customer_id: Optional[int],
        estado: Optional[str],
        page: int,
        page_size: int,
    ) -> SaleOrderListResponse:
        filters = SaleFilter(customer_id=customer_id, estado=estado)
        orders, total = self._repo.list(filters, page, page_size)
        items = [self._map_order(order) for order in orders]
        return SaleOrderListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_order(self, order_id: int) -> SaleOrderResponse:
        order = self._repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de venta no encontrada")
        return self._map_order(order)

    def _map_order(self, order: OrdenVenta) -> SaleOrderResponse:
        total = 0.0
        items: list[SaleItemResponse] = []
        for item in order.items:
            price = float(item.precio_unitario) if item.precio_unitario is not None else 0.0
            total += float(item.cantidad) * price
            items.append(
                SaleItemResponse(
                    id=item.id,
                    variante_producto_id=item.variante_producto_id,
                    variante_nombre=item.variante.nombre if item.variante else None,
                    cantidad=float(item.cantidad),
                    precio_unitario=price if item.precio_unitario is not None else None,
                )
            )
        cliente = (
            SaleCustomer(id=order.cliente.id, nombre=order.cliente.nombre) if order.cliente else None
        )
        usuario = (
            SaleUser(id=order.usuario.id, nombre_usuario=order.usuario.nombre_usuario) if order.usuario else None
        )
        return SaleOrderResponse(
            id=order.id,
            fecha=order.fecha,
            estado=order.estado,
            cliente=cliente,
            usuario=usuario,
            items=items,
            total=round(total, 2),
        )

