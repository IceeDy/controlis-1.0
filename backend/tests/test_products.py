from __future__ import annotations

from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.models.product import Product


def decimal_from_json(value: str | float | int) -> Decimal:
    return Decimal(str(value))


async def create_product(
    client: AsyncClient,
    auth_headers: dict[str, str],
    **overrides: object,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Café Torrado",
        "category": "Mercearia",
        "sale_price": "18.90",
        "cost_price": "11.50",
        "stock_quantity": 20,
    }
    payload.update(overrides)

    response = await client.post("/api/v1/products", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_product_persists_product_in_database(
    client: AsyncClient,
    auth_headers: dict[str, str],
    tenant_context,
    db_session_factory: sessionmaker[Session],
) -> None:
    response = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "name": "Arroz Integral",
            "category": "Mercearia",
            "sale_price": "32.90",
            "cost_price": "25.10",
            "stock_quantity": 12,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["tenant_id"] == tenant_context.tenant_id
    assert payload["name"] == "Arroz Integral"
    assert decimal_from_json(payload["sale_price"]) == Decimal("32.90")
    assert payload["stock_quantity"] == 12

    with db_session_factory() as db:
        product = db.scalar(select(Product).where(Product.id == payload["id"]))
        assert product is not None
        assert product.tenant_id == tenant_context.tenant_id
        assert product.name == "Arroz Integral"
        assert product.stock_quantity == 12


async def test_list_products_returns_only_current_tenant_products(
    client: AsyncClient,
    auth_headers: dict[str, str],
    another_auth_headers: dict[str, str],
) -> None:
    own_product = await create_product(client, auth_headers, name="Produto Visível")
    await create_product(client, another_auth_headers, name="Produto de Outro Tenant")

    response = await client.get("/api/v1/products", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    returned_ids = {item["id"] for item in payload}
    returned_names = {item["name"] for item in payload}
    assert own_product["id"] in returned_ids
    assert "Produto Visível" in returned_names
    assert "Produto de Outro Tenant" not in returned_names


async def test_update_product_changes_persisted_values(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(client, auth_headers)

    response = await client.put(
        f"/api/v1/products/{product['id']}",
        headers=auth_headers,
        json={
            "name": "Café Torrado Premium",
            "sale_price": "22.50",
            "stock_quantity": 35,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Café Torrado Premium"
    assert decimal_from_json(payload["sale_price"]) == Decimal("22.50")
    assert payload["stock_quantity"] == 35

    with db_session_factory() as db:
        updated_product = db.scalar(select(Product).where(Product.id == product["id"]))
        assert updated_product is not None
        assert updated_product.name == "Café Torrado Premium"
        assert updated_product.stock_quantity == 35


async def test_list_products_supports_name_filter(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    await create_product(client, auth_headers, name="Chocolate Meio Amargo")
    await create_product(client, auth_headers, name="Macarrão Espaguete")

    response = await client.get(
        "/api/v1/products",
        headers=auth_headers,
        params={"search": "choco"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["name"] == "Chocolate Meio Amargo"


async def test_create_product_validates_required_fields(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    response = await client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "category": "Mercearia",
            "sale_price": "19.90",
            "cost_price": "10.00",
            "stock_quantity": 5,
        },
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(error["loc"][-1] == "name" for error in errors)


async def test_product_from_another_tenant_is_inaccessible(
    client: AsyncClient,
    auth_headers: dict[str, str],
    another_auth_headers: dict[str, str],
) -> None:
    foreign_product = await create_product(client, another_auth_headers, name="Produto Protegido")

    response = await client.get(
        f"/api/v1/products/{foreign_product['id']}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Produto não encontrado."