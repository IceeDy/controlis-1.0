from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import InventoryMovementType
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate


class SaleService:
    @staticmethod
    def create_sale(db: Session, tenant_id: str, user_id: str, payload: SaleCreate) -> Sale:
        quantities_by_product: dict[str, int] = defaultdict(int)
        for item in payload.items:
            quantities_by_product[item.product_id] += item.quantity

        products = list(
            db.scalars(
                select(Product).where(
                    Product.tenant_id == tenant_id,
                    Product.id.in_(list(quantities_by_product.keys())),
                    Product.is_active.is_(True),
                )
            ).all()
        )
        products_by_id = {product.id: product for product in products}

        if len(products_by_id) != len(quantities_by_product):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Um ou mais produtos não foram encontrados.",
            )

        sale_items: list[SaleItem] = []
        total_amount = Decimal("0.00")

        for product_id, quantity in quantities_by_product.items():
            product = products_by_id[product_id]
            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente para o produto '{product.name}'.",
                )

            unit_price = product.sale_price
            subtotal = unit_price * quantity
            total_amount += subtotal

            sale_items.append(
                SaleItem(
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                )
            )

        sale = Sale(
            tenant_id=tenant_id,
            total_amount=total_amount,
            sale_date=payload.sale_date,
            created_by=user_id,
            items=sale_items,
        )
        db.add(sale)
        db.flush()

        for item in sale_items:
            product = products_by_id[item.product_id]
            product.stock_quantity -= item.quantity
            db.add(
                InventoryMovement(
                    tenant_id=tenant_id,
                    product_id=product.id,
                    type=InventoryMovementType.SALE,
                    quantity=-item.quantity,
                    note=f"Baixa automática da venda {sale.id}",
                    created_by=user_id,
                )
            )
            db.add(product)

        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    def list_sales(db: Session, tenant_id: str) -> list[Sale]:
        statement = (
            select(Sale)
            .where(Sale.tenant_id == tenant_id)
            .options(selectinload(Sale.items))
            .order_by(Sale.sale_date.desc())
        )
        return list(db.scalars(statement).all())

    @staticmethod
    def get_sale_or_404(db: Session, tenant_id: str, sale_id: str) -> Sale:
        sale = db.scalar(
            select(Sale)
            .where(Sale.id == sale_id, Sale.tenant_id == tenant_id)
            .options(selectinload(Sale.items))
        )
        if sale is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venda não encontrada.",
            )
        return sale
