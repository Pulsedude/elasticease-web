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


class URLUpdate(BaseModel):
    model_config = ConfigDict(strict=True)
    base_url: str


class PromptForAI(BaseModel):
    model_config = ConfigDict(strict=True)
    prompt: str
    

class IndexDetails(BaseModel):
    model_config = ConfigDict(strict=True)
    name: str 
    info_type: str = ""
    ai_summarization: bool = False
    

class NewIndex(BaseModel):
    model_config = ConfigDict(strict=True)
    index_name: str
    with_mapping: bool = False
    mapping: dict = {}


class NewDocument(BaseModel):
    model_config = ConfigDict(strict=True)
    index_name: str
    document_id: str = ""
    document: dict


class IndexDataInspect(BaseModel):
    model_config = ConfigDict(strict=True)
    index_name: str
    size: str = "100"

class UpdateDocument(BaseModel):
    model_config = ConfigDict(strict=True)
    index_name: str
    document_id: str
    document: dict
