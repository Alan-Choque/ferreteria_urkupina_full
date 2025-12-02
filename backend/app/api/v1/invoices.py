from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, require_sales_management
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.invoice import InvoiceCreateRequest, InvoiceListResponse, InvoiceResponse
from app.services.invoice_service import InvoiceService

router = APIRouter()


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(db=db)


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    cliente_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=2000),
    service: InvoiceService = Depends(get_invoice_service),
    _: object = Depends(require_sales_management()),
):
    """Lista todas las facturas (requiere permisos de administración)"""
    return service.list_invoices(
        cliente_id=cliente_id, estado=estado, page=page, page_size=page_size
    )


@router.get("/my-invoices", response_model=InvoiceListResponse)
def list_my_invoices(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(50, ge=1, le=2000, description="Tamaño de página"),
    service: InvoiceService = Depends(get_invoice_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Lista las facturas del usuario autenticado.
    """
    from app.models.cliente import Cliente
    from sqlalchemy import func

    # Buscar el cliente asociado al email del usuario
    cliente = service.db.query(Cliente).filter(
        func.lower(Cliente.correo) == func.lower(current_user.correo)
    ).first()

    if not cliente:
        return InvoiceListResponse(items=[], total=0, page=page, page_size=page_size)

    return service.list_invoices(
        cliente_id=cliente.id, usuario_id=current_user.id, page=page, page_size=page_size
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    service: InvoiceService = Depends(get_invoice_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
):
    """
    Obtiene una factura por ID.
    
    Si el usuario está autenticado, verifica que la factura pertenezca al cliente asociado.
    Si no está autenticado o no es su factura, requiere permisos de administración.
    """
    from app.models.factura import FacturaVenta
    from app.models.cliente import Cliente
    from app.core.dependencies import can_manage_sales

    invoice = service.db.query(FacturaVenta).filter(FacturaVenta.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada"
        )

    if current_user:
        # Verificar si la factura pertenece a un cliente con el mismo email que el usuario
        if invoice.cliente_id:
            cliente_factura = service.db.query(Cliente).filter(
                Cliente.id == invoice.cliente_id
            ).first()

            if cliente_factura and cliente_factura.correo and current_user.correo:
                email_factura = cliente_factura.correo.lower().strip()
                email_usuario = current_user.correo.lower().strip()
                if email_factura == email_usuario:
                    return service.get_invoice(invoice_id)

        if can_manage_sales(current_user):
            return service.get_invoice(invoice_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta factura. Solo puedes ver tus propias facturas.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para ver esta factura",
        )


@router.get("/numero/{numero_factura}", response_model=InvoiceResponse)
def get_invoice_by_number(
    numero_factura: str,
    service: InvoiceService = Depends(get_invoice_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
):
    """Obtiene una factura por número de factura"""
    from app.models.factura import FacturaVenta
    from app.models.cliente import Cliente
    from app.core.dependencies import can_manage_sales

    invoice = service.db.query(FacturaVenta).filter(
        FacturaVenta.numero_factura == numero_factura
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada"
        )

    if current_user:
        # Verificar si la factura pertenece a un cliente con el mismo email que el usuario
        if invoice.cliente_id:
            cliente_factura = service.db.query(Cliente).filter(
                Cliente.id == invoice.cliente_id
            ).first()

            if cliente_factura and cliente_factura.correo and current_user.correo:
                email_factura = cliente_factura.correo.lower().strip()
                email_usuario = current_user.correo.lower().strip()
                if email_factura == email_usuario:
                    return service.get_invoice_by_number(numero_factura)

        if can_manage_sales(current_user):
            return service.get_invoice_by_number(numero_factura)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta factura.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para ver esta factura",
        )


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreateRequest,
    service: InvoiceService = Depends(get_invoice_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
    _: object = Depends(require_sales_management()),
):
    """Crea una nueva factura (requiere permisos de administración)"""
    usuario_id = current_user.id if current_user else None
    return service.create_invoice(payload, usuario_id=usuario_id)

