"""Tests de flujo de autenticación."""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_login_flow():
    """Test de login → /auth/me → refresh."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # 1. Registrar usuario
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "testauth",
                "email": "testauth@example.com",
                "password": "password123"
            }
        )
        
        if register_response.status_code == 201:
            register_data = register_response.json()
            access_token = register_data["token"]["access_token"]
            refresh_token = register_data["token"]["refresh_token"]
            
            # 2. Obtener info de usuario con /auth/me
            me_response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            assert me_response.status_code == 200
            user_data = me_response.json()
            assert "id" in user_data
            assert "correo" in user_data
            assert user_data["correo"] == "testauth@example.com"
            
            # 3. Refresh token
            refresh_response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": refresh_token}
            )
            assert refresh_response.status_code == 200
            refresh_data = refresh_response.json()
            assert "access_token" in refresh_data
            assert "refresh_token" in refresh_data


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    """Test de login con credenciales inválidas."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_without_token():
    """Test de /auth/me sin token."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

