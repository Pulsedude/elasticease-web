import request
import urllib3
import config

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class CrudOps:
    def __init__(self):
        configuration = config.read()

    def create_index(self, name: str, with_mapping: bool, mapping: dict):
        """Create new index with or without proper specifying mapping
        """
        try:
            if not with_mapping:
                response = request.put(name, mapping)

                return response

            mapping = mapping

            response = request.put(
                name,
                mapping
            )

            return response

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

