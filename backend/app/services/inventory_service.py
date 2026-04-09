from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import InventoryMovementType
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.schemas.inventory import InventoryMovementCreate


class InventoryService:
    @staticmethod
    def create_movement(
        db: Session,
        tenant_id: str,
        user_id: str,
        payload: InventoryMovementCreate,
    ) -> InventoryMovement:
        if payload.type not in {InventoryMovementType.ENTRY, InventoryMovementType.ADJUSTMENT}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de movimentação inválido para este endpoint.",
            )

        product = db.scalar(
            select(Product).where(
                Product.id == payload.product_id,
                Product.tenant_id == tenant_id,
                Product.is_active.is_(True),
            )
        )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado.",
            )

        if payload.type == InventoryMovementType.ENTRY and payload.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entradas de estoque devem ser positivas.",
            )

        new_stock = product.stock_quantity + payload.quantity
        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Movimentação deixaria o estoque negativo.",
            )

        product.stock_quantity = new_stock

        movement = InventoryMovement(
            tenant_id=tenant_id,
            product_id=payload.product_id,
            type=payload.type,
            quantity=payload.quantity,
            note=payload.note,
            created_by=user_id,
        )

        db.add(product)
        db.add(movement)
        db.commit()
        db.refresh(movement)
        return movement

    @staticmethod
    def list_movements(db: Session, tenant_id: str) -> list[InventoryMovement]:
        statement = (
            select(InventoryMovement)
            .where(InventoryMovement.tenant_id == tenant_id)
            .order_by(InventoryMovement.created_at.desc())
        )
        return list(db.scalars(statement).all())

    @staticmethod
    def list_balances(db: Session, tenant_id: str) -> list[Product]:
        statement = (
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .order_by(Product.name.asc())
        )
        return list(db.scalars(statement).all())
