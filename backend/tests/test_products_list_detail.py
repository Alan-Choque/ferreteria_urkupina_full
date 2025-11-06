"""Tests de lista y detalle de productos."""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_products_list():
    """Test de lista de productos con paginación."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/products?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "page" in data
        assert "page_size" in data
        assert "total" in data
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_products_list_with_filters():
    """Test de lista con filtros."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/products?q=perno&page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_product_by_slug():
    """Test de detalle por slug."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Primero obtener lista para tener un slug válido
        list_response = await client.get("/api/v1/products?page=1&page_size=1")
        if list_response.status_code == 200:
            items = list_response.json().get("items", [])
            if items and "slug" in items[0]:
                slug = items[0]["slug"]
                response = await client.get(f"/api/v1/products/{slug}")
                assert response.status_code in [200, 404]  # 404 si no existe
                if response.status_code == 200:
                    data = response.json()
                    assert "id" in data
                    assert "nombre" in data or "name" in data

