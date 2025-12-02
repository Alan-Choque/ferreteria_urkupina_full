from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.reserva import ItemReserva, Reserva
from app.repositories.reservation_repo import ReservationFilter, ReservationRepository
from app.schemas.reservation import (
    ReservationCustomer,
    ReservationItemResponse,
    ReservationListResponse,
    ReservationResponse,
    ReservationUser,
)


@dataclass(slots=True)
class ReservationService:
    db: Session
    _repo: ReservationRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = ReservationRepository(self.db)

    def list_reservations(
        self,
        *,
        customer_id: Optional[int],
        estado: Optional[str],
        page: int,
        page_size: int,
    ) -> ReservationListResponse:
        filters = ReservationFilter(customer_id=customer_id, estado=estado)
        reservations, total = self._repo.list(filters, page, page_size)
        items = [self._map_reservation(reservation) for reservation in reservations]
        return ReservationListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_reservation(self, reservation_id: int) -> ReservationResponse:
        reservation = self._repo.get(reservation_id)
        if not reservation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")
        return self._map_reservation(reservation)

    def _map_reservation(self, reservation: Reserva) -> ReservationResponse:
        cliente = (
            ReservationCustomer(id=reservation.cliente.id, nombre=reservation.cliente.nombre)
            if reservation.cliente
            else None
        )
        usuario = (
            ReservationUser(id=reservation.usuario.id, nombre_usuario=reservation.usuario.nombre_usuario)
            if reservation.usuario
            else None
        )
        items = [
            ReservationItemResponse(
                id=item.id,
                variante_producto_id=item.variante_producto_id,
                variante_nombre=item.variante.nombre if item.variante else None,
                cantidad=float(item.cantidad),
            )
            for item in reservation.items
        ]
        return ReservationResponse(
            id=reservation.id,
            fecha_reserva=reservation.fecha_reserva,
            estado=reservation.estado,
            cliente=cliente,
            usuario=usuario,
            items=items,
            monto_anticipio=float(reservation.monto_anticipio) if reservation.monto_anticipio else None,
            fecha_anticipio=reservation.fecha_anticipio,
            metodo_pago_anticipio=reservation.metodo_pago_anticipio,
            numero_comprobante_anticipio=reservation.numero_comprobante_anticipio,
            fecha_confirmacion=reservation.fecha_confirmacion,
            fecha_recordatorio=reservation.fecha_recordatorio,
            fecha_completado=reservation.fecha_completado,
            orden_venta_id=reservation.orden_venta_id,
            observaciones=reservation.observaciones,
        )

    def check_availability(self, variante_producto_id: int, cantidad: float) -> dict:
        """
        Consulta la disponibilidad de un producto.
        Retorna información sobre stock disponible.
        """
        from app.models.producto_almacen import ProductoAlmacen
        from sqlalchemy import func

        # Obtener stock total de la variante
        stock_total = (
            self.db.query(func.sum(ProductoAlmacen.cantidad_disponible))
            .filter(ProductoAlmacen.variante_producto_id == variante_producto_id)
            .scalar() or 0.0
        )

        # Obtener reservas pendientes/confirmadas que afectan el stock
        reservas_activas = (
            self.db.query(func.sum(ItemReserva.cantidad))
            .join(Reserva)
            .filter(
                ItemReserva.variante_producto_id == variante_producto_id,
                Reserva.estado.in_(["PENDIENTE", "CONFIRMADA"]),
            )
            .scalar() or 0.0
        )

        disponible = float(stock_total) - float(reservas_activas)
        suficiente = disponible >= cantidad

        return {
            "variante_producto_id": variante_producto_id,
            "stock_total": float(stock_total),
            "reservado": float(reservas_activas),
            "disponible": disponible,
            "solicitado": cantidad,
            "suficiente": suficiente,
        }

    def create_reservation(
        self,
        payload,
        usuario_id: Optional[int] = None,
    ) -> ReservationResponse:
        """
        Crea una nueva reserva.
        Si usuario_id está presente, se usa el cliente asociado.
        """
        from datetime import datetime
        from app.models.cliente import Cliente

        # Determinar cliente_id
        cliente_id = payload.cliente_id
        if not cliente_id and usuario_id:
            # Buscar cliente asociado al usuario
            cliente = (
                self.db.query(Cliente)
                .filter(Cliente.usuario_id == usuario_id)
                .first()
            )
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se encontró un cliente asociado a tu cuenta. Por favor, completa tu perfil."
                )
            cliente_id = cliente.id

        if not cliente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere un cliente_id o un usuario autenticado"
            )

        # Verificar disponibilidad de todos los items
        for item in payload.items:
            availability = self.check_availability(item["variante_producto_id"], item["cantidad"])
            if not availability["suficiente"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para la variante {item['variante_producto_id']}. Disponible: {availability['disponible']}, Solicitado: {item['cantidad']}"
                )

        # Crear la reserva
        items_data = [
            {
                "variante_producto_id": item["variante_producto_id"],
                "cantidad": item["cantidad"],
            }
            for item in payload.items
        ]

        reserva = self._repo.create(
            cliente_id=cliente_id,
            items=items_data,
            usuario_id=usuario_id,
            fecha_reserva=payload.fecha_reserva,
            observaciones=payload.observaciones,
        )

        return self._map_reservation(reserva)

    def cancel_reservation(self, reservation_id: int, motivo: Optional[str] = None) -> ReservationResponse:
        """Cancela una reserva."""
        from datetime import datetime

        reserva = self._repo.get(reservation_id)
        if not reserva:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

        if reserva.estado == "CANCELADA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La reserva ya está cancelada"
            )

        if reserva.estado == "COMPLETADA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cancelar una reserva completada"
            )

        reserva.estado = "CANCELADA"
        if motivo:
            reserva.observaciones = (reserva.observaciones or "") + f"\n[Motivo cancelación: {motivo}]"

        self.db.commit()
        self.db.refresh(reserva)
        return self._map_reservation(reserva)

    def process_deposit(
        self,
        reservation_id: int,
        payload,
    ) -> ReservationResponse:
        """Procesa el anticipio de una reserva."""
        from datetime import datetime
        from decimal import Decimal

        reserva = self._repo.get(reservation_id)
        if not reserva:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

        if reserva.estado != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se puede procesar anticipio en reservas PENDIENTES. Estado actual: {reserva.estado}"
            )

        reserva.monto_anticipio = Decimal(str(payload.monto))
        reserva.fecha_anticipio = datetime.now()
        reserva.metodo_pago_anticipio = payload.metodo_pago
        reserva.numero_comprobante_anticipio = payload.numero_comprobante
        reserva.estado = "CONFIRMADA"
        reserva.fecha_confirmacion = datetime.now()

        if payload.observaciones:
            reserva.observaciones = (reserva.observaciones or "") + f"\n[Anticipo: {payload.observaciones}]"

        self.db.commit()
        self.db.refresh(reserva)
        return self._map_reservation(reserva)

    def send_confirmation(
        self,
        reservation_id: int,
        payload,
    ) -> ReservationResponse:
        """Envía confirmación/recordatorio de una reserva."""
        from datetime import datetime, timedelta

        reserva = self._repo.get(reservation_id)
        if not reserva:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

        if reserva.estado != "CONFIRMADA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se puede enviar confirmación a reservas CONFIRMADAS. Estado actual: {reserva.estado}"
            )

        reserva.fecha_confirmacion = datetime.now()
        if payload.enviar_recordatorio:
            reserva.fecha_recordatorio = payload.fecha_recordatorio or (datetime.now() + timedelta(days=1))

        if payload.observaciones:
            reserva.observaciones = (reserva.observaciones or "") + f"\n[Confirmación: {payload.observaciones}]"

        self.db.commit()
        self.db.refresh(reserva)
        return self._map_reservation(reserva)

    def complete_reservation(
        self,
        reservation_id: int,
        payload,
        usuario_id: Optional[int] = None,
    ) -> ReservationResponse:
        """Completa una reserva creando una orden de venta."""
        from datetime import datetime
        from decimal import Decimal
        from app.services.sale_service import SaleService
        from app.schemas.sale import SaleOrderCreateRequest, SaleOrderItemRequest

        reserva = self._repo.get(reservation_id)
        if not reserva:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

        if reserva.estado != "CONFIRMADA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se pueden completar reservas CONFIRMADAS. Estado actual: {reserva.estado}"
            )

        # Crear orden de venta desde la reserva
        from app.schemas.sale import SaleOrderCreateRequest, SaleItemCreateRequest
        
        sale_service = SaleService(db=self.db)
        items = [
            SaleItemCreateRequest(
                variante_producto_id=item.variante_producto_id,
                cantidad=float(item.cantidad),
            )
            for item in reserva.items
        ]

        sale_payload = SaleOrderCreateRequest(
            cliente_id=reserva.cliente_id,
            items=items,
            metodo_pago=payload.metodo_pago,
            direccion_entrega=payload.direccion_entrega,
            sucursal_recogida_id=payload.sucursal_recogida_id,
        )

        orden_venta = sale_service.create_order(sale_payload, usuario_id=usuario_id or reserva.usuario_id)

        # Actualizar reserva
        reserva.estado = "COMPLETADA"
        reserva.fecha_completado = datetime.now()
        reserva.orden_venta_id = orden_venta.id
        if payload.observaciones:
            reserva.observaciones = (reserva.observaciones or "") + f"\n[Completada: {payload.observaciones}]"

        self.db.commit()
        self.db.refresh(reserva)
        return self._map_reservation(reserva)

