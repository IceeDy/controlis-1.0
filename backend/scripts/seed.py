from __future__ import annotations

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.company_settings import CompanySettings
from app.models.enums import ThemePreference, UserRole
from app.models.tenant import Tenant
from app.models.user import User

DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111"
DEFAULT_COMPANY_SETTINGS_ID = "33333333-3333-3333-3333-333333333333"
DEFAULT_ADMIN_ID = "22222222-2222-2222-2222-222222222222"
DEFAULT_TENANT_NAME = "Controlis Comércio Principal"
DEFAULT_COMPANY_EMAIL = "admin@controlis.com"
DEFAULT_ADMIN_EMAIL = "admin@controlis.com"
DEFAULT_ADMIN_PASSWORD = "admin123"


def seed() -> None:
    with SessionLocal.begin() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.id == DEFAULT_TENANT_ID))
        if tenant is None:
            tenant = Tenant(id=DEFAULT_TENANT_ID, name=DEFAULT_TENANT_NAME)
            db.add(tenant)
            db.flush()

        company_settings = db.scalar(
            select(CompanySettings).where(CompanySettings.tenant_id == tenant.id)
        )
        if company_settings is None:
            company_settings = CompanySettings(
                id=DEFAULT_COMPANY_SETTINGS_ID,
                tenant_id=tenant.id,
                company_name=DEFAULT_TENANT_NAME,
                segment="Pequeno comércio",
                email=DEFAULT_COMPANY_EMAIL,
                phone="(11) 4000-1000",
                theme_preference=ThemePreference.LIGHT,
            )
            db.add(company_settings)
        else:
            company_settings.company_name = DEFAULT_TENANT_NAME
            company_settings.segment = "Pequeno comércio"
            company_settings.email = DEFAULT_COMPANY_EMAIL
            company_settings.phone = "(11) 4000-1000"
            company_settings.theme_preference = ThemePreference.LIGHT

        admin_user = db.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
        if admin_user is not None and admin_user.tenant_id != tenant.id:
            raise RuntimeError(
                "Já existe um usuário admin@controlis.com vinculado a outro tenant. "
                "O seed não pode misturar dados entre empresas."
            )

        password_hash = get_password_hash(DEFAULT_ADMIN_PASSWORD)
        if admin_user is None:
            admin_user = User(
                id=DEFAULT_ADMIN_ID,
                tenant_id=tenant.id,
                name="Administrador Controlis",
                email=DEFAULT_ADMIN_EMAIL,
                password_hash=password_hash,
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
        else:
            admin_user.name = "Administrador Controlis"
            admin_user.password_hash = password_hash
            admin_user.role = UserRole.ADMIN
            admin_user.is_active = True

    print("Seed inicial concluído com sucesso.")
    print(f"Tenant: {DEFAULT_TENANT_NAME} ({DEFAULT_TENANT_ID})")
    print(f"Admin: {DEFAULT_ADMIN_EMAIL}")


def main() -> None:
    seed()


if __name__ == "__main__":
    main()
