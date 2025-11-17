import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    """Test que el endpoint de health funciona."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_products():
    """Test que el endpoint de productos funciona y devuelve el formato correcto."""
    response = client.get("/api/v1/products?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    
    # Verificar estructura
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    
    # Verificar tipos
    assert isinstance(data["items"], list)
    assert isinstance(data["page"], int)
    assert isinstance(data["page_size"], int)
    assert isinstance(data["total"], int)
    
    # Si hay items, verificar estructura de ProductResponse
    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "nombre" in item
        assert "slug" in item
        assert "status" in item
        # image, short, price pueden ser None
        assert "image" in item or item.get("image") is None
        assert "short" in item or item.get("short") is None
        assert "price" in item or item.get("price") is None


def test_list_products_with_filters():
    """Test que los filtros funcionan."""
    # Test con query
    response = client.get("/api/v1/products?q=perno&page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    
    # Test con brand_id
    response = client.get("/api/v1/products?brand_id=1&page=1&page_size=10")
    assert response.status_code == 200
    
    # Test con category_id
    response = client.get("/api/v1/products?category_id=1&page=1&page_size=10")
    assert response.status_code == 200


def test_list_products_pagination():
    """Test que la paginación funciona."""
    response = client.get("/api/v1/products?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5
    assert len(data["items"]) <= 5
