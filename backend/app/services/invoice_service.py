from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.factura import FacturaVenta, ItemFacturaVenta
from app.repositories.invoice_repo import InvoiceFilter, InvoiceRepository
from app.schemas.invoice import (
    InvoiceCreateRequest,
    InvoiceItemResponse,
    InvoiceListResponse,
    InvoiceResponse,
)


@dataclass(slots=True)
class InvoiceService:
    db: Session
    _repo: InvoiceRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = InvoiceRepository(self.db)

    def list_invoices(
        self,
        *,
        cliente_id: Optional[int] = None,
        usuario_id: Optional[int] = None,
        estado: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> InvoiceListResponse:
        filters = InvoiceFilter(cliente_id=cliente_id, usuario_id=usuario_id, estado=estado)
        invoices, total = self._repo.list(filters, page, page_size)
        items = [self._map_invoice(invoice) for invoice in invoices]
        return InvoiceListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_invoice(self, invoice_id: int) -> InvoiceResponse:
        invoice = self._repo.get(invoice_id)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada"
            )
        return self._map_invoice(invoice)

    def get_invoice_by_number(self, numero_factura: str) -> InvoiceResponse:
        invoice = self._repo.get_by_number(numero_factura)
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada"
            )
        return self._map_invoice(invoice)

    def create_invoice(
        self,
        payload: InvoiceCreateRequest,
        usuario_id: Optional[int] = None,
    ) -> InvoiceResponse:
        from app.models.cliente import Cliente

        # Verificar que el cliente existe
        cliente = self.db.query(Cliente).filter(Cliente.id == payload.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado"
            )

        # Generar número de factura
        numero_factura = self._repo.get_next_invoice_number()

        # Calcular totales
        subtotal = sum(
            item.get("precio_unitario", 0) * item.get("cantidad", 0)
            - item.get("descuento", 0)
            for item in payload.items
        )
        descuento_total = sum(item.get("descuento", 0) for item in payload.items)
        # En Bolivia, el IVA es 13% (puedes ajustar esto)
        impuesto = subtotal * 0.13
        total = subtotal + impuesto

        # Crear factura
        invoice = self._repo.create(
            numero_factura=numero_factura,
            orden_venta_id=payload.orden_venta_id,
            cliente_id=payload.cliente_id,
            usuario_id=usuario_id,
            nit_cliente=payload.nit_cliente or cliente.nit_ci,
            razon_social=payload.razon_social or cliente.nombre,
            fecha_emision=datetime.utcnow(),
            fecha_vencimiento=payload.fecha_vencimiento,
            subtotal=subtotal,
            descuento=descuento_total,
            impuesto=impuesto,
            total=total,
            estado="EMITIDA",
        )

        # Crear items de factura
        for item_data in payload.items:
            item_subtotal = (
                item_data.get("precio_unitario", 0) * item_data.get("cantidad", 0)
                - item_data.get("descuento", 0)
            )
            item = ItemFacturaVenta(
                factura_id=invoice.id,
                variante_producto_id=item_data["variante_producto_id"],
                cantidad=item_data["cantidad"],
                precio_unitario=item_data["precio_unitario"],
                descuento=item_data.get("descuento", 0),
                subtotal=item_subtotal,
            )
            self.db.add(item)

        self.db.commit()
        self.db.refresh(invoice)
        return self._map_invoice(invoice)

    def _map_invoice(self, invoice: FacturaVenta) -> InvoiceResponse:
        items = [
            InvoiceItemResponse(
                id=item.id,
                variante_producto_id=item.variante_producto_id,
                variante_nombre=item.variante.nombre if item.variante else None,
                cantidad=float(item.cantidad),
                precio_unitario=float(item.precio_unitario),
                descuento=float(item.descuento),
                subtotal=float(item.subtotal),
            )
            for item in invoice.items
        ]

        return InvoiceResponse(
            id=invoice.id,
            numero_factura=invoice.numero_factura,
            orden_venta_id=invoice.orden_venta_id,
            cliente_id=invoice.cliente_id,
            cliente=invoice.cliente,
            usuario_id=invoice.usuario_id,
            usuario=invoice.usuario,
            nit_cliente=invoice.nit_cliente,
            razon_social=invoice.razon_social,
            fecha_emision=invoice.fecha_emision,
            fecha_vencimiento=invoice.fecha_vencimiento,
            subtotal=float(invoice.subtotal),
            descuento=float(invoice.descuento),
            impuesto=float(invoice.impuesto),
            total=float(invoice.total),
            estado=invoice.estado,
            items=items,
        )

