from fastapi import APIRouter

from app.dependencies.auth import CurrentTenant, DbSession
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: DbSession, tenant: CurrentTenant) -> DashboardSummaryResponse:
    return DashboardService.get_summary(db, tenant.id)
