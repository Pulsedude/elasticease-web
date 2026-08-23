from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
import psutil
from pathlib import Path


# routers
from routers import core_operations_routers

app = FastAPI(
    title="elasticease",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi"
)

# logger
parent_directory = Path(__file__).resolve().parent.parent
print(parent_directory)

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s', filemode='a', filename=f"./{parent_directory}/log/api.log")
logger = logging.getLogger(__name__)


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
        
        # latency
        response.headers["X-API-Latency"] = f"{end - start:.3f}"
        return response
        
    except Exception as e:
        logger.error(f"path: {request.url.path}, method: {request.method}, status: {response.status_code}, time: {total_time:.3f} ms, cpu usage: {cpu_usage} %")


# CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# default GET route 
@app.get("/")
def redirection_to_openapi_documentation():
    return RedirectResponse(url="/openapi")

# core operation routers (endpoints) ---------------------
app.include_router(core_operations_routers.router)
