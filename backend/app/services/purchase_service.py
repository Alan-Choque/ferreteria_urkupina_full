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
from app.schemas.purchase_status import (
    PurchaseCloseRequest,
    PurchaseConfirmRequest,
    PurchaseInvoiceRequest,
    PurchaseOrderCreateRequest,
    PurchaseOrderUpdateRequest,
    PurchaseReceiveRequest,
    PurchaseRejectRequest,
    PurchaseSendRequest,
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
            fecha_envio=order.fecha_envio,
            fecha_confirmacion=order.fecha_confirmacion,
            fecha_recepcion=order.fecha_recepcion,
            fecha_facturacion=order.fecha_facturacion,
            fecha_cierre=order.fecha_cierre,
            numero_factura_proveedor=order.numero_factura_proveedor,
            observaciones=order.observaciones,
        )

    def create_order(
        self,
        payload: PurchaseOrderCreateRequest,
        usuario_id: Optional[int] = None,
    ) -> PurchaseOrderResponse:
        from datetime import datetime

        if not payload.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden debe tener al menos un item"
            )

        items_data = []
        for item in payload.items:
            items_data.append({
                "variante_producto_id": item.variante_producto_id,
                "cantidad": item.cantidad,
                "precio_unitario": item.precio_unitario,
            })

        orden = self._repo.create(
            proveedor_id=payload.proveedor_id,
            items=items_data,
            estado="BORRADOR",  # Asegurar que siempre sea mayúsculas
            usuario_id=usuario_id,
            observaciones=payload.observaciones,
        )

        return self._map_order(orden)

    def update_order(
        self,
        order_id: int,
        payload: PurchaseOrderUpdateRequest,
    ) -> PurchaseOrderResponse:
        import logging

        logger = logging.getLogger(__name__)

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        # Normalizar el estado para comparación (mayúsculas y sin espacios)
        estado_actual = orden.estado.strip().upper() if orden.estado else ""
        
        # Mapear estados antiguos a nuevos para compatibilidad
        estado_mapeado = {
            "DRAFT": "BORRADOR",
            "PARTIAL": "RECIBIDO",  # partial no se puede editar, pero lo mapeamos para el mensaje
        }.get(estado_actual, estado_actual)
        
        logger.info(f"Intentando editar orden {order_id}. Estado actual: '{orden.estado}' (normalizado: '{estado_actual}', mapeado: '{estado_mapeado}')")

        if estado_mapeado != "BORRADOR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se pueden editar órdenes en estado BORRADOR. Estado actual: {orden.estado}"
            )

        data = {}
        if payload.proveedor_id is not None:
            data["proveedor_id"] = payload.proveedor_id
        if payload.items is not None:
            if not payload.items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La orden debe tener al menos un item"
                )
            items_data = []
            for item in payload.items:
                items_data.append({
                    "variante_producto_id": item.variante_producto_id,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                })
            data["items"] = items_data
        if payload.observaciones is not None:
            data["observaciones"] = payload.observaciones

        if data:
            orden = self._repo.update(orden, data)

        return self._map_order(orden)

    def send_order(
        self,
        order_id: int,
        payload: PurchaseSendRequest,
    ) -> PurchaseOrderResponse:
        from datetime import datetime
        import logging

        logger = logging.getLogger(__name__)

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        # Normalizar el estado para comparación (mayúsculas y sin espacios)
        estado_actual = orden.estado.strip().upper() if orden.estado else ""
        
        # Mapear estados antiguos a nuevos para compatibilidad
        estado_mapeado = {
            "DRAFT": "BORRADOR",
        }.get(estado_actual, estado_actual)
        
        logger.info(f"Intentando enviar orden {order_id}. Estado actual: '{orden.estado}' (normalizado: '{estado_actual}', mapeado: '{estado_mapeado}')")

        if estado_mapeado != "BORRADOR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se pueden enviar órdenes en estado BORRADOR. Estado actual: {orden.estado}"
            )

        orden.estado = "ENVIADO"
        orden.fecha_envio = datetime.now()
        if payload.observaciones:
            orden.observaciones = payload.observaciones

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

    def confirm_order(
        self,
        order_id: int,
        payload: PurchaseConfirmRequest,
    ) -> PurchaseOrderResponse:
        from datetime import datetime

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        if orden.estado != "ENVIADO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden confirmar órdenes en estado ENVIADO"
            )

        orden.estado = "CONFIRMADO"
        orden.fecha_confirmacion = datetime.now()
        if payload.observaciones:
            orden.observaciones = payload.observaciones

        # Si el proveedor actualiza items (precios/cantidades)
        if payload.items:
            # Eliminar items existentes y crear nuevos
            for item in orden.items:
                self.db.delete(item)
            from decimal import Decimal
            from app.models.compra import ItemOrdenCompra
            for item_data in payload.items:
                item = ItemOrdenCompra(
                    orden_compra_id=orden.id,
                    variante_producto_id=item_data.variante_producto_id,
                    cantidad=Decimal(str(item_data.cantidad)),
                    precio_unitario=Decimal(str(item_data.precio_unitario)) if item_data.precio_unitario else None,
                )
                self.db.add(item)

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

    def reject_order(
        self,
        order_id: int,
        payload: PurchaseRejectRequest,
    ) -> PurchaseOrderResponse:

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        if orden.estado != "ENVIADO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden rechazar órdenes en estado ENVIADO"
            )

        orden.estado = "RECHAZADO"
        orden.observaciones = f"Rechazado: {payload.motivo}"

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

    def receive_order(
        self,
        order_id: int,
        payload: PurchaseReceiveRequest,
        usuario_id: Optional[int] = None,
    ) -> PurchaseOrderResponse:
        from datetime import datetime
        from decimal import Decimal
        from app.models.compra import ItemOrdenCompra

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        if orden.estado not in ("CONFIRMADO", "ENVIADO"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden recibir órdenes en estado CONFIRMADO o ENVIADO"
            )

        orden.estado = "RECIBIDO"
        orden.fecha_recepcion = datetime.now()
        if payload.observaciones:
            orden.observaciones = payload.observaciones

        # Actualizar items con cantidades recibidas
        # Eliminar items existentes y crear nuevos con cantidades recibidas
        for item in orden.items:
            self.db.delete(item)

        for item_data in payload.items:
            item = ItemOrdenCompra(
                orden_compra_id=orden.id,
                variante_producto_id=item_data.variante_producto_id,
                cantidad=Decimal(str(item_data.cantidad)),
                precio_unitario=Decimal(str(item_data.precio_unitario)) if item_data.precio_unitario else None,
            )
            self.db.add(item)

        # TODO: Actualizar inventario con las cantidades recibidas
        # Esto se implementará después

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

    def invoice_order(
        self,
        order_id: int,
        payload: PurchaseInvoiceRequest,
        usuario_id: Optional[int] = None,
    ) -> PurchaseOrderResponse:
        from datetime import datetime

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        if orden.estado != "RECIBIDO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden facturar órdenes en estado RECIBIDO"
            )

        orden.estado = "FACTURADO"
        orden.fecha_facturacion = datetime.now()
        orden.numero_factura_proveedor = payload.numero_factura_proveedor
        if payload.observaciones:
            orden.observaciones = payload.observaciones

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

    def close_order(
        self,
        order_id: int,
        payload: PurchaseCloseRequest,
    ) -> PurchaseOrderResponse:
        from datetime import datetime

        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de compra no encontrada")

        if orden.estado != "FACTURADO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden cerrar órdenes en estado FACTURADO"
            )

        orden.estado = "CERRADO"
        orden.fecha_cierre = datetime.now()
        if payload.observaciones:
            orden.observaciones = payload.observaciones

        self.db.commit()
        self.db.refresh(orden)

        return self._map_order(orden)

