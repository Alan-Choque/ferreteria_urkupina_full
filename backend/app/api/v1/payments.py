from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, require_sales_management
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.payment import PaymentCreateRequest, PaymentListResponse, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter()


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db=db)


@router.get("", response_model=PaymentListResponse)
def list_payments(
    cliente_id: Optional[int] = None,
    factura_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=2000),
    service: PaymentService = Depends(get_payment_service),
    _: object = Depends(require_sales_management()),
):
    """Lista todos los pagos (requiere permisos de administración)"""
    return service.list_payments(
        cliente_id=cliente_id, factura_id=factura_id, estado=estado, page=page, page_size=page_size
    )


@router.get("/my-payments", response_model=PaymentListResponse)
def list_my_payments(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(50, ge=1, le=2000, description="Tamaño de página"),
    service: PaymentService = Depends(get_payment_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Lista los pagos del usuario autenticado.
    """
    from app.models.cliente import Cliente
    from sqlalchemy import func

    # Buscar el cliente asociado al email del usuario
    cliente = service.db.query(Cliente).filter(
        func.lower(Cliente.correo) == func.lower(current_user.correo)
    ).first()

    if not cliente:
        return PaymentListResponse(items=[], total=0, page=page, page_size=page_size)

    return service.list_payments(
        cliente_id=cliente.id, page=page, page_size=page_size
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    service: PaymentService = Depends(get_payment_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
):
    """
    Obtiene un pago por ID.
    
    Si el usuario está autenticado, verifica que el pago pertenezca al cliente asociado.
    Si no está autenticado o no es su pago, requiere permisos de administración.
    """
    from app.models.pago import PagoCliente
    from app.models.cliente import Cliente
    from app.core.dependencies import can_manage_sales

    payment = service.db.query(PagoCliente).filter(PagoCliente.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pago no encontrado"
        )

    if current_user:
        # Verificar si el pago pertenece a un cliente con el mismo email que el usuario
        if payment.cliente_id:
            cliente_pago = service.db.query(Cliente).filter(
                Cliente.id == payment.cliente_id
            ).first()

            if cliente_pago and cliente_pago.correo and current_user.correo:
                email_pago = cliente_pago.correo.lower().strip()
                email_usuario = current_user.correo.lower().strip()
                if email_pago == email_usuario:
                    return service.get_payment(payment_id)

        if can_manage_sales(current_user):
            return service.get_payment(payment_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este pago. Solo puedes ver tus propios pagos.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para ver este pago",
        )


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreateRequest,
    service: PaymentService = Depends(get_payment_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
    _: object = Depends(require_sales_management()),
):
    """Crea un nuevo pago (requiere permisos de administración)"""
    usuario_id = current_user.id if current_user else None
    return service.create_payment(payload, usuario_id=usuario_id)

