from config import read, write
import requests
import urllib3
import time

# AI inferences
from model_inference import Ollama, LiteLLM

# disable Insecure Request warning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class CoreOps:
    def __init__(self):
        config_read = read()

        self.configuration = None if isinstance(
            config_read, tuple) else config_read

        self.elastic_username = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("username") if self.configuration else None

        self.elastic_password = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("password") if self.configuration else None

        self.elastic_base_url = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("base_url") if self.configuration else None

        self.verify_certs = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("verify_certs") if self.configuration else None

        self.auth = (self.elastic_username, self.elastic_password)

        # get selected AI-Inference (provider)
        self.selected_ai_inference = self.configuration.get("elasticease_web").get(
            "selected_ai_inference") if self.configuration else None

        # AI inferences instances
        self.ollama = Ollama()
        self.litellm = LiteLLM()

        # AI mode switch
        self.ai_mode = self.configuration.get("elasticease_web").get(
            "ai_mode") if self.configuration else None

    def check_ai_mode(self):
        """Check whether AI Mode is toggled On or Off
        """
        if self.ai_mode:
            return True
        return False

    def ask_ai(self, prompt):
        """Ask AI-Model according by sending request according to selected AI-Inference (provider)
        """
        try:
            response = ""

            if self.selected_ai_inference.lower() == "ollama":
                response = self.ollama.ask(prompt)

            elif self.selected_ai_inference.lower() == "litellm":
                response = self.litellm.ask(prompt)

            else:
                return (False, "Unknown inference selected!")

            if isinstance(response, tuple):
                return (False, response[1])

            return response

        except Exception as e:
            return (False, str(e))

    def make_request(self, path: str = "."):
        """Base request method to make request on target path
        """
        try:
            if not self.elastic_base_url:
                return {
                    "success": False,
                    "error": "Elasticsearch base url not provided!"
                }

            response = requests.get(
                self.elastic_base_url +
                path if self.elastic_base_url.endswith(
                    "/") else self.elastic_base_url + "/" + path,
                timeout=10,
                auth=self.auth,
                verify=self.verify_certs
            )

            if response.status_code == 401:
                return {"success": False, "status": "alive", "response": "failed to authorized!"}

            return {"success": True, "status": "alive", "response": response.json()}
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def ping_of_elastic_api(self):
        """Return the latency of elasticsearch API
        """
        try:
            start = time.perf_counter()

            # response from elasticsearch API
            self.make_request()

            end = time.perf_counter()

            return {
                "success": True,
                "status": "alive",
                "response": (end - start) * 1000
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def authenticate(self, username: str, password: str):
        """Check authorization By making request to base url of elasticsearch
        """
        try:
            response = response = requests.get(
                self.elastic_base_url,
                timeout=10,
                auth=(username, password),
                verify=self.verify_certs
            )

            if response.status_code == 401:
                return {"success": False, "status": "alive", "response": "failed to authorize"}

            return {"success": True, "status": "alive", "response": response.json()}
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def check_cluster_status(self, ai_response: bool):
        """check the active cluster status (health)
        """
        try:
            response = self.make_request("_cluster/health")

            if ai_response:
                # check whether AI Mode is On of Off

                ai_mode = self.check_ai_mode()
                if not ai_mode:
                    return response

                # check api response if it is an error then take action further on it
                if response.get("success") is False:
                    return response

                # ask AI-Model
                ai_response = self.ask_ai(
                    f"{response.get("response")}\n\nHere is the cluster health of active elasticsearch cluster. So please explain meaning of each field in this given data. Start from direct explanation.")

                if isinstance(ai_response, tuple):
                    return {
                        "success": False,
                        "error": ai_response[1]
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "response": ai_response
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def shards(self, ai_response: bool):
        """Return the all available active shards. Cluster -> Node -> Shards
        """
        try:
            response = self.make_request("_cat/shards?format=json")

            if ai_response:
                # check whether AI Mode is On of Off

                # check api response if it is an error then take action further on it
                if response.get("success") is False:
                    return response

                ai_mode = self.check_ai_mode()
                if not ai_mode:
                    return response

                # ask AI-Model
                ai_response = self.ask_ai(
                    f"{response.get("response")}\n\nHere is the all available active shards on my elasticsearch node now can you please explain detail of each shard according to their data. Start directly from explaining.")

                if isinstance(ai_response, tuple):
                    return {
                        "success": False,
                        "error": ai_response[1]
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "response": ai_response
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def indices(self):
        """Return the all available indices
        """
        try:
            response = self.make_request("_cat/indices?format=json")

            if ai_response:
                # check whether AI Mode is On of Off

                ai_mode = self.check_ai_mode()
                if not ai_mode:
                    return response

                 # check api response if it is an error then take action further on it
                if response.get("success") is False:
                    return response

                # ask AI-Model
                ai_response = self.ask_ai(
                    f"{response.get("response")}\n\nHere is the all available active indices on my elasticsearch node now please start explaining the each index data according to their data in details. Start directly from explaining.")

                if isinstance(ai_response, tuple):
                    return {
                        "success": False,
                        "error": ai_response[1]
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "response": ai_response
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def total_documents(self):
        """Return the total number documents saved in all available indices
        """
        try:
            response = self.make_request("_cat/indices?format=json")
            total_docs = 0

            for index in response.get("response"):
                total_docs += index.get("docs.count")

            return {"success": True, "status": "alive", "response": {"total documents": total_docs}}

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
