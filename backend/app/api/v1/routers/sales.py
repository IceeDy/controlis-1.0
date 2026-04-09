from fastapi import APIRouter, status

from app.dependencies.auth import CurrentTenant, CurrentUser, DbSession
from app.schemas.sale import SaleCreate, SaleDetailResponse, SaleResponse
from app.services.sale_service import SaleService

router = APIRouter()


@router.post("", response_model=SaleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    db: DbSession,
    tenant: CurrentTenant,
    current_user: CurrentUser,
) -> SaleDetailResponse:
    sale = SaleService.create_sale(db, tenant.id, current_user.id, payload)
    return SaleDetailResponse.model_validate(sale)


@router.get("", response_model=list[SaleResponse])
def list_sales(db: DbSession, tenant: CurrentTenant) -> list[SaleResponse]:
    sales = SaleService.list_sales(db, tenant.id)
    return [SaleResponse.model_validate(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleDetailResponse)
def get_sale(sale_id: str, db: DbSession, tenant: CurrentTenant) -> SaleDetailResponse:
    sale = SaleService.get_sale_or_404(db, tenant.id, sale_id)
    return SaleDetailResponse.model_validate(sale)
