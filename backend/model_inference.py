from litellm import completion
from config import read
import requests

configuration = read()

class Ollama:
    def __init__(self):
        self.base_url = None if isinstance(configuration, tuple) else configuration.get("elasticease_web").get("model_providers").get("ollama").get("base_url")
        
        self.model = None if isinstance(configuration, tuple) else configuration.get("elasticease_web").get("model_providers").get("ollama").get("model")
    
    def ask(self, prompt: str):
        """Ask model running on Ollama engine
        """
        try:
            if self.base_url is None:
                return (False, "Ollama Base URL not provided!")
            
            if self.model is None:
                return (False, "Ollama model not specified!")
        
        
            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "stream": False
            }
            
            response = requests.post(
                url=self.base_url + "/api/chat" if not self.base_url.endswith("/") else self.base_url + "api/chat",
                timeout=100,
                json=data
            )
            
            if response.status_code != 200:
                return (False, response.status_code)
            
            return response.json().get("message").get("content")
        
        except Exception as e:
            return (False, str(e))
        

# LiteLLM -----------

class LiteLLM:
    def __init__(self):
        self.model = None if isinstance(configuration, tuple) else configuration.get("elasticease_web").get("model_providers").get("litellm").get("model")
        
        self.api_key = None if isinstance(configuration, tuple) else configuration.get("elasticease_web").get("model_providers").get("litellm").get("api_key")
    
    
    def ask(self, prompt: str):
        """Interact with any such specific model through their official API KEY running on cloud
        """
        try:
            model = configuration.get("elasticease_web").get("model_providers").get("litellm").get("model")
            api_key = configuration.get("elasticease_web").get("model_providers").get("litellm").get("api_key")
            
            response = completion(
                model=model,
                messages=[{"content": prompt, "role": "user"}],
                api_key=api_key
            )
            
            return response.choices[0].message.content
    
        except Exception as e:
            return (False, str(e))