from fastapi import APIRouter, HTTPException, status
from core_operations import CoreOps

router = APIRouter()
core_ops = CoreOps()


@router.get("/", status_code=status.HTTP_200_OK)
def auth_login():
    try:
        auth_check = core_ops.auth()
        if isinstance(auth_check, tuple) or not auth_check:
            return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "failed to authorize" if not isinstance(auth_check, tuple) else auth_check[1]})

        return {
            "success": "authorized"
        }
    except Exception as e:
        return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error", str(e)})
