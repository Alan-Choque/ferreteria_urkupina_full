from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.repositories.supplier_repo import SupplierFilter, SupplierRepository
from app.schemas.supplier import (
    ContactoProveedorCreateRequest,
    ContactoProveedorResponse,
    ContactoProveedorUpdateRequest,
    SupplierCreateRequest,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdateRequest,
    SupplierProductResponse,
)
from app.models.proveedor import Proveedor, ContactoProveedor
from app.models.producto import Producto
from app.models.compra import OrdenCompra, ItemOrdenCompra


@dataclass(slots=True)
class SupplierService:
    db: Session
    _repo: SupplierRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = SupplierRepository(self.db)

    def list_suppliers(
        self,
        *,
        q: Optional[str],
        page: int,
        page_size: int,
    ) -> SupplierListResponse:
        filters = SupplierFilter(search=q)
        suppliers, total = self._repo.list(filters, page, page_size)
        items = []
        for supplier in suppliers:
            supplier_dict = {
                "id": supplier.id,
                "nombre": supplier.nombre,
                "nit_ci": supplier.nit_ci,
                "telefono": supplier.telefono,
                "correo": supplier.correo,
                "direccion": supplier.direccion,
                "fecha_registro": supplier.fecha_registro,
                "activo": supplier.activo,
            }
            items.append(SupplierResponse.model_validate(supplier_dict))
        return SupplierListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_supplier(self, supplier_id: int) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        
        # Cargar productos asociados
        productos = []
        if supplier.productos:
            for producto in supplier.productos:
                productos.append(SupplierProductResponse(
                    id=producto.id,
                    nombre=producto.nombre,
                    categoria=producto.categoria.nombre if producto.categoria else None,
                ))
        
        # Cargar contactos
        contactos = []
        if supplier.contactos:
            for contacto in supplier.contactos:
                contactos.append(ContactoProveedorResponse(
                    id=contacto.id,
                    proveedor_id=contacto.proveedor_id,
                    nombre=contacto.nombre,
                    cargo=contacto.cargo,
                    telefono=contacto.telefono,
                    correo=contacto.correo,
                    observaciones=contacto.observaciones,
                    activo=contacto.activo,
                ))
        
        supplier_dict = {
            "id": supplier.id,
            "nombre": supplier.nombre,
            "nit_ci": supplier.nit_ci,
            "telefono": supplier.telefono,
            "correo": supplier.correo,
            "direccion": supplier.direccion,
            "fecha_registro": supplier.fecha_registro,
            "activo": supplier.activo,
            "productos": productos,
            "contactos": contactos,
        }
        return SupplierResponse.model_validate(supplier_dict)

    def create_supplier(self, payload: SupplierCreateRequest) -> SupplierResponse:
        data = payload.model_dump(exclude={"productos_ids", "contactos"})
        supplier = self._repo.create(data)
        
        # Asociar productos si se proporcionaron
        if payload.productos_ids:
            productos = self.db.query(Producto).filter(Producto.id.in_(payload.productos_ids)).all()
            supplier.productos = productos
        
        # Crear contactos si se proporcionaron
        if payload.contactos:
            for contacto_data in payload.contactos:
                contacto = ContactoProveedor(
                    proveedor_id=supplier.id,
                    **contacto_data.model_dump()
                )
                self.db.add(contacto)
        
        self.db.commit()
        self.db.refresh(supplier)
        return self.get_supplier(supplier.id)

    def update_supplier(self, supplier_id: int, payload: SupplierUpdateRequest) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        
        data = {k: v for k, v in payload.model_dump(exclude={"productos_ids"}).items() if v is not None}
        if data:
            supplier = self._repo.update(supplier, data)
        
        # Actualizar productos asociados si se proporcionaron
        if payload.productos_ids is not None:
            productos = self.db.query(Producto).filter(Producto.id.in_(payload.productos_ids)).all()
            supplier.productos = productos
            self.db.commit()
            self.db.refresh(supplier)
        
        return self.get_supplier(supplier.id)

    def activate_supplier(self, supplier_id: int) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        supplier.activo = True
        self.db.commit()
        self.db.refresh(supplier)
        return self.get_supplier(supplier.id)

    def deactivate_supplier(self, supplier_id: int) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        supplier.activo = False
        self.db.commit()
        self.db.refresh(supplier)
        return self.get_supplier(supplier.id)

    def delete_supplier(self, supplier_id: int) -> None:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        if supplier.ordenes_compra:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El proveedor tiene órdenes de compra asociadas",
            )
        self._repo.delete(supplier)

    def create_contact(self, payload: ContactoProveedorCreateRequest) -> ContactoProveedorResponse:
        contacto = ContactoProveedor(**payload.model_dump())
        self.db.add(contacto)
        self.db.commit()
        self.db.refresh(contacto)
        return ContactoProveedorResponse.model_validate(contacto)

    def update_contact(self, contact_id: int, payload: ContactoProveedorUpdateRequest) -> ContactoProveedorResponse:
        contacto = self.db.query(ContactoProveedor).filter(ContactoProveedor.id == contact_id).first()
        if not contacto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
        
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        for key, value in data.items():
            setattr(contacto, key, value)
        
        self.db.commit()
        self.db.refresh(contacto)
        return ContactoProveedorResponse.model_validate(contacto)

    def delete_contact(self, contact_id: int) -> None:
        contacto = self.db.query(ContactoProveedor).filter(ContactoProveedor.id == contact_id).first()
        if not contacto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
        self.db.delete(contacto)
        self.db.commit()

    def get_suppliers_report(self) -> dict:
        """Genera un reporte resumen de proveedores."""
        # Total de proveedores
        total_proveedores = self.db.query(func.count(Proveedor.id)).scalar() or 0
        proveedores_activos = self.db.query(func.count(Proveedor.id)).filter(Proveedor.activo == True).scalar() or 0
        proveedores_inactivos = total_proveedores - proveedores_activos
        
        # Top proveedores por monto comprado
        top_proveedores_stmt = (
            select(
                Proveedor.id,
                Proveedor.nombre,
                func.count(OrdenCompra.id).label("total_ordenes"),
                func.coalesce(
                    func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                    0
                ).label("total_comprado")
            )
            .select_from(Proveedor)
            .join(OrdenCompra, OrdenCompra.proveedor_id == Proveedor.id)
            .join(ItemOrdenCompra, ItemOrdenCompra.orden_compra_id == OrdenCompra.id)
            .group_by(Proveedor.id, Proveedor.nombre)
            .order_by(func.coalesce(
                func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                0
            ).desc())
            .limit(10)
        )
        top_proveedores = [
            {
                "proveedor_id": row.id,
                "nombre": row.nombre,
                "total_ordenes": int(row.total_ordenes or 0),
                "total_comprado": float(row.total_comprado or 0),
            }
            for row in self.db.execute(top_proveedores_stmt).all()
        ]
        
        return {
            "summary": {
                "total_proveedores": total_proveedores,
                "proveedores_activos": proveedores_activos,
                "proveedores_inactivos": proveedores_inactivos,
            },
            "top_proveedores": top_proveedores,
        }

