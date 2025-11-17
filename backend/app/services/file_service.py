from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.file_repo import FileFilter, FileRepository
from app.schemas.file_asset import FileAssetListResponse, FileAssetResponse


@dataclass(slots=True)
class FileAssetService:
    db: Session

    def __post_init__(self) -> None:
        self._repo = FileRepository(self.db)

    def list_assets(
        self,
        *,
        producto_id: Optional[int],
        search: Optional[str],
        page: int,
        page_size: int,
    ) -> FileAssetListResponse:
        filters = FileFilter(producto_id=producto_id, search=search)
        assets, total = self._repo.list(filters, page, page_size)
        items = [FileAssetResponse.model_validate(asset) for asset in assets]
        return FileAssetListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_asset(self, file_id: int) -> FileAssetResponse:
        asset = self._repo.get(file_id)
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
        return FileAssetResponse.model_validate(asset)

