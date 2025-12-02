from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.purchase import PurchaseOrderListResponse, PurchaseOrderResponse
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
from app.services.purchase_service import PurchaseService

router = APIRouter()


def get_purchase_service(db: Session = Depends(get_db)) -> PurchaseService:
    return PurchaseService(db=db)


@router.get("", response_model=PurchaseOrderListResponse)
def list_purchase_orders(
    supplier_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_orders(supplier_id=supplier_id, estado=estado, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    order_id: int,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_order(order_id)


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: PurchaseOrderCreateRequest,
    service: PurchaseService = Depends(get_purchase_service),
    current_user: Usuario = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN")),
):
    """Crear orden de compra (BORRADOR) - ADMIN, INVENTARIOS"""
    return service.create_order(payload, usuario_id=current_user.id)


@router.put("/{order_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    order_id: int,
    payload: PurchaseOrderUpdateRequest,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Editar orden de compra (solo si está en BORRADOR) - ADMIN, INVENTARIOS"""
    return service.update_order(order_id, payload)


@router.post("/{order_id}/send", response_model=PurchaseOrderResponse)
def send_purchase_order(
    order_id: int,
    payload: PurchaseSendRequest,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Enviar pedido al proveedor (BORRADOR → ENVIADO) - ADMIN, INVENTARIOS"""
    return service.send_order(order_id, payload)


@router.post("/{order_id}/confirm", response_model=PurchaseOrderResponse)
def confirm_purchase_order(
    order_id: int,
    payload: PurchaseConfirmRequest,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),  # TODO: Cambiar a rol PROVEEDOR cuando exista
):
    """Proveedor confirma pedido (ENVIADO → CONFIRMADO) - PROVEEDOR"""
    return service.confirm_order(order_id, payload)


@router.post("/{order_id}/reject", response_model=PurchaseOrderResponse)
def reject_purchase_order(
    order_id: int,
    payload: PurchaseRejectRequest,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),  # TODO: Cambiar a rol PROVEEDOR cuando exista
):
    """Proveedor rechaza pedido (ENVIADO → RECHAZADO) - PROVEEDOR"""
    return service.reject_order(order_id, payload)


@router.post("/{order_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_order(
    order_id: int,
    payload: PurchaseReceiveRequest,
    service: PurchaseService = Depends(get_purchase_service),
    current_user: Usuario = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN")),
):
    """Registrar recepción de mercancía (CONFIRMADO → RECIBIDO) - ADMIN, INVENTARIOS"""
    return service.receive_order(order_id, payload, usuario_id=current_user.id)


@router.post("/{order_id}/invoice", response_model=PurchaseOrderResponse)
def invoice_purchase_order(
    order_id: int,
    payload: PurchaseInvoiceRequest,
    service: PurchaseService = Depends(get_purchase_service),
    current_user: Usuario = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN")),
):
    """Asociar factura/Procesar pago (RECIBIDO → FACTURADO) - ADMIN, INVENTARIOS"""
    return service.invoice_order(order_id, payload, usuario_id=current_user.id)


@router.post("/{order_id}/close", response_model=PurchaseOrderResponse)
def close_purchase_order(
    order_id: int,
    payload: PurchaseCloseRequest,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Cerrar pedido (FACTURADO → CERRADO) - ADMIN, INVENTARIOS"""
    return service.close_order(order_id, payload)

