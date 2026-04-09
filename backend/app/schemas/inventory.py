from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import InventoryMovementType


class InventoryMovementCreate(BaseModel):
    product_id: str
    type: InventoryMovementType
    quantity: int
    note: str | None = Field(default=None, max_length=500)

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        if value == 0:
            raise ValueError("Quantity must not be zero.")
        return value


class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    product_id: str
    type: InventoryMovementType
    quantity: int
    note: str | None
    created_by: str
    created_at: datetime


class InventoryBalanceResponse(BaseModel):
    product_id: str
    product_name: str
    category: str
    stock_quantity: int
    is_active: bool
