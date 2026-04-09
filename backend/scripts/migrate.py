from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.session import engine

INITIAL_REVISION = "20260406_0001"
APP_TABLES = {
    "company_settings",
    "inventory_movements",
    "products",
    "sale_items",
    "sales",
    "tenants",
    "users",
}


def build_alembic_config() -> Config:
    backend_dir = Path(__file__).resolve().parents[1]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", str(get_settings().database_url))
    return config


def get_current_revision() -> str | None:
    inspector = inspect(engine)
    if not inspector.has_table("alembic_version"):
        return None

    with engine.connect() as connection:
        return connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()


def get_existing_tables() -> set[str]:
    return set(inspect(engine).get_table_names())


def migrate() -> None:
    current_revision = get_current_revision()

    if current_revision == INITIAL_REVISION:
        print(f"Banco já está na revisão {INITIAL_REVISION}. Nenhuma migration pendente.")
        return

    existing_tables = get_existing_tables()
    has_app_tables = bool(APP_TABLES & existing_tables)
    has_full_initial_schema = APP_TABLES.issubset(existing_tables)

    if current_revision is None and has_full_initial_schema:
        print(
            "Schema operacional já existe sem alembic_version. "
            "Executando upgrade idempotente para reconciliar e registrar a revisão inicial."
        )
    elif current_revision is None and has_app_tables:
        print(
            "Schema parcial detectado sem alembic_version. "
            "Executando upgrade idempotente para criar o que faltar e registrar a revisão inicial."
        )
    else:
        print("Aplicando migrations pendentes com Alembic.")

    command.upgrade(build_alembic_config(), "head")

    final_revision = get_current_revision()
    if final_revision != INITIAL_REVISION:
        raise RuntimeError(
            "Falha ao registrar a revisão final do Alembic. "
            f"Revisão atual encontrada: {final_revision!r}."
        )

    print(f"Migration concluída com sucesso. Revisão atual: {final_revision}.")


def main() -> None:
    migrate()


if __name__ == "__main__":
    main()