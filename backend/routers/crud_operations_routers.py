from fastapi import APIRouter, status, HTTPException
from crud_operations import CrudOps
from .models import (
    NewIndex,
    NewDocument,
    IndexDataInspect
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
    
    
    
@router.delete("/delete_index", status_code=status.HTTP_200_OK)
def delete_existing_index(name: str):
    """Delete any such existing index 
    """
    try:
        response = crudops.delete_index(name)
        
        if response.get("status") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if response.get("success") is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})
    
    
@router.post("/insert_doc", status_code=status.HTTP_200_OK)
def insert_new_document(body: NewDocument):
    """Insert new document into ant such existing index
    """
    try:
        response = crudops.insert_doc(body.index_name, body.id, body.document)
        
        if response.get("status") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if response.get("success") is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/index_data_inspect", status_code=status.HTTP_200_OK)
def inspect_index_data(body: IndexDataInspect):
    """Inspect the data (documents) of any such existing index
    """
    try:
        response = crudops.index_data_inspect(body.index_name, body.size)
        
        if response.get("status") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if response.get("success") is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})

