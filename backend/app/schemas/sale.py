from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SaleCreateItem(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    sale_date: datetime
    items: list[SaleCreateItem] = Field(min_length=1)


class SaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sale_id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class SaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    total_amount: Decimal
    sale_date: datetime
    created_by: str
    created_at: datetime


class SaleDetailResponse(SaleResponse):
    items: list[SaleItemResponse]
