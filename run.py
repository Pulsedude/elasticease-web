from rich.console import Console
import webbrowser
import subprocess
import time
import yaml
import sys

console = Console()

# read configuration file
with open("./config.yaml", "r") as file: 
    configuration = yaml.safe_load(file)
    
try:
    if isinstance(configuration, tuple):
        console.print(
            f"[!] Something went wrong! {configuration[1]}", style="bold red")
        sys.exit(1)
    
    # frontend server configuration
    frontend_sev_host = configuration.get("elasticease_web").get("frontend").get("host")
    frontend_sev_port = configuration.get("elasticease_web").get("frontend").get("port")
    
    # backend server configuration
    backend_sev_host = configuration.get(
        "elasticease_web").get("backend").get("host")
    backend_sev_port = configuration.get(
        "elasticease_web").get("backend").get("port")

    # run both servers
    console.print("""[bright_cyan]
▄▄▄▄▄▄ ▄       ▄▄▄▄▄   ▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄▄ ▄ ▄▄▄▄▄  ▄▄▄▄▄▄  ▄▄▄▄▄   ▄▄▄▄▄▄ ▄▄▄▄▄▄
█      █      █     █ █           █     █ █    ▀ █      █     █ █       █
█▄▄▄   █      █▄▄▄▄▄▀ █▄▄▄▄▄▄     ▄     █ █      █▄▄▄   █▄▄▄▄▄▀ █▄▄▄▄▄▄ █▄▄▄
▄      █      █     ▀       ▀     █     █ ▄      ▄      █     ▀       ▀ ▄
█▄▄▄▄▄ █▄▄▄▄▄ █     █ ▄▄▄▄▄▄▀     █     █ ▀▄▄▄▄▄ █▄▄▄▄▄ █     █ ▄▄▄▄▄▄▀ █▄▄▄▄▄[/bright_cyan]


Starting [bold]Elasticease web[/bold]...
                      """)

    # commands to run servers

    # start frontend react + vite server
    frontend = subprocess.Popen(
        ["npm.cmd", "run", "dev"],
        cwd="webui"
    )

    # start backend FastAPI server
    backend = subprocess.Popen(
        [
            "uvicorn",
            "api:app",
            "--reload",
            "--host",
            backend_sev_host,
            "--port",
            str(backend_sev_port),
        ],
        cwd="backend"
    )
    
    time.sleep(10)
    webbrowser.open(f"http://{frontend_sev_host}:{frontend_sev_port}/login")

    frontend.wait()
    backend.wait()
    

except KeyboardInterrupt:
    sys.exit(1)

except Exception as e:
    console.print(e, style="bold red")

