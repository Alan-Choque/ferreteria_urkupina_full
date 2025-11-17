from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.reserva import Reserva
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
        )

