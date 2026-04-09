from fastapi import APIRouter

from app.dependencies.auth import CurrentTenant, DbSession
from app.schemas.settings import CompanySettingsResponse, CompanySettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter()


@router.get("/company", response_model=CompanySettingsResponse)
def get_company_settings(db: DbSession, tenant: CurrentTenant) -> CompanySettingsResponse:
    settings = SettingsService.get_or_create(db, tenant)
    return CompanySettingsResponse.model_validate(settings)


@router.put("/company", response_model=CompanySettingsResponse)
def update_company_settings(
    payload: CompanySettingsUpdate,
    db: DbSession,
    tenant: CurrentTenant,
) -> CompanySettingsResponse:
    settings = SettingsService.update(db, tenant, payload)
    return CompanySettingsResponse.model_validate(settings)
