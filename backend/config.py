from typing import Any
import yaml

def read():
    """Read main configuration file
    """
    try:
        with open("./config.yaml", "r") as file:
            config = yaml.safe_load(file)
        return config
    except Exception as e:
        return (False, str(e))

def write(data: Any):
    """Write configuration data back to main configuration file
    """
    try:
        with open("./config.yaml", "w") as file:
            yaml.safe_dump(data, file, indent=4)
    except Exception as e:
        return (False, str(e))