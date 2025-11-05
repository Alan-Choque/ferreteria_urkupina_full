from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "dev"

    # ⚠️ OJO: ahora leemos la variable cruda como string (o None).
    # Ya NO es List[str] para que pydantic no intente json.loads automáticamente.
    CORS_ORIGINS_RAW: Optional[str] = None

    # DB: Windows host SQL Server connection
    # Use host.docker.internal to connect from Docker container to Windows host
    DATABASE_URL: str = "mssql+pyodbc://ferre:YourStrong!Passw0rd@host.docker.internal:1433/AdventureWorks2022?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no&TrustServerCertificate=yes"

    JWT_SECRET: str = "change-me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 43200

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    @computed_field(return_type=List[str])  # pydantic v2
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """
        Convierte CORS_ORIGINS_RAW en lista:
        - Acepta JSON: '["http://localhost:3000","http://localhost:5173"]'
        - Acepta coma-separado: 'http://localhost:3000,http://localhost:5173'
        - Vacío/None -> default ['http://localhost:3000']
        """
        raw = self.CORS_ORIGINS_RAW
        if not raw:
            return ["http://localhost:3000"]
        s = raw.strip()
        if not s:
            return ["http://localhost:3000"]
        if s.startswith("["):
            try:
                import json
                parsed = json.loads(s)
                if isinstance(parsed, list) and all(isinstance(x, str) for x in parsed):
                    return parsed
            except Exception:
                pass
        # coma-separado
        return [p.strip() for p in s.split(",") if p.strip()]

settings = Settings()
