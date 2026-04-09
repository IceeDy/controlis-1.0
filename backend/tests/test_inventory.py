from __future__ import annotations

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.models.enums import InventoryMovementType
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product


async def create_product(client: AsyncClient, auth_headers: dict[str, str], **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Detergente",
        "category": "Limpeza",
        "sale_price": "7.90",
        "cost_price": "4.20",
        "stock_quantity": 10,
    }
    payload.update(overrides)
    response = await client.post("/api/v1/products", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


async def test_inventory_entry_increases_stock_and_records_movement(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(client, auth_headers)

    response = await client.post(
        "/api/v1/inventory/movements",
        headers=auth_headers,
        json={
            "product_id": product["id"],
            "type": "entry",
            "quantity": 15,
            "note": "Reposição do fornecedor",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["type"] == "entry"
    assert payload["quantity"] == 15

    with db_session_factory() as db:
        refreshed_product = db.scalar(select(Product).where(Product.id == product["id"]))
        movement = db.scalar(select(InventoryMovement).where(InventoryMovement.id == payload["id"]))
        assert refreshed_product is not None
        assert refreshed_product.stock_quantity == 25
        assert movement is not None
        assert movement.type == InventoryMovementType.ENTRY
        assert movement.quantity == 15


async def test_inventory_adjustment_updates_stock_balance(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(client, auth_headers, stock_quantity=18)

    response = await client.post(
        "/api/v1/inventory/movements",
        headers=auth_headers,
        json={
            "product_id": product["id"],
            "type": "adjustment",
            "quantity": -3,
            "note": "Ajuste por avaria",
        },
    )

    assert response.status_code == 201

    balances_response = await client.get("/api/v1/inventory/balances", headers=auth_headers)
    assert balances_response.status_code == 200
    balance = next(item for item in balances_response.json() if item["product_id"] == product["id"])
    assert balance["stock_quantity"] == 15

    with db_session_factory() as db:
        refreshed_product = db.scalar(select(Product).where(Product.id == product["id"]))
        assert refreshed_product is not None
        assert refreshed_product.stock_quantity == 15


async def test_inventory_history_returns_created_movements_in_order(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    product = await create_product(client, auth_headers, stock_quantity=30)

    first_response = await client.post(
        "/api/v1/inventory/movements",
        headers=auth_headers,
        json={
            "product_id": product["id"],
            "type": "entry",
            "quantity": 5,
            "note": "Entrada 1",
        },
    )
    second_response = await client.post(
        "/api/v1/inventory/movements",
        headers=auth_headers,
        json={
            "product_id": product["id"],
            "type": "adjustment",
            "quantity": -2,
            "note": "Ajuste 2",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    history_response = await client.get("/api/v1/inventory/movements", headers=auth_headers)

    assert history_response.status_code == 200
    history = [item for item in history_response.json() if item["product_id"] == product["id"]]
    assert len(history) >= 2
    assert history[0]["note"] == "Ajuste 2"
    assert history[0]["quantity"] == -2
    assert history[1]["note"] == "Entrada 1"
    assert history[1]["quantity"] == 5


async def test_inventory_rejects_movement_that_would_make_stock_negative(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(client, auth_headers, stock_quantity=4)

    response = await client.post(
        "/api/v1/inventory/movements",
        headers=auth_headers,
        json={
            "product_id": product["id"],
            "type": "adjustment",
            "quantity": -7,
            "note": "Erro de ajuste",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Movimentação deixaria o estoque negativo."

    with db_session_factory() as db:
        refreshed_product = db.scalar(select(Product).where(Product.id == product["id"]))
        movements = list(
            db.scalars(select(InventoryMovement).where(InventoryMovement.product_id == product["id"])).all()
        )
        assert refreshed_product is not None
        assert refreshed_product.stock_quantity == 4
        assert movements == []