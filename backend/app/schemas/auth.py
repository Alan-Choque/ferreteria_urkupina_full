from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    """Request de registro con validaciones."""
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario")
    email: EmailStr = Field(..., description="Email del usuario")
    password: str = Field(..., min_length=8, max_length=100, description="Contraseña (mínimo 8 caracteres)")
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Valida que el nombre de usuario no tenga espacios."""
        if ' ' in v:
            raise ValueError('El nombre de usuario no puede contener espacios')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida que la contraseña tenga al menos 8 caracteres."""
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v


class RegisterResponse(BaseModel):
    """Response de registro con usuario y token."""
    user: "UserResponse"
    token: Token


class UserResponse(BaseModel):
    id: int
    nombre_usuario: str
    correo: str
    activo: bool
    roles: list[str]

    class Config:
        from_attributes = True


# Actualizar referencia forward para RegisterResponse
RegisterResponse.model_rebuild()


