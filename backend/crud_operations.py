import urllib3
from request import Client

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CrudOps:
    def __init__(self):
        self.client = Client()

    def create_index(self, name: str, with_mapping: bool, mapping: dict):
        """Create new index with or without proper specifying mapping
        """
        try:
            if not with_mapping:
                response = self.client.put(name, mapping)

                return response

            mapping = mapping

            response = self.client.put(
                name,
                mapping
            )

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    def delete_index(self, name: str):
        """Delete any such existing index
        """
        try:
            response = self.client.delete(name)

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def insert_doc(self, index: str, id: str, document: dict):
        """Insert new document into existing index
        """
        try:
            response = self.client.post(f"/{index}/_doc/{id}", document)

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def update_doc(self, index_name: str, doc_id: str, new_document: dict):
        """Update existing document by following proper Optimistic Concurrency Control (OCC)
        """
        try:
            # first fetch document to see their seq_no and primary_no that helps to determine while doing updation whether the document is newly updated or not
            document = self.client.get(f"/{index_name}/_doc/{doc_id}")
            
            if document.get("success") is False:
                return document 
            
            
            # update document by following proper OCC Rule
            _seq_no, _primary_term = document.get("response").get("_seq_no"), document.get("response").get("_primary_term")
            response = self.client.post(f"/{index_name}/_update/{doc_id}?if_seq_no={_seq_no}&if_primary_term={_primary_term}", new_document)
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        
    def delete_doc(self, index_name: str, doc_id: str):
        """Delete any such existing single document 
        """
        try:
            response = self.client.delete(f"/{index_name}/_doc/{doc_id}")
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def index_data_inspect(self, name: str, size: str):
        """Return the index along with their stored data (documents)
        """
        try:
            response = self.client.get(f"/{name}/_search/?size={size}")

            return response
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def inspect_doc(self, index_name: str, doc_id: str):
        """Inspect document of any such existing index
        """
        try:
            response = self.client.get(f"/{index_name}/_doc/{doc_id}")
            
            return response
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def bulk_insertion(self, index_name: str, docs: list[dict]):
        """Update multiple documents at once (bulk insert)
        """
        try:
            # bulk insertion of existing documents
            response_1 = self.client.bulk_insert(index_name, docs)
            
            return response_1
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
            
    def bulk_updatation(self, index_name: str, docs: list[dict]):
        """Update multiple documents at once (bulk update)
        """
        try:
            # first of all check for existing index
            response_1 = self.client.get(f"/{index_name}")
            if response_1.get("success") is False:
                return response_1
            
            # bulk updation of existing documents
            response_2 = self.client.bulk_update(index_name, docs)
            
            return response_2
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
    def bulk_deletion(self, index_name: str, docs: list[dict]):
        """Delete multiple documents at once (bulk update)
        """
        try:
            # bulk deletion of existing documents
            response_1 = self.client.bulk_delete(index_name, docs)
            
            return response_1
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
