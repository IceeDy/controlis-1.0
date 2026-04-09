from fastapi import APIRouter, status

from app.dependencies.auth import CurrentTenant, CurrentUser, DbSession
from app.schemas.inventory import (
    InventoryBalanceResponse,
    InventoryMovementCreate,
    InventoryMovementResponse,
)
from app.services.inventory_service import InventoryService

router = APIRouter()


@router.post("/movements", response_model=InventoryMovementResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_movement(
    payload: InventoryMovementCreate,
    db: DbSession,
    tenant: CurrentTenant,
    current_user: CurrentUser,
) -> InventoryMovementResponse:
    movement = InventoryService.create_movement(db, tenant.id, current_user.id, payload)
    return InventoryMovementResponse.model_validate(movement)


@router.get("/movements", response_model=list[InventoryMovementResponse])
def list_inventory_movements(db: DbSession, tenant: CurrentTenant) -> list[InventoryMovementResponse]:
    movements = InventoryService.list_movements(db, tenant.id)
    return [InventoryMovementResponse.model_validate(movement) for movement in movements]


@router.get("/balances", response_model=list[InventoryBalanceResponse])
def list_inventory_balances(db: DbSession, tenant: CurrentTenant) -> list[InventoryBalanceResponse]:
    products = InventoryService.list_balances(db, tenant.id)
    return [
        InventoryBalanceResponse(
            product_id=product.id,
            product_name=product.name,
            category=product.category,
            stock_quantity=product.stock_quantity,
            is_active=product.is_active,
        )
        for product in products
    ]
