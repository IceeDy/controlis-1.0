from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from httpx import AsyncClient


def decimal_from_json(value: str | float | int) -> Decimal:
    return Decimal(str(value))


async def create_product(client: AsyncClient, auth_headers: dict[str, str], **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Produto Dashboard",
        "category": "Resumo",
        "sale_price": "20.00",
        "cost_price": "12.00",
        "stock_quantity": 12,
    }
    payload.update(overrides)
    response = await client.post("/api/v1/products", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_sale(
    client: AsyncClient,
    auth_headers: dict[str, str],
    sale_date: datetime,
    items: list[dict[str, object]],
) -> dict[str, object]:
    response = await client.post(
        "/api/v1/sales",
        headers=auth_headers,
        json={"sale_date": sale_date.isoformat(), "items": items},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_dashboard_summary_returns_totals_counts_and_low_stock_products(
    client: AsyncClient,
    auth_headers: dict[str, str],
    another_auth_headers: dict[str, str],
) -> None:
    now = datetime.now(UTC)

    low_stock_product = await create_product(
        client,
        auth_headers,
        name="Caneta Azul",
        category="Papelaria",
        sale_price="3.50",
        cost_price="1.20",
        stock_quantity=6,
    )
    monthly_product = await create_product(
        client,
        auth_headers,
        name="Agenda",
        category="Papelaria",
        sale_price="25.00",
        cost_price="14.00",
        stock_quantity=20,
    )
    ignored_other_tenant = await create_product(
        client,
        another_auth_headers,
        name="Produto Externo",
        category="Outro",
        sale_price="99.00",
        cost_price="50.00",
        stock_quantity=50,
    )

    await create_sale(
        client,
        auth_headers,
        now,
        [{"product_id": low_stock_product["id"], "quantity": 2}],
    )
    await create_sale(
        client,
        auth_headers,
        now - timedelta(days=2),
        [{"product_id": monthly_product["id"], "quantity": 3}],
    )
    await create_sale(
        client,
        auth_headers,
        now - timedelta(days=35),
        [{"product_id": monthly_product["id"], "quantity": 1}],
    )
    await create_sale(
        client,
        another_auth_headers,
        now,
        [{"product_id": ignored_other_tenant["id"], "quantity": 1}],
    )

    response = await client.get("/api/v1/dashboard/summary", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert decimal_from_json(payload["total_sold_today"]) == Decimal("7.00")
    assert decimal_from_json(payload["total_sold_month"]) == Decimal("82.00")
    assert payload["sales_count_month"] == 2
    assert payload["low_stock_products_count"] >= 1
    low_stock_names = {item["name"] for item in payload["low_stock_products"]}
    assert "Caneta Azul" in low_stock_names