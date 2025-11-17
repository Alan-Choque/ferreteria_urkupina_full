from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.almacen import Almacen
from app.models.inventario import (
    AjusteStock,
    ItemAjusteStock,
    ItemTransferenciaStock,
    LibroStock,
    TransferenciaStock,
)
from app.models.producto_almacen import ProductoAlmacen
from app.models.variante_producto import VarianteProducto
from app.repositories.inventory_repo import InventoryRepository
from app.schemas.inventory import (
    InventoryAdjustmentRequest,
    InventoryEntryRequest,
    InventoryOperationResult,
    InventoryTransferRequest,
    StockEntry,
    StockSummary,
    VariantSearchItem,
    VariantStockOverview,
    WarehouseResponse,
)


@dataclass(slots=True)
class InventoryService:
    db: Session
    _repo: InventoryRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = InventoryRepository(self.db)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _ensure_variant_exists(self, variant_id: int) -> VarianteProducto:
        variante = self.db.get(VarianteProducto, variant_id)
        if not variante:
            msg = f"Variante {variant_id} no encontrada"
            raise ValueError(msg)
        return variante

    def _ensure_warehouse_exists(self, almacen_id: int) -> Almacen:
        almacen = self.db.get(Almacen, almacen_id)
        if not almacen:
            msg = f"Almacén {almacen_id} no encontrado"
            raise ValueError(msg)
        return almacen

    def _get_or_create_stock(self, variant_id: int, warehouse_id: int) -> ProductoAlmacen:
        stock = self._repo.get_stock_record(variant_id, warehouse_id)
        if stock:
            return stock
        now = datetime.utcnow()
        stock = ProductoAlmacen(
            variante_producto_id=variant_id,
            almacen_id=warehouse_id,
            cantidad_disponible=0,
            costo_promedio=None,
            fecha_actualizacion=now,
        )
        self.db.add(stock)
        self.db.flush()
        return stock

    @staticmethod
    def _calculate_average_cost(
        prev_qty: float,
        prev_cost: Optional[float],
        incoming_qty: float,
        incoming_cost: Optional[float],
    ) -> Optional[float]:
        if incoming_cost is None or incoming_qty <= 0:
            return prev_cost
        if prev_cost is None or prev_qty <= 0:
            return incoming_cost
        total_qty = prev_qty + incoming_qty
        if total_qty <= 0:
            return incoming_cost
        weighted = ((prev_cost * prev_qty) + (incoming_cost * incoming_qty)) / total_qty
        return round(weighted, 2)

    def _build_stock_entry(self, variant_id: int, warehouse_id: int) -> StockEntry:
        stock = self._repo.get_stock_record(variant_id, warehouse_id)
        if not stock:
            almacen = self._ensure_warehouse_exists(warehouse_id)
            return StockEntry(
                variante_id=variant_id,
                almacen_id=warehouse_id,
                almacen_nombre=almacen.nombre,
                cantidad_disponible=0.0,
                costo_promedio=None,
            )
        almacen_nombre = stock.almacen.nombre if stock.almacen else "Desconocido"
        return StockEntry(
            variante_id=stock.variante_producto_id,
            almacen_id=stock.almacen_id,
            almacen_nombre=almacen_nombre,
            cantidad_disponible=float(stock.cantidad_disponible),
            costo_promedio=float(stock.costo_promedio) if stock.costo_promedio is not None else None,
        )

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------
    def stock_by_variant(self, variant_id: int) -> list[StockEntry]:
        self._ensure_variant_exists(variant_id)
        registros = self._repo.stock_by_variant(variant_id)
        return [
            StockEntry(
                variante_id=registro.variante_producto_id,
                almacen_id=registro.almacen_id,
                almacen_nombre=registro.almacen.nombre if registro.almacen else "Desconocido",
                cantidad_disponible=float(registro.cantidad_disponible),
                costo_promedio=float(registro.costo_promedio) if registro.costo_promedio is not None else None,
            )
            for registro in registros
        ]

    def list_stock_summary(self) -> list[StockSummary]:
        registros = self._repo.list_all_stock()
        summary: list[StockSummary] = []
        for registro in registros:
            variante = registro.variante
            producto = variante.producto if variante else None
            unidad = variante.unidad_medida.nombre if variante and variante.unidad_medida else None
            summary.append(
                StockSummary(
                    producto_id=producto.id if producto else 0,
                    producto_nombre=producto.nombre if producto else "Sin producto",
                    variante_id=variante.id if variante else registro.variante_producto_id,
                    variante_nombre=variante.nombre if variante else None,
                    unidad_medida=unidad,
                    almacen_id=registro.almacen_id,
                    almacen_nombre=registro.almacen.nombre if registro.almacen else "Desconocido",
                    cantidad_disponible=float(registro.cantidad_disponible),
                    costo_promedio=float(registro.costo_promedio) if registro.costo_promedio is not None else None,
                )
            )
        return summary

    def list_warehouses(self) -> list[WarehouseResponse]:
        almacenes = self._repo.list_warehouses()
        return [
            WarehouseResponse(id=almacen.id, nombre=almacen.nombre, descripcion=almacen.descripcion)
            for almacen in almacenes
        ]

    def search_variants(self, search: str, limit: int = 20) -> list[VariantSearchItem]:
        variantes = self._repo.search_variants(search, limit=limit)
        results: list[VariantSearchItem] = []
        for variante in variantes:
            producto = variante.producto
            unidad = variante.unidad_medida.nombre if variante.unidad_medida else None
            stock_detalle: list[VariantStockOverview] = []
            total = 0.0
            for stock in variante.stock_almacenes:
                qty = float(stock.cantidad_disponible)
                stock_detalle.append(
                    VariantStockOverview(
                        almacen_id=stock.almacen_id,
                        almacen_nombre=stock.almacen.nombre if stock.almacen else "Desconocido",
                        cantidad_disponible=qty,
                    )
                )
                total += qty
            results.append(
                VariantSearchItem(
                    id=variante.id,
                    producto_id=producto.id if producto else 0,
                    producto_nombre=producto.nombre if producto else "Sin producto",
                    variante_nombre=variante.nombre,
                    unidad_medida=unidad,
                    total_stock=total,
                    stock_detalle=stock_detalle,
                )
            )
        return results

    # ------------------------------------------------------------------
    # Operaciones
    # ------------------------------------------------------------------
    def register_entry(self, payload: InventoryEntryRequest, user_id: Optional[int]) -> InventoryOperationResult:
        self._ensure_warehouse_exists(payload.almacen_id)
        updated_pairs: set[tuple[int, int]] = set()
        now = datetime.utcnow()
        try:
            for item in payload.items:
                self._ensure_variant_exists(item.variante_id)
                stock = self._get_or_create_stock(item.variante_id, payload.almacen_id)
                prev_qty = float(stock.cantidad_disponible)
                new_qty = prev_qty + item.cantidad
                stock.cantidad_disponible = new_qty
                new_cost = self._calculate_average_cost(prev_qty, float(stock.costo_promedio) if stock.costo_promedio is not None else None, item.cantidad, item.costo_unitario)
                if new_cost is not None:
                    stock.costo_promedio = new_cost
                stock.fecha_actualizacion = now

                movimiento = LibroStock(
                    variante_producto_id=item.variante_id,
                    almacen_id=payload.almacen_id,
                    tipo_movimiento="ENTRADA",
                    cantidad=item.cantidad,
                    fecha_movimiento=now,
                    descripcion=payload.descripcion or "Ingreso manual de inventario",
                )
                self.db.add(movimiento)
                updated_pairs.add((item.variante_id, payload.almacen_id))

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        updated_stock = [self._build_stock_entry(variante_id, almacen_id) for variante_id, almacen_id in sorted(updated_pairs)]
        return InventoryOperationResult(
            message="Ingreso registrado correctamente.",
            updated_stock=updated_stock,
        )

    def transfer_stock(self, payload: InventoryTransferRequest, user_id: Optional[int]) -> InventoryOperationResult:
        if payload.almacen_origen_id == payload.almacen_destino_id:
            raise ValueError("El almacén de origen y destino deben ser distintos.")
        self._ensure_warehouse_exists(payload.almacen_origen_id)
        self._ensure_warehouse_exists(payload.almacen_destino_id)
        updated_pairs: set[tuple[int, int]] = set()
        now = datetime.utcnow()
        transfer = TransferenciaStock(
            fecha=now,
            usuario_id=user_id,
            almacen_origen_id=payload.almacen_origen_id,
            almacen_destino_id=payload.almacen_destino_id,
            descripcion=payload.descripcion,
        )
        self.db.add(transfer)
        self.db.flush()  # Obtener ID para descripción
        try:
            for item in payload.items:
                self._ensure_variant_exists(item.variante_id)
                stock_origen = self._get_or_create_stock(item.variante_id, payload.almacen_origen_id)
                stock_destino = self._get_or_create_stock(item.variante_id, payload.almacen_destino_id)

                origen_qty = float(stock_origen.cantidad_disponible)
                if origen_qty < item.cantidad:
                    raise ValueError(
                        f"Stock insuficiente para la variante {item.variante_id} en el almacén origen."
                    )

                destino_qty = float(stock_destino.cantidad_disponible)
                stock_origen.cantidad_disponible = origen_qty - item.cantidad
                stock_destino.cantidad_disponible = destino_qty + item.cantidad

                origin_cost = float(stock_origen.costo_promedio) if stock_origen.costo_promedio is not None else None
                destination_cost = float(stock_destino.costo_promedio) if stock_destino.costo_promedio is not None else None
                new_dest_cost = self._calculate_average_cost(
                    destino_qty,
                    destination_cost,
                    item.cantidad,
                    origin_cost,
                )
                if new_dest_cost is not None:
                    stock_destino.costo_promedio = new_dest_cost

                stock_origen.fecha_actualizacion = now
                stock_destino.fecha_actualizacion = now

                item_transfer = ItemTransferenciaStock(
                    transferencia=transfer,
                    variante_producto_id=item.variante_id,
                    cantidad=item.cantidad,
                )
                self.db.add(item_transfer)

                salida = LibroStock(
                    variante_producto_id=item.variante_id,
                    almacen_id=payload.almacen_origen_id,
                    tipo_movimiento="SALIDA",
                    cantidad=item.cantidad,
                    fecha_movimiento=now,
                    descripcion=f"Transferencia #{transfer.id} - {payload.descripcion or 'Sin descripción'}",
                )
                entrada = LibroStock(
                    variante_producto_id=item.variante_id,
                    almacen_id=payload.almacen_destino_id,
                    tipo_movimiento="ENTRADA",
                    cantidad=item.cantidad,
                    fecha_movimiento=now,
                    descripcion=f"Transferencia #{transfer.id} - {payload.descripcion or 'Sin descripción'}",
                )
                self.db.add_all([salida, entrada])

                updated_pairs.add((item.variante_id, payload.almacen_origen_id))
                updated_pairs.add((item.variante_id, payload.almacen_destino_id))

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        updated_stock = [self._build_stock_entry(variante_id, almacen_id) for variante_id, almacen_id in sorted(updated_pairs)]
        return InventoryOperationResult(
            message=f"Transferencia #{transfer.id} registrada correctamente.",
            updated_stock=updated_stock,
        )

    def adjust_stock(self, payload: InventoryAdjustmentRequest, user_id: Optional[int]) -> InventoryOperationResult:
        updated_pairs: set[tuple[int, int]] = set()
        now = datetime.utcnow()
        ajuste = AjusteStock(
            fecha=now,
            descripcion=payload.descripcion,
            usuario_id=user_id,
        )
        self.db.add(ajuste)
        self.db.flush()
        try:
            for item in payload.items:
                self._ensure_variant_exists(item.variante_id)
                self._ensure_warehouse_exists(item.almacen_id)
                stock = self._get_or_create_stock(item.variante_id, item.almacen_id)
                prev_qty = float(stock.cantidad_disponible)
                diff = item.cantidad_nueva - prev_qty
                stock.cantidad_disponible = item.cantidad_nueva
                stock.fecha_actualizacion = now

                item_ajuste = ItemAjusteStock(
                    ajuste=ajuste,
                    variante_producto_id=item.variante_id,
                    cantidad_anterior=prev_qty,
                    cantidad_nueva=item.cantidad_nueva,
                )
                self.db.add(item_ajuste)

                if diff != 0:
                    movimiento = LibroStock(
                        variante_producto_id=item.variante_id,
                        almacen_id=item.almacen_id,
                        tipo_movimiento="ENTRADA" if diff > 0 else "SALIDA",
                        cantidad=abs(diff),
                        fecha_movimiento=now,
                        descripcion=f"Ajuste #{ajuste.id} - {payload.descripcion or 'Sin descripción'}",
                    )
                    self.db.add(movimiento)

                updated_pairs.add((item.variante_id, item.almacen_id))

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        updated_stock = [self._build_stock_entry(variante_id, almacen_id) for variante_id, almacen_id in sorted(updated_pairs)]
        return InventoryOperationResult(
            message=f"Ajuste #{ajuste.id} registrado correctamente.",
            updated_stock=updated_stock,
        )
