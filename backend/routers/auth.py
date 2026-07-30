from fastapi import APIRouter, HTTPException, status
from models import LoginCredentials
from core_operations import CoreOps

router = APIRouter()
core_ops = CoreOps()


@router.post("/auth", status_code=status.HTTP_200_OK)
def auth_login(credentials: LoginCredentials):
    """
    Validate user credentials against config.yaml, then check Elasticsearch connection
    """
    try:
        # If credentials match, check Elasticsearch connection
        auth_check = core_ops.authenticate(credentials.username, credentials.password)
        if isinstance(auth_check, tuple):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail={"error": auth_check[1]}
            )

        if auth_check.get("response") == "failed to authorized!":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail={"error": "wrong credentials"}
            )
    
        return {
            "success": "authorized",
            "message": auth_check
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail={"error": str(e)}
        )

