from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.models.enums import InventoryMovementType
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem


def decimal_from_json(value: str | float | int | Decimal) -> Decimal:
    return Decimal(str(value))


async def create_product(client: AsyncClient, auth_headers: dict[str, str], **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Produto Base",
        "category": "Categoria",
        "sale_price": "10.00",
        "cost_price": "6.00",
        "stock_quantity": 20,
    }
    payload.update(overrides)
    response = await client.post("/api/v1/products", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_sale_with_single_item_validates_total_and_stock_lowdown(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(
        client,
        auth_headers,
        name="Caderno",
        category="Papelaria",
        sale_price="15.90",
        cost_price="9.30",
        stock_quantity=9,
    )

    response = await client.post(
        "/api/v1/sales",
        headers=auth_headers,
        json={
            "sale_date": datetime.now(UTC).isoformat(),
            "items": [{"product_id": product["id"], "quantity": 2}],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert len(payload["items"]) == 1
    assert decimal_from_json(payload["items"][0]["subtotal"]) == Decimal("31.80")
    assert decimal_from_json(payload["total_amount"]) == Decimal("31.80")

    with db_session_factory() as db:
        sale = db.scalar(select(Sale).where(Sale.id == payload["id"]))
        sale_item = db.scalar(select(SaleItem).where(SaleItem.sale_id == payload["id"]))
        product_after_sale = db.scalar(select(Product).where(Product.id == product["id"]))
        sale_movement = db.scalar(
            select(InventoryMovement).where(
                InventoryMovement.product_id == product["id"],
                InventoryMovement.type == InventoryMovementType.SALE,
            )
        )

        assert sale is not None
        assert decimal_from_json(sale.total_amount) == Decimal("31.80")
        assert sale_item is not None
        assert sale_item.quantity == 2
        assert decimal_from_json(sale_item.subtotal) == Decimal("31.80")
        assert product_after_sale is not None
        assert product_after_sale.stock_quantity == 7
        assert sale_movement is not None
        assert sale_movement.quantity == -2


async def test_create_sale_with_multiple_items_calculates_subtotals_and_total(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    notebook = await create_product(
        client,
        auth_headers,
        name="Notebook",
        category="Eletrônicos",
        sale_price="2500.00",
        cost_price="2100.00",
        stock_quantity=5,
    )
    mouse = await create_product(
        client,
        auth_headers,
        name="Mouse",
        category="Eletrônicos",
        sale_price="120.00",
        cost_price="70.00",
        stock_quantity=8,
    )

    response = await client.post(
        "/api/v1/sales",
        headers=auth_headers,
        json={
            "sale_date": datetime.now(UTC).isoformat(),
            "items": [
                {"product_id": notebook["id"], "quantity": 1},
                {"product_id": mouse["id"], "quantity": 3},
            ],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    subtotals_by_product = {
        item["product_id"]: decimal_from_json(item["subtotal"]) for item in payload["items"]
    }
    assert subtotals_by_product[notebook["id"]] == Decimal("2500.00")
    assert subtotals_by_product[mouse["id"]] == Decimal("360.00")
    assert decimal_from_json(payload["total_amount"]) == Decimal("2860.00")

    with db_session_factory() as db:
        notebook_after_sale = db.scalar(select(Product).where(Product.id == notebook["id"]))
        mouse_after_sale = db.scalar(select(Product).where(Product.id == mouse["id"]))
        movement_quantities = list(
            db.scalars(
                select(InventoryMovement.quantity).where(
                    InventoryMovement.type == InventoryMovementType.SALE,
                    InventoryMovement.product_id.in_([notebook["id"], mouse["id"]]),
                )
            ).all()
        )

        assert notebook_after_sale is not None
        assert notebook_after_sale.stock_quantity == 4
        assert mouse_after_sale is not None
        assert mouse_after_sale.stock_quantity == 5
        assert sorted(movement_quantities) == [-3, -1]


async def test_create_sale_rejects_when_stock_is_insufficient(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session_factory: sessionmaker[Session],
) -> None:
    product = await create_product(
        client,
        auth_headers,
        name="Impressora",
        category="Eletrônicos",
        sale_price="799.00",
        cost_price="600.00",
        stock_quantity=1,
    )

    response = await client.post(
        "/api/v1/sales",
        headers=auth_headers,
        json={
            "sale_date": datetime.now(UTC).isoformat(),
            "items": [{"product_id": product["id"], "quantity": 2}],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Estoque insuficiente para o produto 'Impressora'."

    with db_session_factory() as db:
        sale = db.scalar(select(Sale).where(Sale.tenant_id == product["tenant_id"]))
        refreshed_product = db.scalar(select(Product).where(Product.id == product["id"]))
        movement = db.scalar(
            select(InventoryMovement).where(
                InventoryMovement.product_id == product["id"],
                InventoryMovement.type == InventoryMovementType.SALE,
            )
        )

        assert sale is None
        assert refreshed_product is not None
        assert refreshed_product.stock_quantity == 1
        assert movement is None