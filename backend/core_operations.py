from config import read, write
import requests
import urllib3

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

    def make_request(self, path: str = "."):
        """Base request method to make request on target path
        """
        try:
            response = requests.get(
                self.elastic_base_url +
                path if self.elastic_base_url.endswith(
                    "/") else self.elastic_base_url + "/" + path,
                timeout=10,
                auth=self.auth,
                verify=self.verify_certs
            )

            if response.status_code == 401:
                return {"status": "alive", "response": "failed to authorized!"}

            return {"status": "alive", "response": response.json()}
        except Exception as e:
            return (False, str(e))

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
                return {"status": "alive", "response": "failed to authorized!"}

            return {"status": "alive", "response": response.json()}
        except Exception as e:
            return (False, str(e))

# obj = CoreOps()
# print(obj.authenticate())
