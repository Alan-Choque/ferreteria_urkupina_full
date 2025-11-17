from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.imagen_producto import ImagenProducto


@dataclass(slots=True)
class FileFilter:
    producto_id: Optional[int] = None
    search: Optional[str] = None


class FileRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return select(ImagenProducto)

    def _apply_filters(self, stmt, filters: FileFilter):
        if filters.producto_id:
            stmt = stmt.where(ImagenProducto.producto_id == filters.producto_id)
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            stmt = stmt.where(
                or_(
                    ImagenProducto.descripcion.ilike(pattern),
                    ImagenProducto.url.ilike(pattern),
                )
            )
        return stmt

    def list(self, filters: FileFilter, page: int, page_size: int) -> tuple[list[ImagenProducto], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(ImagenProducto.fecha_creacion.desc()), filters
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(ImagenProducto), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).unique()
        rows: Sequence[ImagenProducto] = result.scalars().all()
        return list(rows), total

    def get(self, file_id: int) -> ImagenProducto | None:
        stmt = self._base_stmt().where(ImagenProducto.id == file_id)
        return self._db.scalars(stmt).first()

