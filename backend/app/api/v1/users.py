from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.user import (
    RoleResponse,
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
    UserUpdateRolesRequest,
)
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db=db)


@router.get("/test", tags=["users"])
def test_users_endpoint(db: Session = Depends(get_db)):
    """Endpoint de prueba para diagnosticar problemas con usuarios."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        # Prueba 1: Contar usuarios
        from sqlalchemy import func, select
        from app.models.usuario import Usuario
        count = db.scalar(select(func.count()).select_from(Usuario))
        logger.info(f"Total de usuarios en DB: {count}")
        
        # Prueba 2: Obtener un usuario simple
        user = db.query(Usuario).first()
        if user:
            logger.info(f"Usuario de prueba: ID={user.id}, nombre={user.nombre_usuario}, correo={user.correo}")
            
            # Prueba 3: Intentar acceder a roles
            try:
                roles_count = len(user.roles) if hasattr(user, 'roles') and user.roles else 0
                logger.info(f"Roles del usuario: {roles_count}")
            except Exception as roles_error:
                logger.error(f"Error al acceder a roles: {roles_error}")
        
        return {
            "status": "ok",
            "total_users": count or 0,
            "test_user": {
                "id": user.id if user else None,
                "nombre": user.nombre_usuario if user else None,
            } if user else None
        }
    except Exception as e:
        logger.error(f"Error en test endpoint: {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@router.get("", response_model=UserListResponse)
def list_users(
    q: Optional[str] = Query(None, description="Filtro por nombre de usuario o correo"),
    active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    import logging
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"Listando usuarios: page={page}, page_size={page_size}, search={q}, active={active}")
        result = service.list_users(search=q, active=active, page=page, page_size=page_size)
        logger.info(f"Usuarios listados exitosamente: {len(result.items)} items, total={result.total}")
        return result
    except HTTPException:
        # Re-lanzar HTTPException sin modificar
        raise
    except Exception as e:
        logger.error(f"Error en list_users endpoint: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar usuarios: {type(e).__name__}: {str(e)}"
        )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_user(payload)


@router.get("/roles/all", response_model=list[RoleResponse])
def list_roles(
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_roles()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Actualizando usuario {user_id} con payload: {payload.model_dump()}")
    try:
        result = service.update_user(user_id, payload)
        logger.info(f"Usuario {user_id} actualizado exitosamente")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar usuario {user_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@router.put("/{user_id}/roles", response_model=UserResponse)
def update_user_roles(
    user_id: int,
    payload: UserUpdateRolesRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_roles(user_id, payload)


@router.post("/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.set_active(user_id, True)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    if user_id == 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede desactivar al usuario raíz")
    return service.set_active(user_id, False)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.delete_user(user_id)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_202_ACCEPTED)
def reset_user_password(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.send_password_reset(user_id)


@router.get("/{user_id}/orders")
def get_user_orders(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN")),
):
    """Obtiene el historial de compras de un usuario."""
    from app.repositories.sale_repo import SaleFilter
    from app.services.sale_service import SaleService
    from app.schemas.sale import SaleOrderListResponse
    
    sale_service = SaleService(db=db)
    filters = SaleFilter(usuario_id=user_id)
    orders, total = sale_service._repo.list(filters, page, page_size)
    
    items = [sale_service._map_order(order) for order in orders]
    return SaleOrderListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{user_id}/customer-history")
def get_user_customer_history(
    user_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN")),
):
    """Obtiene el historial de variaciones de datos del cliente asociado al usuario."""
    from app.models.usuario import Usuario
    from app.models.cliente import Cliente
    from app.models.venta import OrdenVenta
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    
    # Buscar cliente asociado
    cliente = db.query(Cliente).filter(Cliente.usuario_id == user_id).first()
    if not cliente:
        return {
            "user_id": user_id,
            "user_email": user.correo,
            "has_customer": False,
            "current_data": None,
            "orders_count": 0,
            "variations": [],
        }
    
    # Obtener todas las órdenes del cliente
    orders = db.query(OrdenVenta).filter(OrdenVenta.cliente_id == cliente.id).order_by(OrdenVenta.fecha.desc()).all()
    
    # Datos actuales del cliente
    current_data = {
        "nombre": cliente.nombre,
        "telefono": cliente.telefono,
        "nit_ci": cliente.nit_ci,
        "correo": cliente.correo,
        "direccion": cliente.direccion,
        "fecha_registro": cliente.fecha_registro.isoformat() if cliente.fecha_registro else None,
    }
    
    # Nota: Como el cliente se actualiza, no podemos ver el historial real de cambios
    # Pero podemos mostrar el estado actual y el número de órdenes
    # En el futuro, se puede agregar una tabla de historial de cambios
    
    return {
        "user_id": user_id,
        "user_email": user.correo,
        "has_customer": True,
        "customer_id": cliente.id,
        "current_data": current_data,
        "orders_count": len(orders),
        "first_order_date": orders[0].fecha.isoformat() if orders else None,
        "last_order_date": orders[-1].fecha.isoformat() if orders else None,
        "variations_note": "El historial de variaciones se mostrará cuando se implemente la tabla de historial de cambios del cliente.",
    }

