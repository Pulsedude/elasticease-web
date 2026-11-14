from fastapi import FastAPI, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import config
import time
import psutil
from pathlib import Path
from security import verify_api_key
import uvicorn

# routers
from routers import core_operations_routers
from routers import crud_operations_routers

app = FastAPI(
    title="elasticease",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi"
)

# logger
parent_directory = Path(__file__).resolve().parent.parent
(parent_directory / "log").mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s', filemode='a', filename=str(parent_directory / "log" / "api.log"))
logger = logging.getLogger(__name__)

# read configuration 
configuration = config.read()

# middleware for logging
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    try:
        start = time.perf_counter()
        
        response = await call_next(request)
        
        end = time.perf_counter()
        
        total_time = (end - start) * 1000
        cpu_usage = psutil.cpu_percent()
        
        logger.info(f"path: {request.url.path}, method: {request.method}, status: {response.status_code}, time: {total_time:.3f} ms, cpu usage: {cpu_usage} %")
        
        return response
        
    except Exception as e:
        logger.error(f"path: {request.url.path}, method: {request.method}, error: {e}")


# CORS middleware to allow frontend communication
allow_origins = ["*"] if isinstance(configuration, tuple) else configuration.get("elasticease_web").get("backend").get("allow_origins")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# default GET route 
@app.get("/")
def redirection_to_openapi_documentation():
    return RedirectResponse(url="/docs")

# core operation routers (endpoints) ---------------------
app.include_router(core_operations_routers.router, dependencies=[Depends(verify_api_key)])

# crud operation routers (endpoints) ---------------------
app.include_router(crud_operations_routers.router, dependencies=[Depends(verify_api_key)])

if __name__ == "__main__":
    host = configuration.get("elasticease_web").get("backend").get("host")
    port = configuration.get("elasticease_web").get("backend").get("port")
    app_dir = str(Path(__file__).resolve().parent)
    uvicorn.run("main:app", host=host, port=port, reload=True, app_dir=app_dir)