# 🛠️ Elasticease Backend API

[![FastAPI](https://img.shields.io/badge/FastAPI-0.140+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-499848?style=for-the-badge&logo=gunicorn&logoColor=white)](https://www.uvicorn.org/)
[![LiteLLM](https://img.shields.io/badge/LiteLLM-Integrated-FF6F61?style=for-the-badge)](https://litellm.ai/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-black?style=for-the-badge)](https://ollama.ai/)

Welcome to the official developer and API documentation for the **Elasticease Backend API**. This backend is a high-performance, asynchronous REST & Server-Sent Events (SSE) service powered by **FastAPI** and **Uvicorn**. It interfaces directly with Elasticsearch clusters, orchestrates AI inference pipelines, enforces Optimistic Concurrency Control (OCC) for document mutations, and streams real-time cluster telemetry to the web frontend.

---

## 📑 Quick Navigation

- [🛠️ Elasticease Backend API](#️-elasticease-backend-api)
  - [📑 Quick Navigation](#-quick-navigation)
  - [🏛 Architecture \& Module Overview](#-architecture--module-overview)
  - [🔒 Authentication \& Security](#-authentication--security)
    - [How Authentication Works:](#how-authentication-works)
  - [⚡ Performance Logging \& Profiling Middleware](#-performance-logging--profiling-middleware)
  - [📡 API Endpoints Reference](#-api-endpoints-reference)
    - [1. Core Operations (`/v1/core`)](#1-core-operations-v1core)
      - [`GET /v1/core/cluster_info` (SSE Stream)](#get-v1corecluster_info-sse-stream)
      - [`POST /v1/core/auth`](#post-v1coreauth)
      - [`GET /v1/core/cluster_inspect`](#get-v1corecluster_inspect)
      - [`GET /v1/core/shards`](#get-v1coreshards)
      - [`GET /v1/core/nodes`](#get-v1corenodes)
      - [`GET /v1/core/inspect_node`](#get-v1coreinspect_node)
      - [`GET /v1/core/indices`](#get-v1coreindices)
      - [`GET /v1/core/ai_config`](#get-v1coreai_config)
      - [`PUT /v1/core/ai_inference`](#put-v1coreai_inference)
      - [`PUT /v1/core/update_elastic_url`](#put-v1coreupdate_elastic_url)
      - [`PUT /v1/core/update_backend_url`](#put-v1coreupdate_backend_url)
      - [`POST /v1/core/ai_summarization`](#post-v1coreai_summarization)
      - [`POST /v1/core/index_inspect`](#post-v1coreindex_inspect)
      - [`GET /v1/core/master_node`](#get-v1coremaster_node)
      - [`POST /v1/core/allocation`](#post-v1coreallocation)
    - [2. CRUD \& Bulk Operations (`/v1/crud`)](#2-crud--bulk-operations-v1crud)
      - [`PUT /v1/crud/create_index`](#put-v1crudcreate_index)
      - [`DELETE /v1/crud/delete_index`](#delete-v1cruddelete_index)
      - [`POST /v1/crud/insert_doc`](#post-v1crudinsert_doc)
      - [`POST /v1/crud/index_data_inspect`](#post-v1crudindex_data_inspect)
      - [`GET /v1/crud/doc_inspect`](#get-v1cruddoc_inspect)
      - [`POST /v1/crud/update_doc` (with OCC)](#post-v1crudupdate_doc-with-occ)
      - [`DELETE /v1/crud/delete_doc`](#delete-v1cruddelete_doc)
      - [`POST /v1/crud/bulk_insert`](#post-v1crudbulk_insert)
      - [`POST /v1/crud/bulk_update`](#post-v1crudbulk_update)
      - [`POST /v1/crud/bulk_delete`](#post-v1crudbulk_delete)
  - [🤖 AI Inference Engine (LiteLLM \& Ollama)](#-ai-inference-engine-litellm--ollama)
  - [🚀 Running the Backend Independently](#-running-the-backend-independently)
  - [📚 Main Documentation Links](#-main-documentation-links)

---

## 🏛 Architecture & Module Overview

The backend is modularized to separate HTTP routing, business logic, persistence configuration, security verification, and external integrations:

```text
backend/
├── main.py                     # FastAPI application instance, CORS, logging middleware, route inclusion
├── security.py                 # API Key header dependency (X-API-Key) with constant-time verification
├── config.py                   # Thread-safe YAML configuration reader and writer (config.yaml)
├── request.py                  # Low-level Elasticsearch HTTP client with timing, NDJSON, and error parsing
├── core_operations.py          # Cluster health, node telemetry, shard queries, and AI prompt orchestration
├── crud_operations.py          # Document CRUD, OCC concurrency checks, schema mappings, and bulk pipelines
├── model_inference.py          # LiteLLM (Cloud models) and Ollama (Local LLM) integrations
└── routers/
    ├── __init__.py             # Router package initializer
    ├── models.py               # Strict Pydantic request / response models
    ├── core_operations_routers.py # Endpoints under /v1/core
    └── crud_operations_routers.py # Endpoints under /v1/crud
```

---

## 🔒 Authentication & Security

All API routes (except the root `/` redirect and OpenAPI documentation `/docs`, `/redoc`, `/openapi`) are protected by the `verify_api_key` dependency defined in `security.py`.

### How Authentication Works:
1. The client must transmit the secret key in the **`X-API-Key`** HTTP header on every request.
2. The server compares the provided key against the `BACKEND_API_KEY` defined in the root `.env` file using Python's `secrets.compare_digest` to prevent timing attack vulnerabilities.
3. If missing or invalid, the API immediately rejects the request with HTTP `403 Forbidden`:
   ```json
   {
     "detail": "Invalid API Key"
   }
   ```

---

## ⚡ Performance Logging & Profiling Middleware

Every HTTP request dispatched to the backend is intercepted by an asynchronous profiling middleware in `main.py`:

```python
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    ...
```

The middleware records:
- **Requested Path** (`request.url.path`)
- **HTTP Method** (`request.method`)
- **Response Status Code** (`response.status_code`)
- **Execution Duration** (`total_time` calculated via `time.perf_counter()` in milliseconds)
- **Host CPU Usage** (`psutil.cpu_percent()`)

All execution traces are appended to `log/api.log`:
```text
INFO: path: /v1/core/shards, method: GET, status: 200, time: 14.821 ms, cpu usage: 6.4 %
INFO: path: /v1/crud/index_data_inspect, method: POST, status: 200, time: 21.054 ms, cpu usage: 7.1 %
```

---

## 📡 API Endpoints Reference

Base URL (default): `http://localhost:8000`  
Interactive OpenAPI UI: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

All requests below require the header:
```http
X-API-Key: <your_backend_api_key>
```

---

### 1. Core Operations (`/v1/core`)

#### `GET /v1/core/cluster_info` (SSE Stream)
- **Purpose**: Server-Sent Events stream yielding real-time cluster health and metrics every 10 seconds.
- **Media Type**: `text/event-stream`
- **Output Event Data Structure**:
  ```json
  data: {
    "success": true,
    "status": "alive",
    "response": {
      "cluster_name": "elasticsearch",
      "status": "green",
      "number_of_nodes": 3,
      "number_of_data_nodes": 3,
      "active_primary_shards": 142,
      "active_shards": 284,
      "relocating_shards": 0,
      "initializing_shards": 0,
      "unassigned_shards": 0
    },
    "latency": "1.428"
  }
  ```

#### `POST /v1/core/auth`
- **Purpose**: Authenticates user login credentials against the connected Elasticsearch instance.
- **Request Body** (`LoginCredentials`):
  ```json
  {
    "username": "elastic",
    "password": "your_password"
  }
  ```
- **Responses**:
  - `200 OK`: Connected and authorized.
  - `401 Unauthorized`: Bad credentials (`failed to authorize`).
  - `400 Bad Request`: Connectivity or network error.

#### `GET /v1/core/cluster_inspect`
- **Purpose**: Inspects cluster health, stats, settings, or state.
- **Query Parameters**:
  - `info_type` (*required*, `string`): One of `health`, `stats`, `settings`, `state`.
- **Response**:
  ```json
  {
    "success": true,
    "status": "alive",
    "response": { ... },
    "latency": "2.104"
  }
  ```

#### `GET /v1/core/shards`
- **Purpose**: Lists all active shards with their allocation state.
- **Query Parameters**:
  - `unassigned` (*optional*, `bool`, default `false`): Filter only unassigned shards.
  - `ai_summarization` (*optional*, `bool`, default `false`): Generates an AI summary of shard health.
- **Response**:
  ```json
  {
    "success": true,
    "status": "alive",
    "response": [
      {
        "index": "customers",
        "shard": "0",
        "prirep": "p",
        "state": "STARTED",
        "docs": "1200",
        "store": "1.2mb",
        "ip": "10.0.0.12",
        "node": "node-1"
      }
    ],
    "ai_summary": "All 284 shards are assigned and healthy across 3 cluster nodes.",
    "latency": "3.120"
  }
  ```

#### `GET /v1/core/nodes`
- **Purpose**: Lists all active nodes participating in the cluster.
- **Query Parameters**:
  - `ai_summarization` (*optional*, `bool`, default `false`)
- **Response**: Array of node metadata (IP, heap %, CPU %, load, master status).

#### `GET /v1/core/inspect_node`
- **Purpose**: Inspects specific subsystems of one or all active nodes.
- **Query Parameters**:
  - `id_or_name` (*optional*, `string`): Node name or ID (or omit for all).
  - `info_type` (*required*, `string`): `os`, `process`, `jvm`, `settings`, `plugins`, `http`, `ingest`, `usage`, `transport`.
  - `ai_summarization` (*optional*, `bool`, default `false`)

#### `GET /v1/core/indices`
- **Purpose**: Lists all indices with health status, document counts, and storage metrics.
- **Query Parameters**:
  - `ai_summarization` (*optional*, `bool`, default `false`)

#### `GET /v1/core/ai_config`
- **Purpose**: Returns the currently active AI provider, model settings, and AI mode status.
- **Response**:
  ```json
  {
    "success": true,
    "selected_ai_inference": "litellm",
    "ai_mode": true,
    "model_providers": {
      "litellm": { "model": "gemini/gemini-3-flash-preview" },
      "ollama": { "base_url": "http://0.0.0.0:11434", "model": "gpt-oss:120b-cloud" }
    }
  }
  ```

#### `PUT /v1/core/ai_inference`
- **Purpose**: Updates the active AI provider (`ollama` or `litellm`) and toggles `ai_mode` in `config.yaml` and runtime memory.
- **Request Body** (`AIInferenceUpdate`):
  ```json
  {
    "provider": "ollama",
    "ai_mode": true
  }
  ```

#### `PUT /v1/core/update_elastic_url`
- **Purpose**: Updates the Elasticsearch base URL dynamically in `config.yaml` and client memory.
- **Request Body** (`URLUpdate`):
  ```json
  {
    "base_url": "https://new-elastic-host:9200"
  }
  ```

#### `PUT /v1/core/update_backend_url`
- **Purpose**: Updates the backend URL in `config.yaml`.
- **Request Body** (`URLUpdate`):
  ```json
  {
    "base_url": "http://localhost:8000"
  }
  ```

#### `POST /v1/core/ai_summarization`
- **Purpose**: Sends a custom prompt or telemetry dump to the selected AI provider.
- **Request Body** (`PromptForAI`):
  ```json
  {
    "prompt": "Analyze these shard unassignment errors and recommend remediation steps..."
  }
  ```

#### `POST /v1/core/index_inspect`
- **Purpose**: Inspects mappings, settings, stats, or aliases for a specific index.
- **Request Body** (`IndexDetails`):
  ```json
  {
    "name": "ecommerce_orders",
    "info_type": "mapping",
    "ai_summarization": false
  }
  ```

#### `GET /v1/core/master_node`
- **Purpose**: Identifies the currently elected master node.

#### `POST /v1/core/allocation`
- **Purpose**: Retrieves disk space usage, remaining capacity, and shard counts per node.

---

### 2. CRUD & Bulk Operations (`/v1/crud`)

#### `PUT /v1/crud/create_index`
- **Purpose**: Creates a new Elasticsearch index with optional custom schema mapping.
- **Request Body** (`NewIndex`):
  ```json
  {
    "index_name": "products_v1",
    "with_mapping": true,
    "mapping": {
      "mappings": {
        "properties": {
          "title": { "type": "text" },
          "price": { "type": "float" },
          "in_stock": { "type": "boolean" }
        }
      }
    }
  }
  ```

#### `DELETE /v1/crud/delete_index`
- **Purpose**: Drops an existing index permanently.
- **Query Parameters**:
  - `name` (*required*, `string`): Index name to delete.

#### `POST /v1/crud/insert_doc`
- **Purpose**: Inserts a single JSON document into an index.
- **Request Body** (`NewDocument`):
  ```json
  {
    "index_name": "products_v1",
    "document_id": "prod_101",
    "document": {
      "title": "Ergonomic Mechanical Keyboard",
      "price": 149.99,
      "in_stock": true
    }
  }
  ```

#### `POST /v1/crud/index_data_inspect`
- **Purpose**: Retrieves stored documents from an index.
- **Request Body** (`IndexDataInspect`):
  ```json
  {
    "index_name": "products_v1",
    "size": "50"
  }
  ```

#### `GET /v1/crud/doc_inspect`
- **Purpose**: Retrieves a single document by its `_id`.
- **Query Parameters**:
  - `index_name` (*required*, `string`)
  - `doc_id` (*required*, `string`)

#### `POST /v1/crud/update_doc` (with OCC)
- **Purpose**: Updates fields of an existing document using Optimistic Concurrency Control.
- **Request Body** (`UpdateDocument`):
  ```json
  {
    "index_name": "products_v1",
    "document_id": "prod_101",
    "document": {
      "price": 129.99
    }
  }
  ```

#### `DELETE /v1/crud/delete_doc`
- **Purpose**: Deletes a single document permanently.
- **Query Parameters**:
  - `index_name` (*required*, `string`)
  - `document_id` (*required*, `string`)

#### `POST /v1/crud/bulk_insert`
- **Purpose**: High-throughput document insertion from a `.json` file.
- **Query Parameters**:
  - `index_name` (*required*, `string`)
- **Body**: `multipart/form-data` with `file: UploadFile`
- **Expected File Structure**:
  ```json
  [
    { "id": "1", "title": "Product A", "price": 10.0 },
    { "id": "2", "title": "Product B", "price": 20.0 }
  ]
  ```

#### `POST /v1/crud/bulk_update`
- **Purpose**: High-throughput updates from a `.json` file containing document IDs and partial fields.
- **Query Parameters**:
  - `index_name` (*required*, `string`)
- **Body**: `multipart/form-data` with `file: UploadFile`

#### `POST /v1/crud/bulk_delete`
- **Purpose**: High-throughput deletion from a `.json` file containing document IDs.
- **Query Parameters**:
  - `index_name` (*required*, `string`)
- **Body**: `multipart/form-data` with `file: UploadFile`
- **Expected File Structure**:
  ```json
  ["1", "2", "3"]
  ```
  *or*
  ```json
  [{ "id": "1" }, { "id": "2" }]
  ```

---

## 🤖 AI Inference Engine (LiteLLM & Ollama)

The backend provides a unified abstraction for interacting with AI models in `model_inference.py`:

```python
class Ollama:
    # Connects to local Ollama instance via HTTP POST /api/chat
    ...

class LiteLLM:
    # Connects to cloud models (Gemini, GPT-4, Claude) via LiteLLM SDK
    ...
```

The active provider is chosen according to `selected_ai_inference` in `config.yaml`. Whenever a query is made with `ai_summarization=true`, the raw JSON response from Elasticsearch is transformed into a prompt and submitted to the model, returning an executive summary alongside the raw telemetry data.

---

## 🚀 Running the Backend Independently

You can launch only the backend service for API testing or integration:

### Local Process Execution
```bash
# Navigate to backend directory
cd backend

# Ensure virtual environment is activated
source ../.venv/bin/activate  # or ..\.venv\Scripts\Activate.ps1 on Windows

# Run directly
python main.py

# Or run using Uvicorn CLI with custom workers and host binding
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Container Execution

You can build and run the backend Docker container independently:

#### 1. Build the Backend Image
From the repository root:
```bash
docker build -t elasticease-backend -f Dockerfile.backend .
```

#### 2. Run with Volume Mounts (`-v`)
Always mount both `config.yaml` and `.env` into `/elasticease/` so the backend can read and write configuration settings and verify the `X-API-Key` authentication header:

**Linux / macOS (bash / zsh)**:
```bash
docker run -d \
  --name elasticease_backend \
  --network host \
  --env-file .env \
  -v "$(pwd)/config.yaml:/elasticease/config.yaml" \
  -v "$(pwd)/.env:/elasticease/.env" \
  elasticease-backend
```

**Windows (PowerShell)**:
```powershell
docker run -d `
  --name elasticease_backend `
  --network host `
  --env-file .env `
  -v "${PWD}/config.yaml:/elasticease/config.yaml" `
  -v "${PWD}/.env:/elasticease/.env" `
  elasticease-backend
```

---

## 📚 Main Documentation Links

- 🏠 **[Project Root README](../README.md)**
- ⚡ **[Command Reference Manual (COMMANDS.md)](../COMMANDS.md)**
- 🤝 **[Contributing Guidelines (CONTRIBUTING.md)](../CONTRIBUTING.md)**
- ⚖️ **[MIT License (LICENSE)](../LICENSE)**
