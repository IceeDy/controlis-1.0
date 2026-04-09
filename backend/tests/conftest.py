from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable, Iterator
from dataclasses import dataclass
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal
from app.db.session import engine
from app.main import app
from app.models.company_settings import CompanySettings
from app.models.enums import ThemePreference, UserRole
from app.models.tenant import Tenant
from app.models.user import User


@dataclass(slots=True)
class TestTenantContext:
    tenant_id: str
    tenant_name: str
    user_id: str
    user_name: str
    email: str
    password: str


@pytest.fixture(scope="session", autouse=True)
def prepare_database() -> None:
    inspector = inspect(engine)
    required_tables = {
        "tenants",
        "users",
        "products",
        "company_settings",
        "inventory_movements",
        "sales",
        "sale_items",
    }
    existing_tables = set(inspector.get_table_names())
    if not required_tables.issubset(existing_tables):
        Base.metadata.create_all(bind=engine, checkfirst=True)


@pytest.fixture(scope="session")
def fastapi_app():
    return app


@pytest_asyncio.fixture
async def client(fastapi_app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client


@pytest.fixture
def db_session_factory() -> sessionmaker[Session]:
    return SessionLocal


@pytest.fixture
def tenant_factory() -> Iterator[Callable[..., TestTenantContext]]:
    created_tenant_ids: list[str] = []

    def _create_tenant(
        *,
        name_prefix: str = "Test Tenant",
        password: str = "Teste123!",
        is_active: bool = True,
    ) -> TestTenantContext:
        tenant_suffix = uuid4().hex[:8]
        tenant_id = str(uuid4())
        user_id = str(uuid4())
        tenant_name = f"{name_prefix} {tenant_suffix}"
        user_name = f"Usuário {tenant_suffix}"
        email = f"{tenant_suffix}@controlis-tests.com"

        with SessionLocal.begin() as db:
            tenant = Tenant(id=tenant_id, name=tenant_name)
            db.add(tenant)
            db.flush()

            db.add(
                CompanySettings(
                    tenant_id=tenant_id,
                    company_name=tenant_name,
                    segment="Testes automatizados",
                    email=email,
                    phone="(11) 99999-0000",
                    theme_preference=ThemePreference.LIGHT,
                )
            )
            db.add(
                User(
                    id=user_id,
                    tenant_id=tenant_id,
                    name=user_name,
                    email=email,
                    password_hash=get_password_hash(password),
                    role=UserRole.ADMIN,
                    is_active=is_active,
                )
            )

        created_tenant_ids.append(tenant_id)
        return TestTenantContext(
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            user_id=user_id,
            user_name=user_name,
            email=email,
            password=password,
        )

    yield _create_tenant

    with SessionLocal.begin() as db:
        for tenant_id in reversed(created_tenant_ids):
            tenant = db.scalar(select(Tenant).where(Tenant.id == tenant_id))
            if tenant is not None:
                db.delete(tenant)


@pytest.fixture
def tenant_context(tenant_factory: Callable[..., TestTenantContext]) -> TestTenantContext:
    return tenant_factory()


@pytest.fixture
def another_tenant_context(tenant_factory: Callable[..., TestTenantContext]) -> TestTenantContext:
    return tenant_factory(name_prefix="Outro Tenant")


@pytest.fixture
def auth_helper() -> Callable[[AsyncClient, TestTenantContext], Awaitable[str]]:
    async def _authenticate(client: AsyncClient, tenant_context: TestTenantContext) -> str:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": tenant_context.email, "password": tenant_context.password},
        )
        assert response.status_code == 200, response.text
        return response.json()["access_token"]

    return _authenticate


@pytest_asyncio.fixture
async def auth_token(
    client: AsyncClient,
    tenant_context: TestTenantContext,
    auth_helper: Callable[[AsyncClient, TestTenantContext], Awaitable[str]],
) -> str:
    return await auth_helper(client, tenant_context)


@pytest_asyncio.fixture
async def auth_headers(auth_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {auth_token}"}


@pytest_asyncio.fixture
async def another_auth_headers(
    client: AsyncClient,
    another_tenant_context: TestTenantContext,
    auth_helper: Callable[[AsyncClient, TestTenantContext], Awaitable[str]],
) -> dict[str, str]:
    token = await auth_helper(client, another_tenant_context)
    return {"Authorization": f"Bearer {token}"}