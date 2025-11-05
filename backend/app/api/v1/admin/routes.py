from fastapi import APIRouter
from app.api.v1.admin import brands, categories

router = APIRouter()

router.include_router(brands.router, prefix="/brands", tags=["admin-brands"])
router.include_router(categories.router, prefix="/categories", tags=["admin-categories"])


