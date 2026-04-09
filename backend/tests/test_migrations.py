from __future__ import annotations

import os
import shutil
import subprocess
from collections.abc import Iterator
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import sys
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, inspect, text

from app.db.base import Base
from scripts.migrate import APP_TABLES, INITIAL_REVISION
from scripts.seed import DEFAULT_ADMIN_EMAIL, DEFAULT_TENANT_ID

BACKEND_DIR = Path(__file__).resolve().parents[1]
COMPOSE_BASE_COMMAND = ["docker", "compose"]
BACKEND_SERVICE = "backend"
POSTGRES_SERVICE = "postgres"
POSTGRES_USER = os.getenv("CONTROLIS_TEST_POSTGRES_USER", "controlis")
POSTGRES_PASSWORD = os.getenv("CONTROLIS_TEST_POSTGRES_PASSWORD", "controlis")
POSTGRES_HOST = os.getenv("CONTROLIS_TEST_POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("CONTROLIS_TEST_POSTGRES_PORT", "5432"))
POSTGRES_INTERNAL_HOST = os.getenv("CONTROLIS_TEST_BACKEND_DB_HOST", "postgres")
MAINTENANCE_DATABASE = os.getenv("CONTROLIS_TEST_POSTGRES_MAINTENANCE_DB", "postgres")
COMMAND_MODE_ENV = "CONTROLIS_TEST_COMMAND_MODE"
REQUIRED_TABLES = {
    "tenants",
    "users",
    "products",
    "inventory_movements",
    "sales",
    "sale_items",
    "company_settings",
}


@dataclass(slots=True)
class IsolatedDatabase:
    name: str

    @property
    def host_url(self) -> str:
        return (
            "postgresql+psycopg://"
            f"{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{self.name}"
        )


def create_admin_engine():
    return create_engine(
        (
            "postgresql+psycopg://"
            f"{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{MAINTENANCE_DATABASE}"
        ),
        future=True,
        isolation_level="AUTOCOMMIT",
    )


def run_subprocess(
    command: list[str],
    *,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
        check=False,
    )
    if result.returncode != 0:
        pytest.fail(
            "Comando falhou.\n"
            f"CMD: {' '.join(command)}\n"
            f"EXIT CODE: {result.returncode}\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )
    return result


def run_postgres_sql(sql: str, *, database: str = MAINTENANCE_DATABASE) -> subprocess.CompletedProcess[str]:
    engine = create_engine(
        (
            "postgresql+psycopg://"
            f"{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{database}"
        ),
        future=True,
        isolation_level="AUTOCOMMIT",
    )
    try:
        with engine.connect() as connection:
            connection.execute(text(sql))
    finally:
        engine.dispose()
    return subprocess.CompletedProcess(args=["sqlalchemy", sql], returncode=0, stdout="", stderr="")


def get_local_command(executable: str) -> list[str]:
    executable_path = shutil.which(executable)
    if executable_path is not None:
        return [executable_path]

    module_name = {
        "controlis-migrate": "scripts.migrate",
        "controlis-seed": "scripts.seed",
    }[executable]
    return [sys.executable, "-m", module_name]


def is_compose_stack_ready() -> bool:
    if shutil.which("docker") is None:
        return False

    result = subprocess.run(
        [*COMPOSE_BASE_COMMAND, "ps", "--services", "--status", "running"],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if result.returncode != 0:
        return False

    running_services = {line.strip() for line in result.stdout.splitlines() if line.strip()}
    return {BACKEND_SERVICE, POSTGRES_SERVICE}.issubset(running_services)


@lru_cache
def get_command_mode() -> str:
    requested_mode = os.getenv(COMMAND_MODE_ENV, "auto").strip().lower()
    if requested_mode not in {"auto", "compose", "local"}:
        raise RuntimeError(
            f"Valor inválido para {COMMAND_MODE_ENV}: {requested_mode!r}. Use auto, compose ou local."
        )

    compose_ready = is_compose_stack_ready()
    if requested_mode == "compose":
        if not compose_ready:
            raise RuntimeError(
                "Os testes de migration foram forçados para modo compose, mas os serviços Docker do backend não estão ativos."
            )
        return "compose"

    if requested_mode == "local":
        return "local"

    return "compose" if compose_ready else "local"


def get_backend_database_url(database: IsolatedDatabase) -> str:
    if get_command_mode() == "compose":
        return (
            "postgresql+psycopg://"
            f"{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_INTERNAL_HOST}:{POSTGRES_PORT}/{database.name}"
        )

    return database.host_url


def run_backend_command(database: IsolatedDatabase, executable: str) -> subprocess.CompletedProcess[str]:
    database_url = get_backend_database_url(database)
    if get_command_mode() == "compose":
        return run_subprocess(
            [
                *COMPOSE_BASE_COMMAND,
                "exec",
                "-T",
                "-e",
                f"DATABASE_URL={database_url}",
                BACKEND_SERVICE,
                executable,
            ]
        )

    env = os.environ.copy()
    env["DATABASE_URL"] = database_url
    return run_subprocess(get_local_command(executable), env=env)


def reset_database(database_name: str) -> None:
    admin_engine = create_admin_engine()
    try:
        with admin_engine.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{database_name}" WITH (FORCE)'))
            connection.execute(text(f'CREATE DATABASE "{database_name}"'))
    finally:
        admin_engine.dispose()


def drop_database(database_name: str) -> None:
    admin_engine = create_admin_engine()
    try:
        with admin_engine.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{database_name}" WITH (FORCE)'))
    finally:
        admin_engine.dispose()


def create_engine_for(database: IsolatedDatabase):
    return create_engine(database.host_url, future=True)


def get_table_names(database: IsolatedDatabase) -> set[str]:
    engine = create_engine_for(database)
    try:
        return set(inspect(engine).get_table_names())
    finally:
        engine.dispose()


def get_alembic_version(database: IsolatedDatabase) -> str | None:
    engine = create_engine_for(database)
    try:
        inspector = inspect(engine)
        if not inspector.has_table("alembic_version"):
            return None

        with engine.connect() as connection:
            return connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
    finally:
        engine.dispose()


def insert_tenant(database: IsolatedDatabase, tenant_id: str, tenant_name: str) -> None:
    engine = create_engine_for(database)
    try:
        with engine.begin() as connection:
            connection.execute(
                text("INSERT INTO tenants (id, name) VALUES (:tenant_id, :tenant_name)"),
                {"tenant_id": tenant_id, "tenant_name": tenant_name},
            )
    finally:
        engine.dispose()


def tenant_exists(database: IsolatedDatabase, tenant_id: str) -> bool:
    engine = create_engine_for(database)
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT 1 FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": tenant_id},
            ).scalar_one_or_none()
            return result == 1
    finally:
        engine.dispose()


def get_seed_snapshot(database: IsolatedDatabase) -> tuple[int, int, int]:
    engine = create_engine_for(database)
    try:
        with engine.connect() as connection:
            tenant_count = connection.execute(text("SELECT COUNT(*) FROM tenants")).scalar_one()
            user_count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
            settings_count = connection.execute(text("SELECT COUNT(*) FROM company_settings")).scalar_one()
            return tenant_count, user_count, settings_count
    finally:
        engine.dispose()


def assert_stdout_contains(stdout: str, *fragments: str) -> None:
    for fragment in fragments:
        assert fragment in stdout, f"Trecho esperado não encontrado no stdout: {fragment!r}\nSTDOUT:\n{stdout}"


def assert_required_schema(database: IsolatedDatabase) -> None:
    table_names = get_table_names(database)
    assert REQUIRED_TABLES.issubset(table_names)
    assert APP_TABLES.issubset(table_names)
    assert "alembic_version" in table_names
    assert get_alembic_version(database) == INITIAL_REVISION


@pytest.fixture(scope="session", autouse=True)
def ensure_migration_test_runtime() -> None:
    command_mode = get_command_mode()
    executable = shutil.which("controlis-migrate")

    if command_mode == "compose":
        return

    if executable is None and not Path(sys.executable).exists():
        pytest.fail(
            "Os testes de migration em modo local não encontraram um runtime Python válido para executar scripts reais."
        )


@pytest.fixture
def isolated_database() -> Iterator[IsolatedDatabase]:
    database = IsolatedDatabase(name=f"controlis_test_{uuid4().hex}")
    reset_database(database.name)
    yield database
    drop_database(database.name)


def test_migrate_creates_schema_on_empty_database(isolated_database: IsolatedDatabase) -> None:
    result = run_backend_command(isolated_database, "controlis-migrate")

    assert result.returncode == 0
    assert_stdout_contains(result.stdout, "Migration conclu", INITIAL_REVISION)
    assert_required_schema(isolated_database)


def test_migrate_is_idempotent_on_already_versioned_database(isolated_database: IsolatedDatabase) -> None:
    run_backend_command(isolated_database, "controlis-migrate")
    sentinel_tenant_id = str(uuid4())
    insert_tenant(isolated_database, sentinel_tenant_id, "Tenant Idempotente")

    result = run_backend_command(isolated_database, "controlis-migrate")

    assert result.returncode == 0
    assert_stdout_contains(result.stdout, "Banco j", INITIAL_REVISION, "Nenhuma migration pendente")
    assert tenant_exists(isolated_database, sentinel_tenant_id)
    assert_required_schema(isolated_database)


def test_migrate_reconciles_schema_without_alembic_version(isolated_database: IsolatedDatabase) -> None:
    engine = create_engine_for(isolated_database)
    sentinel_tenant_id = str(uuid4())
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        with engine.begin() as connection:
            connection.execute(
                text("INSERT INTO tenants (id, name) VALUES (:tenant_id, :tenant_name)"),
                {"tenant_id": sentinel_tenant_id, "tenant_name": "Tenant Sem Alembic"},
            )
    finally:
        engine.dispose()

    assert get_alembic_version(isolated_database) is None

    result = run_backend_command(isolated_database, "controlis-migrate")

    assert result.returncode == 0
    assert_stdout_contains(result.stdout, "Schema operacional", "sem alembic_version", INITIAL_REVISION)
    assert tenant_exists(isolated_database, sentinel_tenant_id)
    assert_required_schema(isolated_database)


def test_reset_then_migrate_and_seed_restores_database(isolated_database: IsolatedDatabase) -> None:
    run_backend_command(isolated_database, "controlis-migrate")
    run_backend_command(isolated_database, "controlis-seed")

    reset_database(isolated_database.name)

    migrate_result = run_backend_command(isolated_database, "controlis-migrate")
    seed_result = run_backend_command(isolated_database, "controlis-seed")

    assert migrate_result.returncode == 0
    assert seed_result.returncode == 0
    assert_required_schema(isolated_database)

    tenant_count, user_count, settings_count = get_seed_snapshot(isolated_database)
    assert tenant_count == 1
    assert user_count == 1
    assert settings_count == 1

    engine = create_engine_for(isolated_database)
    try:
        with engine.connect() as connection:
            seeded_tenant = connection.execute(
                text("SELECT id FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": DEFAULT_TENANT_ID},
            ).scalar_one_or_none()
            seeded_user = connection.execute(
                text("SELECT email FROM users WHERE email = :email"),
                {"email": DEFAULT_ADMIN_EMAIL},
            ).scalar_one_or_none()
    finally:
        engine.dispose()

    assert str(seeded_tenant) == DEFAULT_TENANT_ID
    assert seeded_user == DEFAULT_ADMIN_EMAIL