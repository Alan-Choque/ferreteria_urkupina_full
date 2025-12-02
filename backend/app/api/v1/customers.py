from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role, get_current_user
from app.models.usuario import Usuario
from app.db.session import get_db
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
)
from app.services.customer_service import CustomerService

router = APIRouter()


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db=db)


@router.get("", response_model=CustomerListResponse)
def list_customers(
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Lista todos los clientes. Disponible para ADMIN y empleados."""
    return service.list_customers(q=q, page=page, page_size=page_size)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS", optional=True)),
):
    """
    Obtiene un cliente por ID.
    Los clientes autenticados solo pueden ver sus propios datos.
    Empleados y admin pueden ver cualquier cliente.
    """
    from app.models.cliente import Cliente
    
    # Si el usuario es cliente, verificar que sea su propio cliente
    if current_user:
        cliente = service.db.query(Cliente).filter(Cliente.usuario_id == current_user.id).first()
        if cliente and cliente.id == customer_id:
            return service.get_customer(customer_id)
        # Si no es su cliente, verificar si es empleado/admin
        from app.core.dependencies import has_role
        if not (has_role(current_user, "ADMIN") or has_role(current_user, "VENTAS") or has_role(current_user, "INVENTARIOS")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este cliente"
            )
    
    return service.get_customer(customer_id)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreateRequest,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Crea un nuevo cliente. Disponible para ADMIN y empleados."""
    return service.create_customer(payload)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdateRequest,
    service: CustomerService = Depends(get_customer_service),
    current_user: Optional[Usuario] = Depends(get_current_user),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS", optional=True)),
):
    """
    Actualiza un cliente.
    Los clientes autenticados solo pueden actualizar sus propios datos.
    Empleados y admin pueden actualizar cualquier cliente.
    """
    from app.models.cliente import Cliente
    
    # Si el usuario es cliente, verificar que sea su propio cliente
    if current_user:
        cliente = service.db.query(Cliente).filter(Cliente.usuario_id == current_user.id).first()
        if cliente and cliente.id == customer_id:
            return service.update_customer(customer_id, payload)
        # Si no es su cliente, verificar si es empleado/admin
        from app.core.dependencies import has_role
        if not (has_role(current_user, "ADMIN") or has_role(current_user, "VENTAS") or has_role(current_user, "INVENTARIOS")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar este cliente"
            )
    
    return service.update_customer(customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Elimina un cliente. Disponible para ADMIN y empleados."""
    service.delete_customer(customer_id)


@router.get("/{customer_id}/history")
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Obtiene el historial completo del cliente: compras, nombres, teléfonos, NITs usados."""
    from app.models.cliente import Cliente
    from app.models.venta import OrdenVenta
    from app.models.reserva import Reserva
    from app.models.factura import FacturaVenta
    from app.models.pago import PagoCliente
    from app.services.sale_service import SaleService
    from app.schemas.sale import SaleOrderListResponse
    from app.repositories.sale_repo import SaleFilter
    
    # Obtener cliente
    cliente = db.query(Cliente).filter(Cliente.id == customer_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    
    # Obtener todas las órdenes del cliente
    sale_service = SaleService(db=db)
    filters = SaleFilter(customer_id=customer_id)
    orders, total_orders = sale_service._repo.list(filters, page=1, page_size=1000)  # Obtener todas
    
    # Obtener todas las reservas
    reservas = db.query(Reserva).filter(Reserva.cliente_id == customer_id).order_by(Reserva.fecha_reserva.desc()).all()
    
    # Obtener todas las facturas
    facturas = db.query(FacturaVenta).filter(FacturaVenta.cliente_id == customer_id).order_by(FacturaVenta.fecha_emision.desc()).all()
    
    # Obtener todos los pagos
    pagos = db.query(PagoCliente).filter(PagoCliente.cliente_id == customer_id).order_by(PagoCliente.fecha_pago.desc()).all()
    
    # Datos actuales del cliente
    current_data = {
        "nombre": cliente.nombre,
        "telefono": cliente.telefono,
        "nit_ci": cliente.nit_ci,
        "correo": cliente.correo,
        "direccion": cliente.direccion,
        "fecha_registro": cliente.fecha_registro.isoformat() if cliente.fecha_registro else None,
        "usuario_id": cliente.usuario_id,
    }
    
    # Extraer variaciones únicas de nombres, teléfonos y NITs
    # Nota: Como no guardamos snapshot histórico, solo podemos mostrar el estado actual
    # En el futuro, se puede agregar una tabla de historial de cambios
    unique_names = set()
    unique_phones = set()
    unique_nits = set()
    
    if cliente.nombre:
        unique_names.add(cliente.nombre)
    if cliente.telefono:
        unique_phones.add(cliente.telefono)
    if cliente.nit_ci:
        unique_nits.add(cliente.nit_ci)
    
    # Mapear órdenes a respuesta
    order_items = [sale_service._map_order(order) for order in orders]
    
    # Calcular estadísticas
    total_gastado = sum(float(order.total) if hasattr(order, 'total') and order.total else 0 for order in order_items)
    
    return {
        "customer_id": customer_id,
        "current_data": current_data,
        "orders": {
            "items": order_items,
            "total": total_orders,
        },
        "reservations": [
            {
                "id": r.id,
                "fecha": r.fecha_reserva.isoformat() if r.fecha_reserva else None,
                "estado": r.estado,
            }
            for r in reservas
        ],
        "invoices": [
            {
                "id": f.id,
                "numero_factura": f.numero_factura,
                "fecha_emision": f.fecha_emision.isoformat() if f.fecha_emision else None,
                "total": float(f.total) if f.total else 0.0,
                "estado": f.estado,
            }
            for f in facturas
        ],
        "payments": [
            {
                "id": p.id,
                "monto": float(p.monto) if p.monto else 0.0,
                "metodo_pago": p.metodo_pago,
                "fecha_pago": p.fecha_pago.isoformat() if p.fecha_pago else None,
                "estado": p.estado,
            }
            for p in pagos
        ],
        "variations": {
            "names": list(unique_names),
            "phones": list(unique_phones),
            "nits": list(unique_nits),
            "note": "El historial completo de variaciones se mostrará cuando se implemente la tabla de historial de cambios del cliente.",
        },
        "statistics": {
            "total_orders": total_orders,
            "total_reservations": len(reservas),
            "total_invoices": len(facturas),
            "total_payments": len(pagos),
            "total_spent": total_gastado,
            "first_order_date": order_items[0].fecha.isoformat() if order_items else None,
            "last_order_date": order_items[-1].fecha.isoformat() if order_items else None,
        },
    }

