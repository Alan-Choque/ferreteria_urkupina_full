from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.venta import OrdenVenta
from app.repositories.sale_repo import SaleFilter, SaleRepository
from app.schemas.sale import (
    SaleCustomer,
    SaleItemResponse,
    SaleOrderCreateRequest,
    SaleOrderListResponse,
    SaleOrderResponse,
    SaleUser,
)


@dataclass(slots=True)
class SaleService:
    db: Session
    _repo: SaleRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = SaleRepository(self.db)

    def list_orders(
        self,
        *,
        customer_id: Optional[int],
        estado: Optional[str],
        page: int,
        page_size: int,
    ) -> SaleOrderListResponse:
        filters = SaleFilter(customer_id=customer_id, estado=estado)
        orders, total = self._repo.list(filters, page, page_size)
        items = [self._map_order(order) for order in orders]
        return SaleOrderListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_order(self, order_id: int) -> SaleOrderResponse:
        order = self._repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de venta no encontrada")
        return self._map_order(order)

    def create_order(
        self,
        payload: "SaleOrderCreateRequest",
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        import logging
        logger = logging.getLogger(__name__)
        
        from app.models.cliente import Cliente
        from app.models.usuario import Usuario
        from datetime import datetime
        from sqlalchemy import func

        logger.info(f"Creando orden - usuario_id: {usuario_id}, cliente_email: {payload.cliente_email}")

        # Obtener o crear cliente
        cliente_id = payload.cliente_id
        if not cliente_id:
            if payload.cliente_email:
                # Normalizar el email para búsqueda y almacenamiento
                email_normalizado = payload.cliente_email.strip().lower()
                
                # MEJORADO: Si hay un usuario autenticado, buscar cliente por relación directa usuario_id
                if usuario_id:
                    usuario = self.db.query(Usuario).filter(Usuario.id == usuario_id).first()
                    if usuario:
                        logger.info(f"Usuario encontrado: {usuario.id}, email: {usuario.correo}")
                        # Buscar cliente por relación directa usuario_id (más eficiente y seguro)
                        cliente = self.db.query(Cliente).filter(
                            Cliente.usuario_id == usuario_id
                        ).first()
                        if cliente:
                            logger.info(f"Cliente encontrado por usuario_id: {cliente.id}, email: {cliente.correo}")
                            cliente_id = cliente.id
                            # Actualizar datos del cliente si es necesario
                            if payload.cliente_nombre and cliente.nombre != payload.cliente_nombre:
                                cliente.nombre = payload.cliente_nombre
                            if payload.cliente_telefono and cliente.telefono != payload.cliente_telefono:
                                cliente.telefono = payload.cliente_telefono
                            if payload.cliente_nit_ci and cliente.nit_ci != payload.cliente_nit_ci:
                                cliente.nit_ci = payload.cliente_nit_ci
                            self.db.flush()
                        else:
                            # Si no tiene cliente asociado, buscar por email como fallback
                            if usuario.correo:
                                cliente = self.db.query(Cliente).filter(
                                    func.lower(Cliente.correo) == func.lower(usuario.correo)
                                ).first()
                                if cliente:
                                    # Vincular el cliente existente al usuario
                                    cliente.usuario_id = usuario_id
                                    logger.info(f"Cliente {cliente.id} vinculado al usuario {usuario_id}")
                                    cliente_id = cliente.id
                                    self.db.flush()
                
                # Si no se encontró cliente por usuario, buscar por el email proporcionado
                if not cliente_id:
                    cliente = self.db.query(Cliente).filter(
                        func.lower(Cliente.correo) == email_normalizado
                    ).first()
                    if cliente:
                        logger.info(f"Cliente encontrado por email proporcionado: {cliente.id}, email: {cliente.correo}")
                        # ACTUALIZAR información del cliente si es diferente o está vacía
                        # Esto evita duplicados y mantiene información actualizada
                        actualizado = False
                        if payload.cliente_nombre and (not cliente.nombre or cliente.nombre.strip() != payload.cliente_nombre.strip()):
                            logger.info(f"Actualizando nombre del cliente {cliente.id}: '{cliente.nombre}' -> '{payload.cliente_nombre}'")
                            cliente.nombre = payload.cliente_nombre.strip()
                            actualizado = True
                        
                        if payload.cliente_telefono and (not cliente.telefono or cliente.telefono.strip() != payload.cliente_telefono.strip()):
                            logger.info(f"Actualizando teléfono del cliente {cliente.id}: '{cliente.telefono}' -> '{payload.cliente_telefono}'")
                            cliente.telefono = payload.cliente_telefono.strip()
                            actualizado = True
                        
                        if payload.cliente_nit_ci and (not cliente.nit_ci or cliente.nit_ci.strip() != payload.cliente_nit_ci.strip()):
                            logger.info(f"Actualizando NIT/CI del cliente {cliente.id}: '{cliente.nit_ci}' -> '{payload.cliente_nit_ci}'")
                            cliente.nit_ci = payload.cliente_nit_ci.strip()
                            actualizado = True
                        
                        # Si se encontró por email pero no tenía usuario_id, y hay usuario_id, vincularlo
                        if usuario_id and not cliente.usuario_id:
                            logger.info(f"Vinculando cliente {cliente.id} al usuario {usuario_id}")
                            cliente.usuario_id = usuario_id
                            actualizado = True
                        
                        if actualizado:
                            self.db.flush()
                            logger.info(f"Cliente {cliente.id} actualizado correctamente")
                        
                        cliente_id = cliente.id
                        
                        # Guardar snapshot de los datos del cliente en la orden (para historial)
                        # Esto se hará después de crear la orden
                    else:
                        # Crear nuevo cliente
                        if not payload.cliente_nombre:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Se requiere cliente_nombre cuando se crea un nuevo cliente"
                            )
                        logger.info(f"Creando nuevo cliente con email: {email_normalizado}")
                        cliente = Cliente(
                            nombre=payload.cliente_nombre,
                            correo=email_normalizado,
                            nit_ci=payload.cliente_nit_ci,
                            telefono=payload.cliente_telefono,
                            fecha_registro=datetime.now(),
                            usuario_id=usuario_id, # Asignar usuario_id si está presente
                        )
                        self.db.add(cliente)
                        self.db.flush()
                        cliente_id = cliente.id
                        logger.info(f"Cliente creado: {cliente_id}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Se requiere cliente_id o cliente_email"
                )

        # Validar items
        if not payload.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden debe tener al menos un item"
            )

        # Preparar items para el repositorio
        from app.models.variante_producto import VarianteProducto
        items_data = []
        for item in payload.items:
            # Si no se proporciona precio, obtenerlo de la variante
            precio_unitario = item.precio_unitario
            if precio_unitario is None:
                variante = self.db.query(VarianteProducto).filter(
                    VarianteProducto.id == item.variante_producto_id
                ).first()
                if variante and variante.precio:
                    precio_unitario = float(variante.precio)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"La variante {item.variante_producto_id} no tiene precio. Por favor, proporciona precio_unitario."
                    )
            
            items_data.append({
                "variante_producto_id": item.variante_producto_id,
                "cantidad": item.cantidad,
                "precio_unitario": precio_unitario,
            })

        # Crear la orden
        logger.info(f"Creando orden - cliente_id: {cliente_id}, usuario_id: {usuario_id}, items: {len(items_data)}")
        orden = self._repo.create(
            cliente_id=cliente_id,
            items=items_data,
            estado=payload.estado,
            usuario_id=usuario_id,
            metodo_pago=payload.metodo_pago,
            direccion_entrega=payload.direccion_entrega,
            sucursal_recogida_id=payload.sucursal_recogida_id,
        )
        logger.info(f"Orden creada: {orden.id}, usuario_id guardado: {orden.usuario_id}, metodo_pago: {payload.metodo_pago}")

        # Generar factura automáticamente si la orden está en estado PAGADO
        # (En Bolivia, las facturas son obligatorias para ventas formales)
        if payload.estado == "PAGADO":
            try:
                self._generate_invoice_for_order(orden.id, usuario_id)
                logger.info(f"Factura generada automáticamente para orden {orden.id}")
            except Exception as e:
                logger.error(f"Error al generar factura automática para orden {orden.id}: {e}")
                # No fallar la creación de la orden si falla la factura

        return self._map_order(orden)

    def _generate_invoice_for_order(self, orden_id: int, usuario_id: Optional[int] = None) -> None:
        """Genera una factura automáticamente para una orden"""
        from app.services.invoice_service import InvoiceService
        from app.schemas.invoice import InvoiceCreateRequest

        # Obtener la orden con sus items
        orden = self._repo.get(orden_id)
        if not orden:
            return

        # Verificar que no exista ya una factura para esta orden
        from app.models.factura import FacturaVenta
        existing_invoice = self.db.query(FacturaVenta).filter(
            FacturaVenta.orden_venta_id == orden_id
        ).first()
        if existing_invoice:
            return  # Ya existe factura, no crear otra

        # Preparar items para la factura
        invoice_items = []
        for item in orden.items:
            invoice_items.append({
                "variante_producto_id": item.variante_producto_id,
                "cantidad": float(item.cantidad),
                "precio_unitario": float(item.precio_unitario) if item.precio_unitario else 0.0,
                "descuento": 0.0,
            })

        # Crear la factura
        invoice_service = InvoiceService(self.db)
        invoice_payload = InvoiceCreateRequest(
            orden_venta_id=orden_id,
            cliente_id=orden.cliente_id,
            nit_cliente=orden.cliente.nit_ci if orden.cliente else None,
            razon_social=orden.cliente.nombre if orden.cliente else None,
            items=invoice_items,
        )
        invoice_service.create_invoice(invoice_payload, usuario_id=usuario_id)

    def update_order_status(
        self,
        order_id: int,
        new_status: str,
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        """Actualiza el estado de una orden"""
        from datetime import datetime
        
        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de venta no encontrada"
            )
        
        # Actualizar estado y fechas según el nuevo estado
        orden.estado = new_status
        
        if new_status == "PREPARANDO" and not orden.fecha_preparacion:
            orden.fecha_preparacion = datetime.utcnow()
        elif new_status in ["ENVIADO", "EN_ENVIO"] and not orden.fecha_envio:
            orden.fecha_envio = datetime.utcnow()
        elif new_status == "ENTREGADO" and not orden.fecha_entrega:
            orden.fecha_entrega = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(orden)
        return self._map_order(orden)

    def ship_order(
        self,
        order_id: int,
        repartidor_id: Optional[int] = None,
        direccion_entrega: Optional[str] = None,
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        """Marca una orden como enviada"""
        from datetime import datetime
        
        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de venta no encontrada"
            )
        
        orden.estado = "EN_ENVIO"
        orden.fecha_envio = datetime.utcnow()
        if repartidor_id:
            orden.repartidor_id = repartidor_id
        if direccion_entrega:
            orden.direccion_entrega = direccion_entrega
        
        self.db.commit()
        self.db.refresh(orden)
        return self._map_order(orden)

    def deliver_order(
        self,
        order_id: int,
        persona_recibe: str,
        observaciones: Optional[str] = None,
        pago_contra_entrega: Optional[dict] = None,
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        """Marca una orden como entregada. Si es contra entrega, crea el pago y factura."""
        from datetime import datetime
        from app.services.payment_service import PaymentService
        from app.schemas.payment import PaymentCreateRequest
        
        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de venta no encontrada"
            )
        
        # Si es contra entrega y se proporciona pago, crear el pago y factura
        if orden.metodo_pago == "CONTRA_ENTREGA" and pago_contra_entrega:
            # Calcular total de la orden
            total = sum(
                float(item.cantidad) * (float(item.precio_unitario) if item.precio_unitario else 0.0)
                for item in orden.items
            )
            
            # Crear pago
            payment_service = PaymentService(self.db)
            payment_payload = PaymentCreateRequest(
                cliente_id=orden.cliente_id,
                orden_venta_id=orden_id,
                monto=pago_contra_entrega.get("monto", total),
                metodo_pago=pago_contra_entrega.get("metodo_pago", "EFECTIVO"),
                fecha_pago=datetime.utcnow(),
                observaciones=f"Pago contra entrega - {observaciones or ''}",
            )
            payment_service.create_payment(payment_payload, usuario_id=usuario_id)
            
            # Generar factura
            try:
                self._generate_invoice_for_order(orden_id, usuario_id)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al generar factura para orden {orden_id}: {e}")
        
        # Actualizar orden
        orden.estado = "ENTREGADO"
        orden.fecha_entrega = datetime.utcnow()
        orden.persona_recibe = persona_recibe
        orden.observaciones_entrega = observaciones
        
        self.db.commit()
        self.db.refresh(orden)
        return self._map_order(orden)

    def ready_for_pickup(
        self,
        order_id: int,
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        """Marca una orden como lista para recoger en tienda"""
        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de venta no encontrada"
            )
        
        if orden.metodo_pago != "RECOGER_EN_TIENDA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta orden no es para recoger en tienda"
            )
        
        orden.estado = "LISTO_PARA_RECOGER"
        self.db.commit()
        self.db.refresh(orden)
        return self._map_order(orden)

    def pickup_order(
        self,
        order_id: int,
        persona_recibe: str,
        observaciones: Optional[str] = None,
        pago_al_recoger: Optional[dict] = None,
        usuario_id: Optional[int] = None,
    ) -> SaleOrderResponse:
        """Marca una orden como recogida en tienda. Si no pagó antes, crea el pago y factura."""
        from datetime import datetime
        from app.services.payment_service import PaymentService
        from app.schemas.payment import PaymentCreateRequest
        from app.models.pago import PagoCliente
        
        orden = self._repo.get(order_id)
        if not orden:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden de venta no encontrada"
            )
        
        if orden.metodo_pago != "RECOGER_EN_TIENDA":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta orden no es para recoger en tienda"
            )
        
        # Verificar si ya pagó
        existing_payment = self.db.query(PagoCliente).filter(
            PagoCliente.orden_venta_id == orden.id,
            PagoCliente.estado == "CONFIRMADO"
        ).first()
        
        # Si no pagó antes y se proporciona pago, crear el pago y factura
        if not existing_payment and pago_al_recoger:
            # Calcular total de la orden
            total = sum(
                float(item.cantidad) * (float(item.precio_unitario) if item.precio_unitario else 0.0)
                for item in orden.items
            )
            
            # Crear pago
            payment_service = PaymentService(self.db)
            payment_payload = PaymentCreateRequest(
                cliente_id=orden.cliente_id,
                orden_venta_id=orden.id,
                monto=pago_al_recoger.get("monto", total),
                metodo_pago=pago_al_recoger.get("metodo_pago", "EFECTIVO"),
                fecha_pago=datetime.utcnow(),
                observaciones=f"Pago al recoger en tienda - {observaciones or ''}",
            )
            payment_service.create_payment(payment_payload, usuario_id=usuario_id)
            
            # Generar factura
            try:
                self._generate_invoice_for_order(orden.id, usuario_id)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al generar factura para orden {orden.id}: {e}")
        
        # Actualizar orden
        orden.estado = "ENTREGADO"
        orden.fecha_entrega = datetime.utcnow()
        orden.persona_recibe = persona_recibe
        orden.observaciones_entrega = observaciones
        if usuario_id:
            orden.repartidor_id = usuario_id  # Empleado que atendió
        
        self.db.commit()
        self.db.refresh(orden)
        return self._map_order(orden)

    def _map_order(self, order: OrdenVenta) -> SaleOrderResponse:
        total = 0.0
        items: list[SaleItemResponse] = []
        for item in order.items:
            price = float(item.precio_unitario) if item.precio_unitario is not None else 0.0
            total += float(item.cantidad) * price
            items.append(
                SaleItemResponse(
                    id=item.id,
                    variante_producto_id=item.variante_producto_id,
                    variante_nombre=item.variante.nombre if item.variante else None,
                    cantidad=float(item.cantidad),
                    precio_unitario=price if item.precio_unitario is not None else None,
                )
            )
        cliente = (
            SaleCustomer(id=order.cliente.id, nombre=order.cliente.nombre) if order.cliente else None
        )
        usuario = (
            SaleUser(id=order.usuario.id, nombre_usuario=order.usuario.nombre_usuario) if order.usuario else None
        )
        return SaleOrderResponse(
            id=order.id,
            fecha=order.fecha,
            estado=order.estado,
            metodo_pago=order.metodo_pago,
            fecha_pago=order.fecha_pago,
            fecha_preparacion=order.fecha_preparacion,
            fecha_envio=order.fecha_envio,
            fecha_entrega=order.fecha_entrega,
            direccion_entrega=order.direccion_entrega,
            persona_recibe=order.persona_recibe,
            observaciones_entrega=order.observaciones_entrega,
            cliente=cliente,
            usuario=usuario,
            items=items,
            total=round(total, 2),
        )
