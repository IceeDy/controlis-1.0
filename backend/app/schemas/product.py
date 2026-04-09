from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=120)
    sale_price: Decimal = Field(gt=0)
    cost_price: Decimal = Field(gt=0)


class ProductCreate(ProductBase):
    stock_quantity: int = Field(ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    category: str | None = Field(default=None, min_length=2, max_length=120)
    sale_price: Decimal | None = Field(default=None, gt=0)
    cost_price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    name: str
    category: str
    sale_price: Decimal
    cost_price: Decimal
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
