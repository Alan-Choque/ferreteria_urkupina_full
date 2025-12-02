import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from app.core.security import (
    verify_password, 
    get_password_hash,
    create_access_token, 
    create_refresh_token, 
    decode_token,
    create_password_reset_token,
    verify_password_reset_token
)
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.auth import (
    Token, 
    LoginRequest, 
    RefreshRequest, 
    UserResponse, 
    RegisterRequest, 
    RegisterResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SocialAuthRequest
)
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

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
    
    subject = str(user.id)
    access_token = create_access_token(data={"sub": subject})
    refresh_token = create_refresh_token(data={"sub": subject})
    
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
        
        subject = str(user_id)
        access_token = create_access_token(data={"sub": subject})
        refresh_token = create_refresh_token(data={"sub": subject})
        
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
    
    user_service = UserService(db=db)
    user_response, token_response = user_service.register_user(
        request,
        idempotency_key=idempotency_key,
        request_path=request_obj.url.path,
        request_method="POST",
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


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Solicita un token de recuperación de contraseña.
    
    Por seguridad, siempre retorna éxito aunque el email no exista,
    para evitar enumeración de usuarios.
    """
    try:
        user = db.query(Usuario).filter(Usuario.correo == request.email).first()
        
        # Si el usuario existe y está activo, generar token y enviar email
        if user and user.activo:
            reset_token = create_password_reset_token(user.id)
            
            # TODO: Enviar email con el token
            # Por ahora, solo logueamos el token (en producción, enviar email)
            reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
            logger.info(f"Password reset token for user {user.id} ({user.correo}): {reset_url}")
            
            # En producción, aquí se enviaría el email:
            # send_password_reset_email(user.correo, reset_url)
        
        # Siempre retornar éxito para no revelar si el email existe
        return {
            "message": "Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña."
        }
    except Exception as e:
        logger.error(f"Error en forgot_password: {str(e)}")
        # Por seguridad, retornar éxito incluso si hay error
        return {
            "message": "Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña."
        }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Restablece la contraseña usando un token de recuperación.
    
    El token debe ser válido y no haber expirado (válido por 1 hora).
    """
    try:
        # Verificar y decodificar el token
        user_id = verify_password_reset_token(request.token)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido o expirado. Por favor, solicita un nuevo enlace de recuperación."
            )
        
        # Buscar el usuario
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        if not user.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo"
            )
        
        # Actualizar la contraseña
        user.hash_contrasena = get_password_hash(request.new_password)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Password reset successful for user {user.id} ({user.correo})")
        
        return {
            "message": "Contraseña restablecida exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en reset_password: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer la contraseña. Por favor, intenta más tarde."
        )


async def verify_google_token(id_token: str) -> dict | None:
    """Verifica un ID token de Google y retorna la información del usuario."""
    try:
        async with httpx.AsyncClient() as client:
            # Verificar el token con Google
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                # Verificar que el token sea válido
                if data.get("aud") == settings.google_client_id or not settings.google_client_id:
                    return data
            return None
    except Exception as e:
        logger.error(f"Error verificando token de Google: {str(e)}")
        return None


@router.post("/social-auth", response_model=Token)
async def social_auth(
    request: SocialAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Autentica o registra un usuario usando un proveedor OAuth (Google, Facebook, etc.).
    
    El frontend debe enviar el ID token obtenido del proveedor OAuth.
    """
    try:
        user_info = None
        
        if request.provider.lower() == "google":
            user_info = await verify_google_token(request.id_token)
            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de Google inválido o expirado"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Proveedor '{request.provider}' no soportado"
            )
        
        # Extraer información del usuario
        email = user_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo obtener el email del proveedor OAuth"
            )
        
        name = user_info.get("name") or user_info.get("given_name", "Usuario")
        # Generar username único desde el email si no hay nombre de usuario
        username_base = email.split("@")[0]
        
        # Buscar usuario existente por email
        user = db.query(Usuario).filter(Usuario.correo == email).first()
        
        if user:
            # Usuario existe, solo autenticar
            if not user.activo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Usuario inactivo"
                )
        else:
            # Crear nuevo usuario
            # Generar username único
            username = username_base
            counter = 1
            while db.query(Usuario).filter(Usuario.nombre_usuario == username).first():
                username = f"{username_base}{counter}"
                counter += 1
            
            # Crear hash de contraseña dummy para usuarios OAuth (no se usará)
            dummy_password = get_password_hash(f"oauth_{uuid.uuid4()}")
            
            from datetime import datetime
            user = Usuario(
                nombre_usuario=username,
                correo=email,
                hash_contrasena=dummy_password,
                fecha_creacion=datetime.utcnow(),
                fecha_modificacion=datetime.utcnow(),
                activo=True
            )
            db.add(user)
            db.flush()  # Para obtener el ID
            
            # Asignar rol de usuario por defecto (SUPERVISOR si existe, sino el primer rol disponible)
            from app.models.usuario import Rol
            user_role = db.query(Rol).filter(Rol.nombre == "SUPERVISOR").first()
            if not user_role:
                # Si no existe SUPERVISOR, buscar ADMIN, INVENTARIOS, VENTAS en ese orden
                user_role = db.query(Rol).filter(Rol.nombre == "ADMIN").first()
            if not user_role:
                user_role = db.query(Rol).filter(Rol.nombre == "INVENTARIOS").first()
            if not user_role:
                user_role = db.query(Rol).filter(Rol.nombre == "VENTAS").first()
            if not user_role:
                # Si no existe ninguno de los roles esperados, usar el primer rol disponible
                user_role = db.query(Rol).first()
            if user_role:
                user.roles.append(user_role)
            
            db.commit()
            db.refresh(user)
            logger.info(f"Nuevo usuario creado desde OAuth: {user.id} ({email})")
        
        # Generar tokens JWT
        subject = str(user.id)
        access_token = create_access_token(data={"sub": subject})
        refresh_token = create_refresh_token(data={"sub": subject})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en social_auth: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en autenticación social. Por favor, intenta más tarde."
        )

