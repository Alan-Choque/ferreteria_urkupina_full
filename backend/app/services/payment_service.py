from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pago import PagoCliente
from app.repositories.payment_repo import PaymentFilter, PaymentRepository
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentListResponse,
    PaymentResponse,
)


@dataclass(slots=True)
class PaymentService:
    db: Session
    _repo: PaymentRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = PaymentRepository(self.db)

    def list_payments(
        self,
        *,
        cliente_id: Optional[int] = None,
        factura_id: Optional[int] = None,
        orden_venta_id: Optional[int] = None,
        estado: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> PaymentListResponse:
        filters = PaymentFilter(
            cliente_id=cliente_id,
            factura_id=factura_id,
            orden_venta_id=orden_venta_id,
            estado=estado,
        )
        payments, total = self._repo.list(filters, page, page_size)
        items = [self._map_payment(payment) for payment in payments]
        return PaymentListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_payment(self, payment_id: int) -> PaymentResponse:
        payment = self._repo.get(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Pago no encontrado"
            )
        return self._map_payment(payment)

    def create_payment(
        self,
        payload: PaymentCreateRequest,
        usuario_id: Optional[int] = None,
    ) -> PaymentResponse:
        from app.models.cliente import Cliente

        # Verificar que el cliente existe
        cliente = self.db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado"
            )

        # Verificar que la factura existe si se proporciona
        if payload.factura_id:
            from app.models.factura import FacturaVenta

            factura = self.db.query(FacturaVenta).filter(FacturaVenta.id == payload.factura_id).first()
            if not factura:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada"
                )

        # Crear pago
        payment = self._repo.create(
            cliente_id=payload.cliente_id,
            factura_id=payload.factura_id,
            orden_venta_id=payload.orden_venta_id,
            usuario_id=usuario_id,
            monto=payload.monto,
            metodo_pago=payload.metodo_pago,
            numero_comprobante=payload.numero_comprobante,
            fecha_pago=payload.fecha_pago or datetime.utcnow(),
            fecha_registro=datetime.utcnow(),
            observaciones=payload.observaciones,
            estado=payload.estado,
        )

        self.db.commit()
        self.db.refresh(payment)
        return self._map_payment(payment)

    def _map_payment(self, payment: PagoCliente) -> PaymentResponse:
        return PaymentResponse(
            id=payment.id,
            cliente_id=payment.cliente_id,
            cliente=payment.cliente,
            factura_id=payment.factura_id,
            orden_venta_id=payment.orden_venta_id,
            usuario_id=payment.usuario_id,
            usuario=payment.usuario,
            monto=float(payment.monto),
            metodo_pago=payment.metodo_pago,
            numero_comprobante=payment.numero_comprobante,
            fecha_pago=payment.fecha_pago,
            fecha_registro=payment.fecha_registro,
            observaciones=payment.observaciones,
            estado=payment.estado,
        )

