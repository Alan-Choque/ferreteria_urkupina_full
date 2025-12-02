from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_optional, require_sales_management
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.sale import SaleOrderCreateRequest, SaleOrderListResponse, SaleOrderResponse
from app.schemas.sale_status import (
    DeliverOrderRequest,
    PickupOrderRequest,
    ReadyForPickupRequest,
    ShipOrderRequest,
    UpdateOrderStatusRequest,
)
from app.services.sale_service import SaleService

router = APIRouter()


def get_sale_service(db: Session = Depends(get_db)) -> SaleService:
    return SaleService(db=db)


@router.get("", response_model=SaleOrderListResponse)
def list_sales_orders(
    customer_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: SaleService = Depends(get_sale_service),
    _: object = Depends(require_sales_management()),
):
    return service.list_orders(customer_id=customer_id, estado=estado, page=page, page_size=page_size)


@router.get("/my-orders", response_model=SaleOrderListResponse)
def list_my_orders(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(50, ge=1, le=2000, description="Tamaño de página"),
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Lista las órdenes de venta del usuario autenticado.
    
    Busca órdenes por usuario_id (más directo) y también por cliente asociado al email.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    from app.models.cliente import Cliente
    from app.models.venta import OrdenVenta
    from sqlalchemy import func, or_
    
    logger.info(f"Buscando órdenes para usuario_id: {current_user.id}, email: {current_user.correo}")
    
    # MEJORADO: Buscar órdenes usando la relación directa usuario_id -> cliente_id
    # 1. Buscar cliente asociado al usuario por relación directa (más eficiente)
    cliente = service.db.query(Cliente).filter(
        Cliente.usuario_id == current_user.id
    ).first()
    
    if cliente:
        logger.info(f"Cliente encontrado por usuario_id: {cliente.id}, email: {cliente.correo}")
    else:
        logger.info(f"No se encontró cliente asociado al usuario {current_user.id}")
        # Fallback: buscar por email (para clientes antiguos sin relación)
        cliente = service.db.query(Cliente).filter(
            func.lower(Cliente.correo) == func.lower(current_user.correo)
        ).first()
        if cliente:
            logger.info(f"Cliente encontrado por email (fallback): {cliente.id}")
            # Vincular el cliente al usuario si no está vinculado
            if not cliente.usuario_id:
                cliente.usuario_id = current_user.id
                service.db.commit()
                logger.info(f"Cliente {cliente.id} vinculado al usuario {current_user.id}")
    
    # Buscar órdenes por usuario_id O por cliente_id
    condiciones = []
    if current_user.id:
        condiciones.append(OrdenVenta.usuario_id == current_user.id)
        logger.info(f"Agregada condición: usuario_id == {current_user.id}")
    if cliente:
        condiciones.append(OrdenVenta.cliente_id == cliente.id)
        logger.info(f"Agregada condición: cliente_id == {cliente.id}")
    
    if not condiciones:
        # Si no hay condiciones, retornar lista vacía
        logger.warning("No hay condiciones para buscar órdenes")
        return SaleOrderListResponse(items=[], total=0, page=page, page_size=page_size)
    
    # Buscar órdenes que cumplan cualquiera de las condiciones
    # Cargar relaciones necesarias (cliente, usuario, items)
    from app.models.venta import ItemOrdenVenta
    from sqlalchemy.orm import joinedload
    ordenes_filtradas = service.db.query(OrdenVenta).options(
        joinedload(OrdenVenta.cliente),
        joinedload(OrdenVenta.usuario),
        joinedload(OrdenVenta.items).joinedload(ItemOrdenVenta.variante),
    ).filter(
        or_(*condiciones)
    ).order_by(OrdenVenta.fecha.desc(), OrdenVenta.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    total = service.db.query(OrdenVenta).filter(
        or_(*condiciones)
    ).count()
    
    logger.info(f"Encontradas {len(ordenes_filtradas)} órdenes de {total} totales")
    for orden in ordenes_filtradas:
        logger.info(f"Orden {orden.id}: usuario_id={orden.usuario_id}, cliente_id={orden.cliente_id}")
    
    # Mapear a respuesta usando el método del servicio
    items = [service._map_order(orden) for orden in ordenes_filtradas]
    return SaleOrderListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=SaleOrderResponse)
def get_sales_order(
    order_id: int,
    service: SaleService = Depends(get_sale_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Obtiene una orden de venta por ID.
    
    Si el usuario está autenticado, verifica que la orden pertenezca al cliente asociado.
    Si no está autenticado o no es su orden, requiere permisos de administración.
    """
    from app.models.venta import OrdenVenta
    from app.models.cliente import Cliente
    
    # Obtener la orden directamente del modelo para verificar permisos
    orden = db.query(OrdenVenta).filter(OrdenVenta.id == order_id).first()
    if not orden:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de venta no encontrada")
    
    # Si el usuario está autenticado, verificar que la orden sea suya
    if current_user:
        # Verificar si la orden fue creada por este usuario (usuario_id)
        if orden.usuario_id and orden.usuario_id == current_user.id:
            return service.get_order(order_id)
        
        # MEJORADO: Verificar si la orden pertenece al cliente asociado al usuario
        # Usa la relación directa usuario_id -> cliente_id (más eficiente y seguro)
        if orden.cliente_id:
            # Buscar cliente asociado al usuario por relación directa
            cliente_usuario = db.query(Cliente).filter(
                Cliente.usuario_id == current_user.id
            ).first()
            
            # Si el cliente de la orden coincide con el cliente del usuario, permitir acceso
            if cliente_usuario and orden.cliente_id == cliente_usuario.id:
                return service.get_order(order_id)
            
            # Fallback: verificar por email (para clientes antiguos sin relación)
            if not cliente_usuario:
                from sqlalchemy import func
                cliente_usuario = db.query(Cliente).filter(
                    func.lower(Cliente.correo) == func.lower(current_user.correo)
                ).first()
                if cliente_usuario and orden.cliente_id == cliente_usuario.id:
                    # Vincular el cliente al usuario si no está vinculado
                    if not cliente_usuario.usuario_id:
                        cliente_usuario.usuario_id = current_user.id
                        db.commit()
                    return service.get_order(order_id)
        
        # Si no es su orden, verificar permisos de admin
        from app.core.dependencies import can_manage_sales
        if can_manage_sales(current_user):
            return service.get_order(order_id)
        else:
            # Si llegamos aquí, el usuario está autenticado pero no tiene relación directa con la orden
            # Por seguridad, rechazar el acceso
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta orden. Solo puedes ver tus propias órdenes."
            )
    else:
        # Si no está autenticado, permitir ver la orden (puede ser un enlace compartido)
        # Pero solo si la orden no tiene usuario_id asociado (pedido público)
        # Si tiene usuario_id, requerir autenticación
        if orden.usuario_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Debes iniciar sesión para ver esta orden"
            )
        # Si no tiene usuario_id, permitir acceso (pedido público)
        return service.get_order(order_id)


@router.post("", response_model=SaleOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SaleOrderCreateRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Optional[Usuario] = Depends(get_current_user_optional),
):
    """
    Crea una nueva orden de venta.
    
    Puede ser llamada por:
    - Usuarios autenticados (se asocia el usuario_id)
    - Usuarios no autenticados (solo se crea la orden, sin usuario_id)
    
    Si no se proporciona cliente_id, se busca por email o se crea un nuevo cliente.
    """
    usuario_id = current_user.id if current_user else None
    return service.create_order(payload, usuario_id=usuario_id)


@router.patch("/{order_id}/status", response_model=SaleOrderResponse)
def update_order_status(
    order_id: int,
    payload: UpdateOrderStatusRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(require_sales_management()),
):
    """Actualiza el estado de una orden (requiere permisos de gestión de ventas)"""
    return service.update_order_status(order_id, payload.estado, usuario_id=current_user.id)


@router.post("/{order_id}/ship", response_model=SaleOrderResponse)
def ship_order(
    order_id: int,
    payload: ShipOrderRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(require_sales_management()),
):
    """Marca una orden como enviada (requiere permisos de gestión de ventas)"""
    return service.ship_order(
        order_id,
        repartidor_id=payload.repartidor_id,
        direccion_entrega=payload.direccion_entrega,
        usuario_id=current_user.id,
    )


@router.post("/{order_id}/deliver", response_model=SaleOrderResponse)
def deliver_order(
    order_id: int,
    payload: DeliverOrderRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(require_sales_management()),
):
    """
    Marca una orden como entregada.
    
    Si la orden es CONTRA_ENTREGA y se proporciona pago_contra_entrega,
    crea automáticamente el pago y la factura.
    """
    return service.deliver_order(
        order_id,
        persona_recibe=payload.persona_recibe,
        observaciones=payload.observaciones,
        pago_contra_entrega=payload.pago_contra_entrega,
        usuario_id=current_user.id,
    )


@router.post("/{order_id}/ready-for-pickup", response_model=SaleOrderResponse)
def ready_for_pickup(
    order_id: int,
    payload: ReadyForPickupRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(require_sales_management()),
):
    """Marca una orden como lista para recoger en tienda (requiere permisos de gestión de ventas)"""
    return service.ready_for_pickup(order_id, usuario_id=current_user.id)


@router.post("/{order_id}/pickup", response_model=SaleOrderResponse)
def pickup_order(
    order_id: int,
    payload: PickupOrderRequest,
    service: SaleService = Depends(get_sale_service),
    current_user: Usuario = Depends(require_sales_management()),
):
    """
    Marca una orden como recogida en tienda.
    
    Si la orden no tiene pago previo y se proporciona pago_al_recoger,
    crea automáticamente el pago y la factura.
    """
    return service.pickup_order(
        order_id,
        persona_recibe=payload.persona_recibe,
        observaciones=payload.observaciones,
        pago_al_recoger=payload.pago_al_recoger,
        usuario_id=current_user.id,
    )

