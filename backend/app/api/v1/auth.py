import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.auth import Token, LoginRequest, RefreshRequest, UserResponse, RegisterRequest, RegisterResponse
from app.services.user_service import register_user

router = APIRouter()


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Autentica un usuario y devuelve tokens JWT."""
    user = db.query(Usuario).filter(Usuario.correo == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    if not verify_password(request.password, user.hash_contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshRequest):
    """Refresca un token de acceso usando un refresh token."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de refresco inválido"
            )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de refresco inválido"
            )
        
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido"
        )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    request: RegisterRequest,
    request_obj: Request,
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key")
):
    """
    Registra un nuevo usuario con soporte de idempotencia.
    
    Si se proporciona el header Idempotency-Key, la request será idempotente:
    - Primera vez: crea el usuario y retorna 201
    - Requests siguientes con la misma key: retorna la misma respuesta sin duplicar
    
    Args:
        request: Datos de registro
        request_obj: Request object para obtener path
        db: Sesión de base de datos
        idempotency_key: Clave de idempotencia (opcional, desde header)
    
    Returns:
        RegisterResponse con usuario y token
    
    Raises:
        HTTPException: 409 si el usuario ya existe, 400 si hay error de validación
    """
    # Si no hay idempotency_key, generar uno automáticamente (opcional)
    # Pero es mejor que el cliente lo envíe explícitamente
    if not idempotency_key:
        # Generar uno automático para evitar duplicados accidentales
        idempotency_key = str(uuid.uuid4())
    
    user_response, token_response = register_user(
        db=db,
        request_data=request,
        idempotency_key=idempotency_key,
        request_path=request_obj.url.path,
        request_method="POST"
    )
    
    return RegisterResponse(user=user_response, token=token_response)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene la información del usuario actual."""
    return UserResponse(
        id=current_user.id,
        nombre_usuario=current_user.nombre_usuario,
        correo=current_user.correo,
        activo=bool(current_user.activo),
        roles=[rol.nombre for rol in current_user.roles]
    )

