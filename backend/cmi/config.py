"""CMI-specific configuration settings loaded from environment / .env."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class CMISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # PostgreSQL connection for CMI data
    CMI_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cost_model_db"

    # Azure Document Intelligence (Contract Agent)
    CMI_AZURE_DI_ENDPOINT: str = ""
    CMI_AZURE_DI_KEY: str = ""

    # Azure OpenAI (Contract Agent LLM parsing)
    CMI_AZURE_OPENAI_ENDPOINT: str = ""
    CMI_AZURE_OPENAI_KEY: str = ""
    CMI_AZURE_OPENAI_DEPLOYMENT: str = "gpt-4"
    CMI_AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"

    # Azure Blob Storage (contract PDF storage)
    CMI_AZURE_STORAGE_CONNECTION_STRING: str = ""
    CMI_AZURE_STORAGE_CONTAINER: str = "contracts"

    @property
    def DATABASE_URL(self) -> str:
        return self.CMI_DATABASE_URL


cmi_settings = CMISettings()
