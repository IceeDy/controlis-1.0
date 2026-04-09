from __future__ import annotations

from httpx import AsyncClient


async def test_login_returns_jwt_for_valid_credentials(
    client: AsyncClient,
    tenant_context,
) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": tenant_context.email, "password": tenant_context.password},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]


async def test_login_rejects_invalid_credentials(
    client: AsyncClient,
    tenant_context,
) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": tenant_context.email, "password": "senha-incorreta"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Email ou senha inválidos."


async def test_protected_route_requires_bearer_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


async def test_protected_route_returns_authenticated_user(
    client: AsyncClient,
    auth_headers: dict[str, str],
    tenant_context,
) -> None:
    response = await client.get("/api/v1/auth/me", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()["user"]
    assert payload["id"] == tenant_context.user_id
    assert payload["tenant_id"] == tenant_context.tenant_id
    assert payload["email"] == tenant_context.email
    assert payload["is_active"] is True