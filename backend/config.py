from typing import Any
from pathlib import Path
import yaml

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.yaml"

def read():
    """Read main configuration file
    """
    try:
        with open(CONFIG_PATH, "r") as file:
            config = yaml.safe_load(file)
        return config
    except Exception as e:
        return (False, str(e))

def write(data: Any):
    """Write configuration data back to main configuration file
    """
    try:
        with open(CONFIG_PATH, "w") as file:
            yaml.safe_dump(data, file, indent=4)
    except Exception as e:
        return (False, str(e))