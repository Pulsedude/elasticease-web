from fastapi import APIRouter, status, HTTPException
from crud_operations import CrudOps
from .models import (
    NewIndex
)

router = APIRouter(prefix="/v1/crud")

crudops = CrudOps()

@router.put("/create_index", status_code=status.HTTP_200_OK)
def create_new_index(body: NewIndex):
    """Create new index with or without specifying proper mapping
    """
    try:
        response = crudops.create_index(body.index_name, body.with_mapping, body.mapping)
        
        if response.get("status") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if response.get("success") is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})
