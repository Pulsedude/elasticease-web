from fastapi import APIRouter, HTTPException, status, Response
from core_operations import CoreOps
from .models import (
    LoginCredentials,
    AIInferenceUpdate,
    URLUpdate,
    PromptForAI
)
import config
import json

router = APIRouter(prefix="/v1/core")
coreops = CoreOps()


@router.get("/latency", status_code=status.HTTP_200_OK)
def see_latency_of_api():
    """Return the latency of Elasticsearch API 
    """
    try:
        elasticsearch_api_latency = coreops.ping_of_elastic_api()

        if elasticsearch_api_latency.get("success") is False and elasticsearch_api_latency.get("response") == "failed to authorize":
            return Response(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=json.dumps(elasticsearch_api_latency),
                media_type="application/json"
            )
        if elasticsearch_api_latency.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=elasticsearch_api_latency
            )

        return elasticsearch_api_latency

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/auth", status_code=status.HTTP_200_OK)
def authorization(credentials: LoginCredentials):
    """
    Validate user credentials against config.yaml, then check Elasticsearch connection
    """
    try:
        # If credentials match, check Elasticsearch connection
        auth_check = coreops.authenticate(
            credentials.username, credentials.password)

        if auth_check.get("success") is False and auth_check.get("response") == "failed to authorize":
            return Response(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=json.dumps(auth_check),
                media_type="application/json"

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


@router.get("/cluster_status", status_code=status.HTTP_200_OK)
def to_check_the_active_cluster_status():
    """Return the health & details of active cluster
    """
    try:
        cluster_health = coreops.check_cluster_status()

        if cluster_health.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=cluster_health)

        if cluster_health.get("success") is False and cluster_health.get("response") == "failed to authorize":
            return Response(status_code=status.HTTP_403_FORBIDDEN, content=json.dumps(cluster_health), media_type="application/json")

        return cluster_health

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/shards", status_code=status.HTTP_200_OK)
def see_total_number_of_available_shards(ai_response: bool = False):
    """Return to total number of active shards on target node with detailed information
    """
    try:
        get_shards = coreops.shards(ai_response)

        if get_shards.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_shards)

        if get_shards.get("success") is False and get_shards.get("response") == "failed to authorize":
            return Response(status_code=status.HTTP_403_FORBIDDEN, content=json.dumps(get_shards), media_type="application/json")

        return get_shards

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/nodes", status_code=status.HTTP_200_OK)
def see_total_number_active_nodes(ai_response: bool = False):
    """Return to total number of active nodes running on cluster
    """
    try:
        get_nodes = coreops.nodes(ai_response)

        if get_nodes.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_nodes)

        if get_nodes.get("success") is False and get_nodes.get("response") == "failed to authorize":
            return Response(status_code=status.HTTP_403_FORBIDDEN, content=json.dumps(get_nodes), media_type="application/json")

        return get_nodes

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/indices", status_code=status.HTTP_200_OK)
def see_all_indices(ai_response: bool = False):
    """Return the total number indices on active nodes 
    """
    try:
        get_indices = coreops.indices(ai_response)

        if get_indices.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_indices)

        if get_indices.get("success") is False and get_indices.get("response") == "failed to authorize":
            return Response(status_code=status.HTTP_403_FORBIDDEN, content=json.dumps(get_indices), media_type="application/json")

        return get_indices

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/ai_config", status_code=status.HTTP_200_OK)
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


@router.put("/ai_inference", status_code=status.HTTP_200_OK)
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


@router.put("/update_elastic_url", status_code=status.HTTP_200_OK)
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
        
        
@router.put("/update_backend_url", status_code=status.HTTP_200_OK)
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


@router.post("/ai_summarization", status_code=status.HTTP_200_OK)
def ask_ai_to_summarize_data(body: PromptForAI):
    try:
        ai_response = coreops.ask_ai(body.prompt)
        
        if isinstance(ai_response, tuple):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": ai_response[1]})
        
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