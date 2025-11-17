from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class FileAssetResponse(BaseModel):
    id: int
    producto_id: int
    url: str
    descripcion: Optional[str] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class FileAssetListResponse(BaseModel):
    items: List[FileAssetResponse]
    total: int
    page: int
    page_size: int

