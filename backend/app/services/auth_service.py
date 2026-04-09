from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import TokenResponse


class AuthService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> TokenResponse:
        user = db.scalar(select(User).where(User.email == email))

        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo.",
            )

        return TokenResponse(
            access_token=create_access_token(subject=user.id, tenant_id=user.tenant_id)
        )
