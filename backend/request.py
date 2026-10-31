import requests
import config
import urllib3
import time
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Client:

    def __init__(self):
        configuration = config.read()

        self.elastic_base_url = None if isinstance(configuration, tuple) else configuration.get(
            "elasticease_web").get("elasticsearch").get("base_url")

        self.elastic_username = None if isinstance(configuration, tuple) else configuration.get(
            "elasticease_web").get("elasticsearch").get("username")

        self.elastic_pass = None if isinstance(configuration, tuple) else configuration.get(
            "elasticease_web").get("elasticsearch").get("password")

        self.verify_certs = None if isinstance(configuration, tuple) else configuration.get(
            "elasticease_web").get("elasticsearch").get("verify_certs")

    def get(self, endpoint: str) -> dict:
        """Make GET request to elastic API
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }

            base_url = self.elastic_base_url.strip("/")

            start = time.perf_counter()

            response = requests.get(
                url=base_url + endpoint,
                timeout=10,
                auth=(self.elastic_username, self.elastic_pass),
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def post(self, endpoint: str, data: dict) -> dict:
        """Make POST request to elastic API 
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }

            base_url = self.elastic_base_url.strip("/")
            data = data
            start = time.perf_counter()

            response = requests.post(
                url=base_url + endpoint,
                json=data,
                auth=(self.elastic_username, self.elastic_pass),
                timeout=10,
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def put(self, endpoint: str, data: dict) -> dict:
        """Make PUT request to elastic API 
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }

            base_url = self.elastic_base_url.strip("/")
            data = data
            start = time.perf_counter()

            response = requests.put(
                url=base_url + endpoint,
                json=data,
                auth=(self.elastic_username, self.elastic_pass),
                timeout=10,
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def delete(self, endpoint: str) -> dict:
        """Make DELETE request to elastic API 
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }

            base_url = self.elastic_base_url.strip("/")
            start = time.perf_counter()

            response = requests.delete(
                url=base_url + endpoint,
                auth=(self.elastic_username, self.elastic_pass),
                timeout=10,
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def bulk_insert(self, index_name: str, docs: list[dict]):
        """Make bulk API request to elastic service to insert multiple existing documents at once
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }

            # lines (list) data type to store x-ndjson which is used in bulk insert
            lines = []

            for doc in docs:
                _id = doc.get("_id") or doc.get("id") or None
                action = {"index": {"_id": str(_id)}} if _id is not None else {"index": {}}

                lines.append(json.dumps(action))
                real_data = {}

                for key, val in doc.items():
                    if key not in {"_id", "id"}:
                        real_data[key] = val

                lines.append(json.dumps(real_data))

            base_url = self.elastic_base_url.strip("/")
            start = time.perf_counter()
            
            # bulk updation request
            response = requests.post(
                url=f"{base_url}/{index_name}/_bulk",
                data="\n".join(lines) + "\n",
                headers={"Content-Type": "application/x-ndjson"},
                auth=(self.elastic_username, self.elastic_pass),
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def bulk_update(self, index_name: str, docs: list[dict]):
        """Make bulk API request to elastic service to update multiple existing documents at once
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }
                
            # lines (list) data type to store x-ndjson which is used in bulk update
            lines = []

            for doc in docs:
                _id = doc.get("_id") or doc.get("id") or None
                if not _id:
                    return {
                        "success": False,
                        "error": "invalid data provided! Please provide data of existing documents in proper structural manner including their valid id and data with proper valid fields for updation",
                        "example": "[{\"id\": \"xyz12345\", \"name\": \"John\", \"age\": 12}...]"
                    }

                action = {"update": {"_id": _id}}
                lines.append(json.dumps(action))
                real_data = {}

                for key, val in doc.items():
                    if key not in {"_id", "id"}:
                        real_data[key] = val

                data = {"doc": real_data}
                lines.append(json.dumps(data))

            base_url = self.elastic_base_url.strip("/")
            start = time.perf_counter()

            # bulk updation request
            response = requests.post(
                url=f"{base_url}/{index_name}/_bulk",
                data="\n".join(lines) + "\n",
                headers={"Content-Type": "application/x-ndjson"},
                auth=(self.elastic_username, self.elastic_pass),
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
            
    def bulk_delete(self, index_name: str, docs: list[dict]):
        """Make bulk API request to elastic service to delete multiple existing documents at once
        """
        try:
            if self.elastic_base_url is None or self.elastic_username is None or self.elastic_pass is None or self.verify_certs is None:
                return {
                    "success": False,
                    "error": "Invalid elasticsearch configurations! Please recheck it."
                }
                
            # lines (list) data type to store x-ndjson which is used in bulk update
            lines = []

            if not isinstance(docs, list):
                return {
                    "success": False,
                    "error": "Invalid data format! Expected a list of documents or document IDs."
                }

            for doc in docs:
                if isinstance(doc, dict):
                    _id = doc.get("_id") or doc.get("id") or None
                elif isinstance(doc, (str, int)):
                    _id = str(doc)
                else:
                    _id = None

                if not _id:
                    return {
                        "success": False,
                        "error": "Invalid data provided! Please provide existing document IDs for deletion.",
                        "example": "[{\"id\": \"xyz12345\"}, {\"id\": \"abc123\"}] or [\"xyz12345\", \"abc123\"]"
                    }

                action = {"delete": {"_id": str(_id)}}
                lines.append(json.dumps(action))

            base_url = self.elastic_base_url.strip("/")
            start = time.perf_counter()

            # bulk updation request
            response = requests.post(
                url=f"{base_url}/{index_name}/_bulk",
                data="\n".join(lines) + "\n",
                headers={"Content-Type": "application/x-ndjson"},
                auth=(self.elastic_username, self.elastic_pass),
                verify=self.verify_certs
            )

            end = time.perf_counter()

            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "alive",
                    "response": "failed to authorize"
                }

            if "error" in response.json():
                return {
                    "success": False,
                    "status": "alive",
                    "response": response.json().get("error")
                }

            return {
                "success": True,
                "status": "alive",
                "response": response.json(),
                "latency": f"{((end - start) * 1000):.3f}"
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
