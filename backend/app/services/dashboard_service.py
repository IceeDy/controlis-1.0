from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.dashboard import (
    BestSellerResponse,
    DashboardSummaryResponse,
    LowStockProductResponse,
)

settings = get_settings()


class DashboardService:
    @staticmethod
    def get_summary(db: Session, tenant_id: str) -> DashboardSummaryResponse:
        now = datetime.now(UTC)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_sold_today = db.scalar(
            select(func.coalesce(func.sum(Sale.total_amount), 0)).where(
                Sale.tenant_id == tenant_id,
                Sale.sale_date >= day_start,
            )
        )
        total_sold_month = db.scalar(
            select(func.coalesce(func.sum(Sale.total_amount), 0)).where(
                Sale.tenant_id == tenant_id,
                Sale.sale_date >= month_start,
            )
        )
        sales_count_month = db.scalar(
            select(func.count(Sale.id)).where(
                Sale.tenant_id == tenant_id,
                Sale.sale_date >= month_start,
            )
        )

        low_stock_products = list(
            db.execute(
                select(
                    Product.id,
                    Product.name,
                    Product.category,
                    Product.stock_quantity,
                )
                .where(
                    Product.tenant_id == tenant_id,
                    Product.is_active.is_(True),
                    Product.stock_quantity <= settings.low_stock_threshold,
                )
                .order_by(Product.stock_quantity.asc(), Product.name.asc())
                .limit(5)
            ).all()
        )

        top_selling_products = list(
            db.execute(
                select(
                    Product.id,
                    Product.name,
                    func.sum(SaleItem.quantity).label("total_quantity"),
                    func.sum(SaleItem.subtotal).label("total_revenue"),
                )
                .join(SaleItem, SaleItem.product_id == Product.id)
                .join(Sale, Sale.id == SaleItem.sale_id)
                .where(
                    Sale.tenant_id == tenant_id,
                    Sale.sale_date >= month_start,
                )
                .group_by(Product.id, Product.name)
                .order_by(func.sum(SaleItem.quantity).desc(), Product.name.asc())
                .limit(5)
            ).all()
        )

        return DashboardSummaryResponse(
            total_sold_today=Decimal(total_sold_today or 0),
            total_sold_month=Decimal(total_sold_month or 0),
            sales_count_month=int(sales_count_month or 0),
            low_stock_products_count=len(low_stock_products),
            low_stock_products=[
                LowStockProductResponse(
                    product_id=row.id,
                    name=row.name,
                    category=row.category,
                    stock_quantity=row.stock_quantity,
                )
                for row in low_stock_products
            ],
            top_selling_products=[
                BestSellerResponse(
                    product_id=row.id,
                    name=row.name,
                    total_quantity=int(row.total_quantity or 0),
                    total_revenue=Decimal(row.total_revenue or 0),
                )
                for row in top_selling_products
            ],
        )
