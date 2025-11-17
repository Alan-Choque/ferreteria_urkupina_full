from fastapi import APIRouter

from app.api.v1 import (
    auth,
    categories,
    customers,
    files,
    inventory,
    products,
    promotions,
    purchases,
    reports,
    reservations,
    sales,
    suppliers,
    users,
)
from app.api.v1.admin import routes as admin_routes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["admin"])
