from pydantic import BaseModel, ConfigDict

class LoginCredentials(BaseModel):
    model_config  = ConfigDict(strict=True)
    
    username: str
    password: str
