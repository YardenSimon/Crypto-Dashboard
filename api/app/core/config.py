
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    COOKIE_DOMAIN: str = "localhost"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    ENVIRONMENT: str = "development"  # set to "production" on Railway

    COINGECKO_API_KEY: str = ""
    CRYPTOPANIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
