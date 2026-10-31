from fastapi import APIRouter, status, HTTPException, UploadFile, File
from crud_operations import CrudOps
from .models import (
    NewIndex,
    NewDocument,
    IndexDataInspect,
    UpdateDocument
)
import json

router = APIRouter(prefix="/v1/crud")

crudops = CrudOps()


@router.put("/create_index", status_code=status.HTTP_200_OK, description="Create a new Elasticsearch index with optional custom schema mappings and settings")
def create_new_index(body: NewIndex):
    """Create new index with or without specifying proper mapping
    """
    try:
        response = crudops.create_index(
            body.index_name, body.with_mapping, body.mapping)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.delete("/delete_index", status_code=status.HTTP_200_OK, description="Delete an existing index and its associated data and shards from Elasticsearch")
def delete_existing_index(name: str):
    """Delete any such existing index
    """
    try:
        response = crudops.delete_index(name)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/insert_doc", status_code=status.HTTP_200_OK, description="Insert or index a new JSON document into a specified existing Elasticsearch index")
def insert_new_document(body: NewDocument):
    """Insert new document into ant such existing index
    """
    try:
        response = crudops.insert_doc(
            body.index_name, body.document_id, body.document)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/index_data_inspect", status_code=status.HTTP_200_OK, description="Retrieve and inspect stored documents from an existing index with custom size limit")
def inspect_index_data(body: IndexDataInspect):
    """Inspect the data (documents) of any such existing index
    """
    try:
        response = crudops.index_data_inspect(body.index_name, body.size)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.get("/doc_inspect", status_code=status.HTTP_200_OK, description="Retrieve and inspect a single document by its document ID from a specified index")
def inspect_existing_document(index_name: str, doc_id: str):
    """Inspect the any such existing document (single data) of any such existing index
    """
    try:
        response = crudops.inspect_doc(index_name, doc_id)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/update_doc", status_code=status.HTTP_200_OK, description="Update the contents or fields of an existing document by its document ID in a specified index")
def update_existing_document(body: UpdateDocument):
    """Update the any such single specific single document in the index
    """
    try:
        response = crudops.update_doc(
            body.index_name, body.document_id, body.document)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.delete("/delete_doc", status_code=status.HTTP_200_OK, description="Delete any such specific existing single document from the index")
def delete_existing_document(index_name: str, document_id: str):
    """Delete the any such existing document permanently from the index
    """
    try:
        response = crudops.delete_doc(index_name, document_id)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": str(e)})


@router.post("/bulk_insert", status_code=status.HTTP_200_OK, description="Insert multiple documents into single existing index at once with the help of bulk API")
async def documents_bulk_insert(index_name: str, file: UploadFile = File(...)):
    """Insert multiple existing documents at once with the help of bulk API
    """
    try:
        content = await file.read()
        text = content.decode("utf-8")
        data = {}

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={
                                "error": "please provide a valid .json file!"})

        response = crudops.bulk_insertion(index_name, data)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": e})
        

@router.post("/bulk_update", status_code=status.HTTP_200_OK, description="Update multiple documents into single existing index at once with the help of bulk API")
async def documents_bulk_update(index_name: str, file: UploadFile = File(...)):
    """Update multiple existing documents at once with the help of bulk API
    """
    try:
        content = await file.read()
        text = content.decode("utf-8")
        data = {}

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={
                                "error": "please provide a valid .json file!"})

        response = crudops.bulk_updatation(index_name, data)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": e})
        

@router.post("/bulk_delete", status_code=status.HTTP_200_OK, description="Delete multiple documents into single existing index at once with the help of bulk API")
async def documents_bulk_delete(index_name: str, file: UploadFile = File(...)):
    """Delete multiple existing documents at once with the help of bulk API
    """
    try:
        content = await file.read()
        text = content.decode("utf-8")
        data = {}

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={
                                "error": "please provide a valid .json file!"})

        response = crudops.bulk_deletion(index_name, data)

        if "error" in response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("error")},
            )

        elif response.get("response") == "failed to authorize":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": response.get("response")},
            )

        elif response.get("success") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": response.get("response")},
            )

        return response

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={"error": e})
        