"""Tests de concurrencia y duplicados para registro de usuarios."""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_single_user():
    """Test A: 1 POST → 201 Created."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser1",
                "email": "test1@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == "test1@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_without_key():
    """Test B: Mismo email sin Idempotency-Key → 409 Conflict."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Primera request
        response1 = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser2",
                "email": "test2@example.com",
                "password": "password123"
            }
        )
        assert response1.status_code == 201
        
        # Segunda request con mismo email (sin Idempotency-Key)
        response2 = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser2_alt",
                "email": "test2@example.com",
                "password": "password123"
            }
        )
        assert response2.status_code == 409
        data = response2.json()
        assert "error" in data.get("detail", {})
        assert "USER_ALREADY_EXISTS" in str(data.get("detail", {}))


@pytest.mark.asyncio
async def test_register_idempotency():
    """Test C: 5 POST concurrentes con misma Idempotency-Key → 1 éxito, 4 reutilizan."""
    import uuid
    idempotency_key = str(uuid.uuid4())
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Crear 5 requests concurrentes con misma key
        import asyncio
        tasks = [
            client.post(
                "/api/v1/auth/register",
                json={
                    "username": f"testuser3_{i}",
                    "email": f"test3_{i}@example.com",
                    "password": "password123"
                },
                headers={"Idempotency-Key": idempotency_key}
            )
            for i in range(5)
        ]
        
        responses = await asyncio.gather(*tasks)
        
        # Todas deben retornar 201 (misma respuesta)
        status_codes = [r.status_code for r in responses]
        assert all(code == 201 for code in status_codes), f"Expected all 201, got {status_codes}"
        
        # Verificar que todas las respuestas son iguales
        user_ids = [r.json()["user"]["id"] for r in responses]
        assert len(set(user_ids)) == 1, "All responses should have same user ID"
        
        # Verificar que solo se creó 1 usuario en DB
        # (esto requiere acceso a DB en el test, se puede agregar después)


@pytest.mark.asyncio
async def test_register_validation():
    """Test de validaciones: password min 8, username sin espacios."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Password muy corta
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser4",
                "email": "test4@example.com",
                "password": "short"
            }
        )
        assert response.status_code == 422
        
        # Username con espacios
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "test user 4",
                "email": "test4b@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 422

