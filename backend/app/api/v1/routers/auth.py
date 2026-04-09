from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, DbSession
from app.schemas.auth import AuthenticatedUserResponse, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    return AuthService.authenticate(db, payload.email, payload.password)


@router.get("/me", response_model=AuthenticatedUserResponse)
def me(current_user: CurrentUser) -> AuthenticatedUserResponse:
    return AuthenticatedUserResponse(user=UserResponse.model_validate(current_user))
