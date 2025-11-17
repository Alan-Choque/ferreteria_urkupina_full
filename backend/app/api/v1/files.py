from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.file_asset import FileAssetListResponse, FileAssetResponse
from app.services.file_service import FileAssetService

router = APIRouter()


def get_file_service(db: Session = Depends(get_db)) -> FileAssetService:
    return FileAssetService(db=db)


@router.get("", response_model=FileAssetListResponse)
def list_files(
    producto_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: FileAssetService = Depends(get_file_service),
):
    return service.list_assets(producto_id=producto_id, search=search, page=page, page_size=page_size)


@router.get("/{file_id}", response_model=FileAssetResponse)
def get_file(
    file_id: int,
    service: FileAssetService = Depends(get_file_service),
):
    return service.get_asset(file_id)

