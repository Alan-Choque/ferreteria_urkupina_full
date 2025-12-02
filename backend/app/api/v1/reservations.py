from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role, get_current_user
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.reservation import ReservationListResponse, ReservationResponse
from app.schemas.reservation_status import (
    ReservationCancelRequest,
    ReservationCompleteRequest,
    ReservationConfirmRequest,
    ReservationCreateRequest,
    ReservationDepositRequest,
)
from app.services.reservation_service import ReservationService

router = APIRouter()


def get_reservation_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(db=db)


@router.get("/my-reservations", response_model=ReservationListResponse)
def list_my_reservations(
    page: int = 1,
    page_size: int = 50,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Lista las reservaciones del usuario autenticado.
    
    MEJORADO: Busca el cliente asociado al usuario por relación directa usuario_id.
    """
    from app.models.cliente import Cliente
    from sqlalchemy import func
    
    # MEJORADO: Buscar cliente por relación directa usuario_id (más eficiente)
    cliente = service.db.query(Cliente).filter(
        Cliente.usuario_id == current_user.id
    ).first()
    
    # Fallback: buscar por email (para clientes antiguos sin relación)
    if not cliente:
        cliente = service.db.query(Cliente).filter(
            func.lower(Cliente.correo) == func.lower(current_user.correo)
        ).first()
        # Vincular el cliente al usuario si no está vinculado
        if cliente and not cliente.usuario_id:
            cliente.usuario_id = current_user.id
            service.db.commit()
    
    if not cliente:
        # Si no hay cliente asociado, retornar lista vacía
        return ReservationListResponse(items=[], total=0, page=page, page_size=page_size)
    
    # Filtrar reservaciones por cliente_id
    return service.list_reservations(customer_id=cliente.id, estado=None, page=page, page_size=page_size)


@router.get("", response_model=ReservationListResponse)
def list_reservations(
    customer_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: ReservationService = Depends(get_reservation_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_reservations(customer_id=customer_id, estado=estado, page=page, page_size=page_size)


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN", optional=True)),
):
    """
    Obtiene una reserva por ID.
    Los usuarios autenticados solo pueden ver sus propias reservas.
    """
    reservation = service.get_reservation(reservation_id)
    
    # Si no es admin, verificar que la reserva pertenezca al usuario
    if current_user:
        from app.models.cliente import Cliente
        cliente = service.db.query(Cliente).filter(
            Cliente.usuario_id == current_user.id
        ).first()
        if cliente and reservation.cliente and reservation.cliente.id != cliente.id:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta reserva"
            )
    
    return reservation


@router.get("/availability/{variante_producto_id}", response_model=dict)
def check_availability(
    variante_producto_id: int,
    cantidad: float,
    service: ReservationService = Depends(get_reservation_service),
):
    """Consulta la disponibilidad de un producto."""
    return service.check_availability(variante_producto_id, cantidad)


@router.post("", response_model=ReservationResponse)
def create_reservation(
    payload: ReservationCreateRequest,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
):
    """
    Crea una nueva reserva.
    Clientes pueden crear sus propias reservas.
    Empleados pueden crear reservas para cualquier cliente.
    """
    usuario_id = current_user.id if current_user else None
    return service.create_reservation(payload, usuario_id=usuario_id)


@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_reservation(
    reservation_id: int,
    payload: ReservationCancelRequest,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
):
    """
    Cancela una reserva.
    Clientes pueden cancelar sus propias reservas.
    Empleados pueden cancelar cualquier reserva.
    """
    # Verificar permisos si es cliente
    if current_user:
        reservation = service.get_reservation(reservation_id)
        from app.models.cliente import Cliente
        cliente = service.db.query(Cliente).filter(
            Cliente.usuario_id == current_user.id
        ).first()
        if cliente and reservation.cliente and reservation.cliente.id != cliente.id:
            # Verificar si es empleado/admin
            from app.core.dependencies import has_role
            is_employee = (
                has_role(current_user, "ADMIN") or
                has_role(current_user, "VENTAS") or
                has_role(current_user, "INVENTARIOS")
            )
            if not is_employee:
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para cancelar esta reserva"
                )
    
    return service.cancel_reservation(reservation_id, payload.motivo)


@router.post("/{reservation_id}/deposit", response_model=ReservationResponse)
def process_deposit(
    reservation_id: int,
    payload: ReservationDepositRequest,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
):
    """
    Procesa el anticipio de una reserva.
    Clientes pueden procesar anticipio de sus propias reservas.
    Empleados pueden procesar anticipio de cualquier reserva.
    """
    # Verificar permisos si es cliente
    if current_user:
        reservation = service.get_reservation(reservation_id)
        from app.models.cliente import Cliente
        cliente = service.db.query(Cliente).filter(
            Cliente.usuario_id == current_user.id
        ).first()
        if cliente and reservation.cliente and reservation.cliente.id != cliente.id:
            # Verificar si es empleado/admin
            from app.core.dependencies import has_role
            is_employee = (
                has_role(current_user, "ADMIN") or
                has_role(current_user, "VENTAS") or
                has_role(current_user, "INVENTARIOS")
            )
            if not is_employee:
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para procesar anticipio de esta reserva"
                )
    
    return service.process_deposit(reservation_id, payload)


@router.post("/{reservation_id}/confirm", response_model=ReservationResponse)
def send_confirmation(
    reservation_id: int,
    payload: ReservationConfirmRequest,
    service: ReservationService = Depends(get_reservation_service),
    _: object = Depends(require_role("ADMIN", "VENTAS")),
):
    """
    Envía confirmación/recordatorio de una reserva.
    Solo empleados pueden enviar confirmaciones.
    """
    return service.send_confirmation(reservation_id, payload)


@router.post("/{reservation_id}/complete", response_model=ReservationResponse)
def complete_reservation(
    reservation_id: int,
    payload: ReservationCompleteRequest,
    service: ReservationService = Depends(get_reservation_service),
    current_user: Usuario = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN", "VENTAS")),
):
    """
    Completa una reserva creando una orden de venta.
    Solo empleados pueden completar reservas.
    """
    return service.complete_reservation(reservation_id, payload, usuario_id=current_user.id)

