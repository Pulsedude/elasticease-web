from fastapi import APIRouter, HTTPException, status, Response
from core_operations import CoreOps
from .models import (
    LoginCredentials,
)

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
def to_check_the_active_cluster_status(ai_response: bool = False):
    """Return the health & details of active cluster
    """
    try:
        cluster_health = coreops.check_cluster_status(ai_response)

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
def see_total_number_of_available_shards():
    """Return to total number of active shards on target node with detailed information
    """
    try:
        get_shards = coreops.shards()

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
