from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company_settings import CompanySettings
from app.models.enums import ThemePreference
from app.models.tenant import Tenant
from app.schemas.settings import CompanySettingsUpdate


class SettingsService:
    @staticmethod
    def get_or_create(db: Session, tenant: Tenant) -> CompanySettings:
        company_settings = db.scalar(
            select(CompanySettings).where(CompanySettings.tenant_id == tenant.id)
        )
        if company_settings is not None:
            return company_settings

        company_settings = CompanySettings(
            tenant_id=tenant.id,
            company_name=tenant.name,
            segment="Comércio",
            email="contato@empresa.local",
            phone="(00) 00000-0000",
            theme_preference=ThemePreference.LIGHT,
        )
        db.add(company_settings)
        db.commit()
        db.refresh(company_settings)
        return company_settings

    @staticmethod
    def update(
        db: Session,
        tenant: Tenant,
        payload: CompanySettingsUpdate,
    ) -> CompanySettings:
        company_settings = SettingsService.get_or_create(db, tenant)
        for field, value in payload.model_dump().items():
            setattr(company_settings, field, value)
        db.add(company_settings)
        db.commit()
        db.refresh(company_settings)
        return company_settings
