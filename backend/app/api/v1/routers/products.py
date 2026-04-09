from fastapi import APIRouter, Query, status

from app.dependencies.auth import CurrentTenant, DbSession
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: DbSession,
    tenant: CurrentTenant,
) -> ProductResponse:
    product = ProductService.create(db, tenant.id, payload)
    return ProductResponse.model_validate(product)


@router.get("", response_model=list[ProductResponse])
def list_products(
    db: DbSession,
    tenant: CurrentTenant,
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
) -> list[ProductResponse]:
    products = ProductService.list(db, tenant.id, search=search, category=category)
    return [ProductResponse.model_validate(product) for product in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: DbSession, tenant: CurrentTenant) -> ProductResponse:
    product = ProductService.get_or_404(db, tenant.id, product_id)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: DbSession,
    tenant: CurrentTenant,
) -> ProductResponse:
    product = ProductService.update(db, tenant.id, product_id, payload)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_product(product_id: str, db: DbSession, tenant: CurrentTenant) -> None:
    ProductService.deactivate(db, tenant.id, product_id)
