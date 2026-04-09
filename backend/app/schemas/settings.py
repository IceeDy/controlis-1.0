from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ThemePreference


class CompanySettingsUpdate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    segment: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=60)
    theme_preference: ThemePreference


class CompanySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    company_name: str
    segment: str
    email: EmailStr
    phone: str
    theme_preference: ThemePreference
    created_at: datetime
    updated_at: datetime
