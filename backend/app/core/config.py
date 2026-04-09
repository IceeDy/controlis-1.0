from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    project_name: str = "Controlis API"
    api_v1_prefix: str = "/api/v1"
    environment: Literal["local", "staging", "production"] = "local"
    secret_key: str = Field(
        default="change-me-controlis-secret-key-2026",
        min_length=32,
    )
    access_token_expire_minutes: int = 60 * 8
    database_url: PostgresDsn = Field(
        default="postgresql+psycopg://controlis:controlis@localhost:5432/controlis"
    )
    frontend_origin: AnyHttpUrl = "http://localhost:3000"
    low_stock_threshold: int = 10
    algorithm: str = "HS256"


@lru_cache
def get_settings() -> Settings:
    return Settings()
