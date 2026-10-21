from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from core_operations import CoreOps
from .models import (
    LoginCredentials,
    AIInferenceUpdate,
    URLUpdate,
    PromptForAI,
    IndexDetails
)
import config

router = APIRouter(prefix="/v1/core")
coreops = CoreOps()

# SSE (Server Sent Events) Endpoint to fetch some informational cluster data about elastic cluster health, total nodes, indices etc.
@router.get("/cluster_info", description="SSE (Server Sent Event) endpoint to return some informational data about elastic cluster")
async def cluster_info():
    return StreamingResponse(
        coreops.cluster_informational_data(),
        media_type="text/event-stream"
    )

# Other traditional REST Endpoints ------------------------

@router.get("/latency", status_code=status.HTTP_200_OK, description="Measure and return round-trip network response latency (in milliseconds) to the Elasticsearch API")
def see_latency_of_api():
    """Return the latency of Elasticsearch API
    """
    try:
        elastic_api_ping = coreops.ping_of_elastic_api()

        if elastic_api_ping.get("success") is False and elastic_api_ping.get("response") == "failed to authorize":
            return HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": elastic_api_ping.get("response")},
            )

        if elastic_api_ping.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=elastic_api_ping
            )

        return elastic_api_ping

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/auth", status_code=status.HTTP_200_OK, description="Authenticate user login credentials against configuration and verify connectivity to the Elasticsearch cluster")
def authorization(credentials: LoginCredentials):
    """
    Validate user credentials against config.yaml, then check Elasticsearch connection
    """
    try:
        # If credentials match, check Elasticsearch connection
        auth_check = coreops.authenticate(
            credentials.username, credentials.password)

        if auth_check.get("success") is False and auth_check.get("response") == "failed to authorize":
            return HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": auth_check.get("response")},
            )

        if auth_check.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=auth_check
            )

        return auth_check

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e)}
        )


@router.get("/cluster_status", status_code=status.HTTP_200_OK, description="Retrieve overall cluster health status, shard allocations, active nodes, and cluster metrics from Elasticsearch")
def to_check_the_active_cluster_status():
    """Return the health & details of active cluster
    """
    try:
        response = coreops.check_cluster_status()

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )
            
        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/shards", status_code=status.HTTP_200_OK, description="Retrieve all active, unassigned, and relocating shards across nodes with optional AI-powered summarization")
def see_total_number_of_available_shards(ai_summarization: bool = False):
    """Return to total number of active shards on target node with detailed information
    """
    try:
        response = coreops.shards(ai_summarization)

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response").get("error")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/nodes", status_code=status.HTTP_200_OK, description="Retrieve connected Elasticsearch nodes with CPU, RAM, heap percent, roles, and load metrics with optional AI-powered summarization")
def see_total_number_active_nodes(ai_summarization: bool = False):
    """Return to total number of active nodes running on cluster
    """
    try:
        response = coreops.nodes(ai_summarization)
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/indices", status_code=status.HTTP_200_OK, description="Retrieve index metadata, health states, doc counts, store sizes, and shard counts with optional AI-powered summarization")
def see_all_indices(ai_summarization: bool = False):
    """Return the total number indices on active nodes
    """
    try:
        response = coreops.indices(ai_summarization)

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/ai_config", status_code=status.HTTP_200_OK, description="Retrieve the current AI inference settings, selected provider (Ollama or LiteLLM), model details, and AI toggle mode")
def get_ai_configuration():
    """Return current selected AI inference provider and config from config.yaml"""
    try:
        cfg = config.read()

        if isinstance(cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": cfg[1]})

        web_cfg = cfg.get("elasticease_web", {}
                          ) if isinstance(cfg, dict) else {}
        return {
            "success": True,
            "selected_ai_inference": web_cfg.get("selected_ai_inference", "ollama"),
            "ai_mode": web_cfg.get("ai_mode", True),
            "model_providers": web_cfg.get("model_providers", {})
        }
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.put("/ai_inference", status_code=status.HTTP_200_OK, description="Update the active AI inference provider (Ollama or LiteLLM) and toggle AI mode in config.yaml and the active session")
def update_ai_inference(body: AIInferenceUpdate):
    """Update selected AI inference provider in config.yaml and active session"""
    try:
        cfg = config.read()
        if isinstance(cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": cfg[1]})

        if "elasticease_web" not in cfg:
            cfg["elasticease_web"] = {}

        provider = body.provider.lower().strip()

        if provider not in ["ollama", "litellm"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Invalid AI inference provider. Must be 'ollama' or 'litellm'."}
            )

        cfg["elasticease_web"]["selected_ai_inference"] = provider
        if body.ai_mode is not None:
            cfg["elasticease_web"]["ai_mode"] = body.ai_mode

        write_res = config.write(cfg)
        if isinstance(write_res, tuple) and not write_res[0]:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={
                                "error": write_res[1]})

        coreops.selected_ai_inference = provider
        if body.ai_mode is not None:
            coreops.ai_mode = body.ai_mode

        return {
            "success": True,
            "selected_ai_inference": provider,
            "message": f"Successfully switched AI inference to {provider}"
        }
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.put("/update_elastic_url", status_code=status.HTTP_200_OK, description="Update the Elasticsearch base URL endpoint in config.yaml and synchronize the backend client connection")
def update_elastic_base_url(body: URLUpdate):
    """Update existing Elasticsearch request URL with new Base URL
    """
    try:
        cfg = config.read()

        if isinstance(cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": cfg[1]})

        new_base_url = body.base_url

        if not new_base_url.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={
                    "error": "Please provide a valid URL!"}
            )

        cfg["elasticease_web"]["elasticsearch"]["base_url"] = new_base_url

        # write back to configurations
        write_cfg = config.write(cfg)
        if isinstance(write_cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": write_cfg[1]})

        return {
            "success": True,
            "elastic url": new_base_url,
            "message": "successfully updated!"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.put("/update_backend_url", status_code=status.HTTP_200_OK, description="Update the backend API base URL in config.yaml for client requests and configuration synchronization")
def update_backend_base_url(body: URLUpdate):
    """Update existing backend API base url with new base URL
    """
    try:
        cfg = config.read()

        if isinstance(cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": cfg[1]})

        new_base_url = body.base_url

        if not new_base_url.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={
                    "error": "Please provide a valid URL!"}
            )

        cfg["elasticease_web"]["backend"]["base_url"] = new_base_url

        # write back to configurations
        write_cfg = config.write(cfg)
        if isinstance(write_cfg, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": write_cfg[1]})

        return {
            "success": True,
            "backend url": new_base_url,
            "message": "successfully updated!"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/ai_summarization", status_code=status.HTTP_200_OK, description="Submit an analytical prompt or cluster dataset to the configured AI engine for intelligent summarization and insights")
def ask_ai_to_summarize_data(body: PromptForAI):
    """Special endpoint used to send data summarization request to Model
    """
    try:
        ai_response = coreops.ask_ai(body.prompt)

        if isinstance(ai_response, tuple):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={
                                "error": ai_response[1]})

        return {
            "success": True,
            "ai_response": True,
            "response": ai_response
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/index_inspect", status_code=status.HTTP_200_OK, description="Inspect detailed metadata, settings, mappings, statistics, or aliases for a specific index with optional AI summarization")
def see_specific_index_details(body: IndexDetails):
    """Retrieve the details of specific index (default response is core details of index)
    """
    try:
        response = coreops.index_info(
            body.name, body.info_type, body.ai_summarization)

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/master_node", status_code=status.HTTP_200_OK, description="Retrieve identity, IP address, and role information for the elected master node in the Elasticsearch cluster")
def master_node_info():
    """Retrieve the master node information 
    """
    try:
        response = coreops.master_node()

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/allocation", status_code=status.HTTP_200_OK, description="Retrieve disk space utilization, remaining disk capacity, and shard allocation across cluster nodes with optional AI summarization")
def nodes_disk_allocation(ai_summarization: bool = False):
    """Retrieve the active nodes disk allocation data
    """
    try:
        response = coreops.allocation(ai_summarization)

        if response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        if "error" in response.get("response"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})
