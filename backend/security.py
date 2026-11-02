import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from typing import Annotated
from dotenv import load_dotenv
from pathlib import Path
import os


parent_dir = Path().resolve().parent
load_dotenv(dotenv_path=f"{parent_dir}/.env")

API_KEY = os.getenv("BACKEND_API_KEY")

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=True
)


async def verify_api_key(
    api_key: Annotated[str, Depends(api_key_header)]
):
    if not secrets.compare_digest(api_key, API_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key"
        )

    return api_key