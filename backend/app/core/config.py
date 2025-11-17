from __future__ import annotations

from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación.

    Las variables se leen desde `.env` (backend/.env) y se exponen en formato typed.
    Debemos mantener los nombres indicados en las instrucciones para facilitar
    la operación en infraestructura.
    """

    api_prefix: str = Field("/api", alias="API_PREFIX")
    app_env: str = Field("dev", alias="APP_ENV")
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://0.0.0.0:3000",
            "http://[::1]:3000",
            "*",
        ],
        alias="CORS_ORIGINS",
    )

    database_url: str = Field(..., alias="DATABASE_URL")

    jwt_secret: str = Field("change-me", alias="JWT_SECRET")
    jwt_alg: str = Field("HS256", alias="JWT_ALG")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(43200, alias="REFRESH_TOKEN_EXPIRE_MINUTES")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def api_v1_prefix(self) -> str:
        return f"{self.api_prefix.rstrip('/')}/v1"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> List[str]:
        """
        Permite definir CORS_ORIGINS como:
        - JSON válido: '["http://localhost:3000"]'
        - Lista separada por comas: 'http://a,http://b'
        - Lista ya procesada.
        """
        if value is None or value == "":
            return cls._default_cors()
        if isinstance(value, list):
            cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
            return cleaned or cls._default_cors()
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return cls._default_cors()
            if raw.startswith("["):
                import json

                parsed = json.loads(raw)
                if isinstance(parsed, list) and all(isinstance(x, str) for x in parsed):
                    cleaned = [item.strip() for item in parsed if item.strip()]
                    return cleaned or cls._default_cors()
            cleaned = [item.strip() for item in raw.split(",") if item.strip()]
            return cleaned or cls._default_cors()
        msg = "Valor inválido para CORS_ORIGINS"
        raise ValueError(msg)

    @classmethod
    def _default_cors(cls) -> List[str]:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://0.0.0.0:3000",
            "http://[::1]:3000",
            "*",
        ]


settings = Settings()
