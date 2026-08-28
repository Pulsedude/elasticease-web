from pydantic import BaseModel, ConfigDict
from typing import Optional

class LoginCredentials(BaseModel):
    model_config  = ConfigDict(strict=True)
    
    username: str
    password: str

class AIInferenceUpdate(BaseModel):
    model_config = ConfigDict(strict=True)
    provider: str
    ai_mode: Optional[bool] = None

