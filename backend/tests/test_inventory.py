import pytest
from types import SimpleNamespace
from httpx import AsyncClient

from app.main import app


@pytest.fixture(autouse=True)
def override_admin_role():
    """
    Muchos endpoints de inventario requieren rol ADMIN.
    Esta fixtura reemplaza temporalmente los checkers de rol por un usuario fake.
    """

    overrides: dict = {}

    def fake_admin():
        return SimpleNamespace(id=1, roles=["ADMIN"])

    for route in app.routes:
        dependant = getattr(route, "dependant", None)
        if not dependant:
            continue
        for dependency in dependant.dependencies:
            call = getattr(dependency, "call", None)
            if call and getattr(call, "__name__", "").startswith("role_checker"):
                overrides[call] = fake_admin
                app.dependency_overrides[call] = fake_admin

    yield

    for call in overrides:
        app.dependency_overrides.pop(call, None)


@pytest.mark.asyncio
async def test_inventory_stock_summary_and_meta():
    """El listado de inventario y metadatos responde correctamente."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        stock_response = await client.get("/api/v1/inventory/stock")
        assert stock_response.status_code == 200
        stock_items = stock_response.json()
        assert isinstance(stock_items, list)

        warehouses_response = await client.get("/api/v1/inventory/warehouses")
        assert warehouses_response.status_code == 200
        warehouses = warehouses_response.json()
        assert isinstance(warehouses, list)
        if warehouses:
            assert "id" in warehouses[0]
            assert "nombre" in warehouses[0]

        if stock_items:
            search_term = stock_items[0]["producto_nombre"][:3] or "prod"
            search_response = await client.get(f"/api/v1/inventory/variants/search?q={search_term}")
            assert search_response.status_code == 200
            assert isinstance(search_response.json(), list)


@pytest.mark.asyncio
async def test_inventory_entry_and_adjustment_flow():
    """
    Registrar un ingreso incrementa el stock y un ajuste posterior puede devolverlo al valor original.
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        stock_response = await client.get("/api/v1/inventory/stock")
        assert stock_response.status_code == 200
        stocks = stock_response.json()
        assert stocks, "Se requiere al menos un registro de inventario para la prueba."

        sample = stocks[0]
        variante_id = sample["variante_id"]
        almacen_id = sample["almacen_id"]
        base_quantity = float(sample["cantidad_disponible"])
        entry_amount = 1.0

        entry_payload = {
            "almacen_id": almacen_id,
            "descripcion": "Ingreso de prueba (pytest)",
            "items": [
                {
                    "variante_id": variante_id,
                    "cantidad": entry_amount,
                    "costo_unitario": 10.0,
                }
            ],
        }

        entry_response = await client.post("/api/v1/inventory/entries", json=entry_payload)
        assert entry_response.status_code == 201
        entry_data = entry_response.json()
        updated_entry = next(
            (
                item
                for item in entry_data["updated_stock"]
                if item["variante_id"] == variante_id and item["almacen_id"] == almacen_id
            ),
            None,
        )
        assert updated_entry is not None
        assert pytest.approx(updated_entry["cantidad_disponible"], rel=1e-3) == base_quantity + entry_amount

        adjust_payload = {
            "descripcion": "Reversión de ingreso (pytest)",
            "items": [
                {
                    "variante_id": variante_id,
                    "almacen_id": almacen_id,
                    "cantidad_nueva": base_quantity,
                }
            ],
        }
        adjust_response = await client.post("/api/v1/inventory/adjustments", json=adjust_payload)
        assert adjust_response.status_code == 201
        adjust_data = adjust_response.json()
        adjusted_entry = next(
            (
                item
                for item in adjust_data["updated_stock"]
                if item["variante_id"] == variante_id and item["almacen_id"] == almacen_id
            ),
            None,
        )
        assert adjusted_entry is not None
        assert pytest.approx(adjusted_entry["cantidad_disponible"], rel=1e-3) == base_quantity

