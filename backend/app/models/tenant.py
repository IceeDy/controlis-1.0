from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Tenant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="tenant", cascade="all, delete-orphan")
    inventory_movements = relationship(
        "InventoryMovement",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    sales = relationship("Sale", back_populates="tenant", cascade="all, delete-orphan")
    company_settings = relationship(
        "CompanySettings",
        back_populates="tenant",
        uselist=False,
        cascade="all, delete-orphan",
    )
