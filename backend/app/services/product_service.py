from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def create(db: Session, tenant_id: str, payload: ProductCreate) -> Product:
        product = Product(tenant_id=tenant_id, **payload.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def list(
        db: Session,
        tenant_id: str,
        search: str | None = None,
        category: str | None = None,
    ) -> list[Product]:
        statement: Select[tuple[Product]] = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.is_active.is_(True),
        )

        if search:
            statement = statement.where(Product.name.ilike(f"%{search.strip()}%"))

        if category:
            statement = statement.where(Product.category == category.strip())

        statement = statement.order_by(Product.created_at.desc())
        return list(db.scalars(statement).all())

    @staticmethod
    def get_or_404(db: Session, tenant_id: str, product_id: str) -> Product:
        product = db.scalar(
            select(Product).where(
                Product.id == product_id,
                Product.tenant_id == tenant_id,
            )
        )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado.",
            )
        return product

    @staticmethod
    def update(
        db: Session,
        tenant_id: str,
        product_id: str,
        payload: ProductUpdate,
    ) -> Product:
        product = ProductService.get_or_404(db, tenant_id, product_id)

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(product, field, value)

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def deactivate(db: Session, tenant_id: str, product_id: str) -> None:
        product = ProductService.get_or_404(db, tenant_id, product_id)
        product.is_active = False
        db.add(product)
        db.commit()
