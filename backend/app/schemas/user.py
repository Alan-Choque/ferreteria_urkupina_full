from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RoleResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: int
    nombre_usuario: str
    correo: str
    activo: bool
    roles: List[str]

    class Config:
        from_attributes = True


class UserResponse(UserSummary):
    pass


class UserListResponse(BaseModel):
    items: List[UserSummary]
    total: int
    page: int
    page_size: int


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    activo: bool = True
    role_ids: Optional[List[int]] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return value.strip()


class UserUpdateRolesRequest(BaseModel):
    role_ids: List[int] = Field(default_factory=list)


class UserUpdateRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    activo: Optional[bool] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if isinstance(value, str) else value

