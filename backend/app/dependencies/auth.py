from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, get_current_tenant
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
CurrentTenant = Annotated[Tenant, Depends(get_current_tenant)]
