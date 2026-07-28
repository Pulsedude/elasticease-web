from config import read, write
import requests


class CoreOps:
    def __init__(self):
        config_read = read()
        self.configuration = config_read if not isinstance(
            config_read, tuple) else None

        self.elastic_username = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("username") if self.configuration else None

        self.elastic_password = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("password") if self.configuration else None

        self.elastic_base_url = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("base_url") if self.configuration else None

        self.verify_certs = self.configuration.get("elasticease_web").get(
            "elasticsearch").get("verify_certs") if self.configuration else None

        self.auth = (self.elastic_username, self.elastic_password)

    def make_request(self, path: str = "."):
        """Base request method to make request on target path
        """
        try:
            response = requests.get(
                self.elastic_base_url +
                path if not self.elastic_base_url.endswith(
                    "/") else self.elastic_base_url + "/" + path,
                timeout=10,
                auth=self.auth,
                verify=self.verify_certs
            )

            if response.status_code != 200:
                return False
            
            return response
        except Exception as e:
            return (False, e)
            

    def auth(self):
        """Check authorization By making request to base url of elasticsearch
        """
        try:
            request = self.make_request()
            
            if not request or isinstance(request, tuple):
                return False
            
            return True
        except Exception as e:
            return (False, e)
            