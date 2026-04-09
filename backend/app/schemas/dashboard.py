from decimal import Decimal

from pydantic import BaseModel


class LowStockProductResponse(BaseModel):
    product_id: str
    name: str
    category: str
    stock_quantity: int


class BestSellerResponse(BaseModel):
    product_id: str
    name: str
    total_quantity: int
    total_revenue: Decimal


class DashboardSummaryResponse(BaseModel):
    total_sold_today: Decimal
    total_sold_month: Decimal
    sales_count_month: int
    low_stock_products_count: int
    low_stock_products: list[LowStockProductResponse]
    top_selling_products: list[BestSellerResponse]
