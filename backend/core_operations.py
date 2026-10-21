from config import read
import request
import requests
import urllib3
import time
import json
import asyncio

# AI inferences
from model_inference import Ollama, LiteLLM

# disable Insecure Request warning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class CoreOps:
    def __init__(self):
        configuration = read()

        # get selected AI-Inference (provider)
        self.selected_ai_inference = configuration.get("elasticease_web").get(
            "selected_ai_inference") if configuration else configuration

        # AI inference instances
        self.ollama = Ollama()
        self.litellm = LiteLLM()

        # AI mode switch
        self.ai_mode = configuration.get("elasticease_web").get(
            "ai_mode") if configuration else configuration

    
    async def cluster_informational_data(self):
        """Method to yield cluster informational data after 10 seconds in loop for SSE (Server Sent Events) endpoint. Helpful for Cluster Monitoring & Diagnostics
        """
        while True:
            # cluster health status
            cluster_health = await asyncio.to_thread(request.get, "_cluster/health")
            if cluster_health.get("success") is False:
                cluster_health = await asyncio.to_thread(request.get)
             
            # total nodes actve
            total_nodes = await asyncio.to_thread(request.get, "_cat/nodes?format=json")
            
            # total indices and total documents
            indices = await asyncio.to_thread(request.get, "_cat/indices?format=json")
            
            if cluster_health.get("success") is False or total_nodes.get("success") is False or indices.get("success") is False:
                error_payload = {
                    "error": True,
                    "cluster_health": cluster_health,
                    "total_nodes": total_nodes,
                    "indices": indices
                }
                yield f"data: {json.dumps(error_payload)}\n\n"
                await asyncio.sleep(10)
                continue
                
            total_docs = 0
            indices_list = indices.get("response")
            for index in indices_list:
                if isinstance(index.get("docs.count"), str):
                    try:
                        total_docs += int(index.get("docs.count"))
                    except (ValueError, TypeError):
                        pass
            
            data = {
                "cluster_health": cluster_health.get("response"),
                "total_nodes": total_nodes.get("response"),
                "indices": indices_list,
                "total_docs": total_docs 
            }
            
            yield f"data: {json.dumps(data)}\n\n"
            
            await asyncio.sleep(10)
            
    
    def ask_ai(self, prompt: str):
        """Ask model on specific query according to selected AI-Inference (Provider)
        """
        try:
            if isinstance(self.ai_mode, tuple):
                return (False, self.ai_mode[1])
            
            else:
                if not self.ai_mode:
                    return (False, "Please toggle on ai_mode from configuration to get AI-powered responses")
            
            
            if isinstance(self.selected_ai_inference, tuple):
                return (False, self.selected_ai_inference[1])

            if isinstance(self.ai_mode, tuple):
                return (False, self.ai_mode[1])

            if self.selected_ai_inference.lower() == "ollama":
                # ask model using Ollama
                model_res = self.ollama.ask(prompt)

                if isinstance(model_res, tuple):
                    return (False, model_res[1])

                return model_res

            elif self.selected_ai_inference.lower() == "litellm":
                # ask model using LiteLLM
                model_res = self.litellm.ask(prompt)

                if isinstance(model_res, tuple):
                    return (False, model_res[1])

                return model_res

            else:
                return (False, "Unkown AI-Inference (Provider) selected!")

        except Exception as e:
            return (False, str(e))

    def ping_of_elastic_api(self):
        """Return the latency of elasticsearch API
        """
        try:
            start = time.perf_counter()

            # response from elasticsearch API
            res = request.get()

            end = time.perf_counter()

            if res.get("success") is False:
                return res

            return {
                "success": True,
                "status": "alive",
                "response": round((end - start) * 1000, 2)
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
            cfg = read()
            
            if isinstance(cfg, tuple):
                return {
                    "success": False,
                    "error": cfg[1]
                }
            
            elastic_base_url = cfg.get("elasticease_web").get("elasticsearch").get("base_url")
            verify_certs = cfg.get("elasticease_web").get("elasticsearch").get("verify_certs")
            
            if elastic_base_url is None or verify_certs is None:
                return {
                    "success": False,
                    "error": "please check the elasticsearch configurations and try again!"
                }
                
            response = requests.get(
                url=elastic_base_url.strip(),
                timeout=20,
                auth=(username, password),
                verify=verify_certs
            )
            
            if response.status_code == 401:
                return {
                    "success": False,
                    "status_code": 401,
                    "error": response.json()
                }

            if not response.ok:
                try:
                    err_payload = response.json()
                except Exception:
                    err_payload = response.text
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": err_payload
                }

            return {
                "success": True,
                "status_code": 200,
                "response": response.json()
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def check_cluster_status(self):
        """check the active cluster status (health)
        """
        try:
            response = request.get("_cluster/health")

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def shards(self, ai_summarization: bool):
        """Return the all available active shards. Cluster -> Node -> Shards
        """
        try:
            response = request.get("_cat/shards?format=json")
            
            if response.get("success") is False:
                return response

            if ai_summarization:

                # ask AI-Model
                ai_summary = self.ask_ai(
                    f"{response.get('response')}\n\nHere is the all available active shards on my elasticsearch node now can you please explain detail of each shard according to their data in simple order to say that please summarize this whole data. Start directly from explaining and NO EXTRA ANSWER.")

                if isinstance(ai_summary, tuple):
                    return {
                        "success": True,
                        "status": "alive",
                        "ai_summary": "error",
                        "response": response.get("response"),
                        "latency": response.get("latency")
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "ai_summary": ai_summary,
                    "response": response.get("response"),
                    "latency": response.get("latency")  # elastic API latency
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def indices(self, ai_summarization: bool):
        """Return the all available indices
        """
        try:
            response = request.get("_cat/indices?format=json")
            
            if response.get("success") is False:
                return response

            if ai_summarization:
        
                # ask AI-Model
                ai_summary = self.ask_ai(
                    f"{response.get('response')}\n\nHere is the all available active indices on my elasticsearch node now please start explaining the each index data according to their data in details in simple order to say that please summarize this given data. Start directly from explaining and NO EXTRA ANSWER.")

                if isinstance(ai_summary, tuple):
                    return {
                        "success": True,
                        "status": "alive",
                        "ai_summary": "error",
                        "response": response.get("response"),
                        "latency": response.get("latency")
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "ai_summary": ai_summary,
                    "response": response.get("response"),
                    "latency": response.get("latency")  # elastic API latency
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def nodes(self, ai_summarization: bool):
        """Return total number active nodes on the running cluster with their information
        """
        try:
            response = request.get("_cat/nodes?format=json")
            
            if response.get("success") is False:
                return response

            if ai_summarization:

                # ask AI-Model
                ai_summary = self.ask_ai(
                    f"{response.get('response')}\n\nHere is the all active nodes running on elasticsearch cluster now please can you provide better explaination according to all active nodes data which is more understandable in simple order to say that to please summarize this given data. (start direclty from explaination with NO EXTRA SINGLE LINE UNSUAL ANSWER)")

                if isinstance(ai_summary, tuple):
                    return {
                        "success": True,
                        "status": "alive",
                        "ai_summary": "error",
                        "response": response.get("response"),
                        "latency": response.get("latency")
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "ai_summary": ai_summary,
                    "response": response.get("response"),
                    "latency": response.get("latency")  # elastic API latency
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def index_info(self, index_name: str, info_type: str, ai_summarization: bool):
        """Retrieve the details of specific index (default response is core details of index) 
        """
        try:
            index = index_name.strip(
                "/") if index_name.endswith("/") or index_name.startswith("/") else index_name
            additional_info_type = info_type.strip("/") if info_type.endswith(
                "/") or info_type.startswith("/") else info_type

            response = request.get(f"{index}/{additional_info_type}")
            
            if response.get("success") is False:
                return response

            if ai_summarization:

                # ask AI-Model
                ai_summary = self.ask_ai(
                    f"{response.get('response')}\n\nHere is the details of any such specific index of elasticsearch so now can you please summarize the this given data or details of this specific index. (start direclty from explaination with NO EXTRA SINGLE LINE UNSUAL ANSWER)")

                if isinstance(ai_summary, tuple):
                    return {
                        "success": True,
                        "status": "alive",
                        "ai_summary": "error",
                        "response": response.get("response"),
                        "latency": response.get("latency")
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "ai_summary": ai_summary,
                    "response": response.get("response"),
                    # elastic API latency
                    "latency": response.get("latency")
                }

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def master_node(self):
        """Retrieve the master node information
        """
        try:
            response = request.get("_cat/nodes?format=json")

            if response.get("response") == "failed to authorize":
                return response

            master_node = {}

            for node in response.get("response"):
                if node["master"] == "*":
                    master_node = node
                    break

            return {
                "success": True,
                "response": master_node,
                "latency":  response.get("latency")
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def allocation(self, ai_summarization: bool):
        """Retrieve the information of total allocation of size of each node and available storage
        """
        try:
            response = request.get("_cat/allocation?format=json")
            
            if response.get("success") is False:
                return response

            if ai_summarization:
                
                # ask AI-Model
                ai_summary = self.ask_ai(
                    f"{response.get('response')}\n\nHere is the some data of elastic nodes in which having their some information about total storage size allocation and etc. So please summarize the this given data. (start direclty from explaination with NO EXTRA SINGLE LINE UNSUAL ANSWER)")

                if isinstance(ai_summary, tuple):
                    return {
                        "success": True,
                        "status": "alive",
                        "ai_summary": "error",
                        "response": response.get("response"),
                        "latency": response.get("latency")
                    }

                return {
                    "success": True,
                    "status": "alive",
                    "ai_summary": ai_summary,
                    "response": response.get("response"),
                    # elastic API latency
                    "latency": response.get("latency")
                }

            return response

        except Exception as e:
            return {
                "success": True,
                "error": str(e)
            }
