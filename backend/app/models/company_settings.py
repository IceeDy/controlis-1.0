from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampUpdateMixin, UUIDPrimaryKeyMixin
from app.models.enums import ThemePreference, enum_values


class CompanySettings(UUIDPrimaryKeyMixin, TimestampUpdateMixin, Base):
    __tablename__ = "company_settings"

    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    segment: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(60), nullable=False)
    theme_preference: Mapped[ThemePreference] = mapped_column(
        Enum(ThemePreference, name="theme_preference", values_callable=enum_values),
        nullable=False,
        default=ThemePreference.LIGHT,
    )

    tenant = relationship("Tenant", back_populates="company_settings")
