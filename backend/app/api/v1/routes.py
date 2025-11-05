from fastapi import APIRouter
from app.api.v1 import products, inventory, auth
from app.api.v1.admin import routes as admin_routes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["admin"])
