from fastapi import FastAPI
from fastapi.responses import RedirectResponse

# routers
from routers import (
    auth,
)

app = FastAPI(
    title="Elasticease",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi"
)

# default GET route 
@app.get("/")
def default_response():
    return RedirectResponse(url="/openapi")

# other routes ---------------------
app.include_router(auth.router)