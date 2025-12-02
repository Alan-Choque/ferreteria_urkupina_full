from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.usuario import Usuario
from app.core.security import decode_token

security = HTTPBearer(auto_error=False)  # No lanza error si no hay token
security_required = HTTPBearer()  # Lanza error si no hay token (para endpoints que requieren auth)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_required),
    db: Session = Depends(get_db)
) -> Usuario:
    """Obtiene el usuario actual desde el token JWT."""
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        raw_user_id: Optional[str] = payload.get("sub")  # type: ignore[assignment]
        if raw_user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        try:
            user_id = int(raw_user_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido") from None
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    
    return user


async def get_current_active_user(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Obtiene el usuario actual activo."""
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    """Obtiene el usuario actual si hay token, None si no hay autenticación."""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        raw_user_id: Optional[str] = payload.get("sub")
        if raw_user_id is None:
            return None
        try:
            user_id = int(raw_user_id)
        except (TypeError, ValueError):
            return None
        user = db.query(Usuario).filter(Usuario.id == user_id).first()
        if user is None or not user.activo:
            return None
        return user
    except (ValueError, HTTPException):
        return None


def require_role(required_role: str, *additional_roles: str, optional: bool = False):
    """Dependency factory para requerir uno o más roles específicos.
    
    Args:
        required_role: Rol principal requerido
        *additional_roles: Roles adicionales (el usuario debe tener al menos uno)
        optional: Si es True, permite acceso sin autenticación (para endpoints públicos)
    """
    async def role_checker(
        current_user: Optional[Usuario] = Depends(get_current_user_optional if optional else get_current_user)
    ) -> Optional[Usuario]:
        if optional and current_user is None:
            return None
        
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Se requiere autenticación"
            )
        
        all_required_roles = [required_role] + list(additional_roles)
        normalized_required = [role.strip().upper() for role in all_required_roles]
        role_names = [rol.nombre.strip().upper() for rol in current_user.roles]
        
        # El usuario debe tener al menos uno de los roles requeridos
        if not any(role in role_names for role in normalized_required):
            roles_str = ", ".join(all_required_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de los siguientes roles: {roles_str}"
            )
        return current_user
    return role_checker


def get_user_roles(current_user: Usuario) -> list[str]:
    """Obtiene los nombres de los roles del usuario en mayúsculas."""
    return [rol.nombre.strip().upper() for rol in current_user.roles]


def has_role(current_user: Usuario, role_name: str) -> bool:
    """Verifica si el usuario tiene un rol específico."""
    role_names = get_user_roles(current_user)
    normalized_role = role_name.strip().upper()
    return normalized_role in role_names


def can_view_inventory(current_user: Usuario) -> bool:
    """Verifica si el usuario puede consultar inventario.
    
    Permisos: ADMIN, INVENTARIOS, SUPERVISOR
    """
    role_names = get_user_roles(current_user)
    return any(role in ["ADMIN", "INVENTARIOS", "SUPERVISOR"] for role in role_names)


def can_update_stock(current_user: Usuario) -> bool:
    """Verifica si el usuario puede actualizar stock.
    
    Permisos: ADMIN, INVENTARIOS
    """
    role_names = get_user_roles(current_user)
    return any(role in ["ADMIN", "INVENTARIOS"] for role in role_names)


def can_manage_products(current_user: Usuario) -> bool:
    """Verifica si el usuario puede gestionar productos (crear, editar, eliminar).
    
    Permisos: ADMIN
    """
    return has_role(current_user, "ADMIN")


def require_inventory_view():
    """Dependency para requerir permiso de consulta de inventario."""
    async def permission_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not can_view_inventory(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para consultar inventario. Se requiere rol: ADMIN, INVENTARIOS o SUPERVISOR"
            )
        return current_user
    return permission_checker


def require_stock_update():
    """Dependency para requerir permiso de actualización de stock."""
    async def permission_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not can_update_stock(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar stock. Se requiere rol: ADMIN o INVENTARIOS"
            )
        return current_user
    return permission_checker


def require_product_management():
    """Dependency para requerir permiso de gestión de productos."""
    async def permission_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not can_manage_products(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para gestionar productos. Se requiere rol: ADMIN"
            )
        return current_user
    return permission_checker


def can_manage_sales(current_user: Usuario) -> bool:
    """Verifica si el usuario puede gestionar ventas.
    
    Permisos: ADMIN, VENTAS
    """
    role_names = get_user_roles(current_user)
    return any(role in ["ADMIN", "VENTAS"] for role in role_names)


def require_sales_management():
    """Dependency para requerir permiso de gestión de ventas."""
    async def permission_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not can_manage_sales(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para gestionar ventas. Se requiere rol: ADMIN o VENTAS"
            )
        return current_user
    return permission_checker


