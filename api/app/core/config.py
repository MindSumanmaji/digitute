import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DigiTute API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Server Networking
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

    @property
    def clean_supabase_url(self) -> str:
        url = self.SUPABASE_URL.strip()
        if url.endswith("/rest/v1/"):
            url = url[:-9]
        elif url.endswith("/rest/v1"):
            url = url[:-8]
        return url.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
