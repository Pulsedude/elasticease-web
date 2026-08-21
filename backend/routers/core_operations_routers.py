from fastapi import APIRouter, HTTPException, status, Response
from core_operations import CoreOps
from .models import (
    LoginCredentials,
)

import json

router = APIRouter(prefix="/v1")
coreops = CoreOps()


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
def see_total_number_of_available_shards():
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
