from fastapi import APIRouter, status, HTTPException
from crud_operations import CrudOps
from .models import (
    NewIndex,
    NewDocument,
    IndexDataInspect,
    UpdateDocument
)

router = APIRouter(prefix="/v1/crud")

crudops = CrudOps()

@router.put("/create_index", status_code=status.HTTP_200_OK)
def create_new_index(body: NewIndex):
    """Create new index with or without specifying proper mapping
    """
    try:
        response = crudops.create_index(body.index_name, body.with_mapping, body.mapping)
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": response.get("response").get("error")})
        
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
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": response.get("response").get("error")})
        
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
        response = crudops.insert_doc(body.index_name, body.document_id, body.document)
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})
        
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
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})
    
    
@router.get("/doc_inspect", status_code=status.HTTP_200_OK)
def inspect_existing_document(index_name: str, doc_id: str):
    """Inspect the any such existing document (single data) of any such existing index
    """
    try:
        response = crudops.inspect_doc(index_name, doc_id)
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/update_doc", status_code=status.HTTP_200_OK)
def update_existing_document(body: UpdateDocument):
    """Inspect the any such existing document (single data) of any such existing index
    """
    try:
        response = crudops.update_doc(body.index_name, body.document_id, body.document)
        
        if response.get("response") == "failed to authorize":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": response.get("status")})
        
        if "error" in response.get("response"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error": response.get("response").get("error")})
        
        return response
        
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})

