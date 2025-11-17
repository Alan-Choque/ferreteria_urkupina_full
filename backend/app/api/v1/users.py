from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.user import (
    RoleResponse,
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
    UserUpdateRolesRequest,
)
from app.services.user_service import UserService

router = APIRouter()


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db=db)


@router.get("", response_model=UserListResponse)
def list_users(
    q: Optional[str] = Query(None, description="Filtro por nombre de usuario o correo"),
    active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_users(search=q, active=active, page=page, page_size=page_size)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_user(payload)


@router.get("/roles/all", response_model=list[RoleResponse])
def list_roles(
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_roles()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_user(user_id, payload)


@router.put("/{user_id}/roles", response_model=UserResponse)
def update_user_roles(
    user_id: int,
    payload: UserUpdateRolesRequest,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_roles(user_id, payload)


@router.post("/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.set_active(user_id, True)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    if user_id == 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede desactivar al usuario raíz")
    return service.set_active(user_id, False)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.delete_user(user_id)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_202_ACCEPTED)
def reset_user_password(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.send_password_reset(user_id)

