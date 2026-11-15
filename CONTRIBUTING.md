# 🤝 Contributing to Elasticease Web

First off, thank you for considering contributing to **Elasticease Web**! Projects like this thrive because of open source contributors like you. Whether you are fixing a bug, adding a new Elasticsearch diagnostic command, improving UI components, or updating documentation, your help is warmly welcomed.

---

## 📑 Quick Navigation

- [🤝 Contributing to Elasticease Web](#-contributing-to-elasticease-web)
  - [📑 Quick Navigation](#-quick-navigation)
  - [📜 Code of Conduct](#-code-of-conduct)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Forking and Cloning](#forking-and-cloning)
    - [Environment Setup](#environment-setup)
      - [1. Backend Configuration](#1-backend-configuration)
      - [2. Python Virtual Environment Setup](#2-python-virtual-environment-setup)
      - [3. Frontend Setup](#3-frontend-setup)
  - [💻 Running the Project Locally](#-running-the-project-locally)
    - [Running Services Independently](#running-services-independently)
  - [➕ Adding New Console Commands](#-adding-new-console-commands)
    - [Step 1: Register Command in `commandRegistry.js`](#step-1-register-command-in-commandregistryjs)
    - [Step 2: Implement Backend Endpoint (if required)](#step-2-implement-backend-endpoint-if-required)
    - [Step 3: Implement Command Execution](#step-3-implement-command-execution)
    - [Step 4: Update Documentation](#step-4-update-documentation)
  - [📐 Coding Standards \& Style Guide](#-coding-standards--style-guide)
    - [Python Backend Guidelines](#python-backend-guidelines)
    - [Frontend React Guidelines](#frontend-react-guidelines)
  - [🌿 Git Workflow \& Commit Guidelines](#-git-workflow--commit-guidelines)
    - [Branch Naming](#branch-naming)
    - [Commit Messages](#commit-messages)
  - [📬 Submitting a Pull Request](#-submitting-a-pull-request)
  - [💬 Questions or Need Help?](#-questions-or-need-help)

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all contributors, maintainers, and users with respect, kindness, and professional courtesy regardless of background or experience level.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

1. **Python**: Version `3.13` or newer.
2. **Node.js**: Version `18.0.0` or newer (LTS recommended) and **npm**.
3. **Elasticsearch**: A running Elasticsearch instance (locally via Docker, binary, or cloud).
4. **Git**: Version control client.
5. *(Optional)* **Docker & Docker Compose**: If running containerized setups.

### Forking and Cloning

1. Fork the repository on GitHub:
   ```bash
   # Visit: https://github.com/Pulsedude/elasticease-web
   ```
2. Clone your personal fork to your local machine:
   ```bash
   git clone https://github.com/<your-username>/elasticease-web.git
   cd elasticease-web
   ```
3. Set up the upstream remote:
   ```bash
   git remote add upstream https://github.com/Pulsedude/elasticease-web.git
   ```

### Environment Setup

#### 1. Backend Configuration
Create your environment file and configuration:
```bash
# Copy example environment file
cp .example.env .env

# Copy example YAML configuration
cp example.config.yml config.yaml
```

Edit `.env` to supply a secure secret key for backend authentication:
```ini
BACKEND_API_KEY=your_secure_dev_api_key_here
```

Edit `config.yaml` to match your local Elasticsearch credentials, host, and port:
```yaml
elasticease_web:
  ai_mode: true
  backend:
    allow_origins:
      - http://localhost:5173
      - http://127.0.0.1:5173
    base_url: http://localhost:8000
    host: 0.0.0.0
    port: 8000
  elasticsearch:
    base_url: https://localhost:9200
    username: elastic
    password: your_elastic_password
    verify_certs: false
```

#### 2. Python Virtual Environment Setup
Set up the virtual environment in the project root:
```bash
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Install backend dependencies:
pip install -r requirements.txt
```

#### 3. Frontend Setup
Install frontend dependencies in `webui/`:
```bash
cd webui
npm install
cd ..
```

---

## 💻 Running the Project Locally

You can launch both the FastAPI backend and Vite frontend together using the convenient launcher script:

```bash
python run.py
```

`run.py` automatically:
- Reads your `config.yaml` file.
- Spawns the Vite dev server (`npm run dev` in `webui/`).
- Spawns the FastAPI Uvicorn server (`main:app` in `backend/`).
- Launches your default web browser directly to `http://localhost:5173/login`.

### Running Services Independently

If you prefer running services in separate terminal windows:

**Terminal 1 — Backend (FastAPI)**:
```bash
cd backend
python main.py
# Backend runs at http://localhost:8000 (OpenAPI docs at /docs)
```

**Terminal 2 — Frontend (React + Vite)**:
```bash
cd webui
npm run dev
# Frontend runs at http://localhost:5173
```

## ➕ Adding New Console Commands

Adding a new command to the Elasticease interactive console follows a clean, decoupled design:

### Step 1: Register Command in `commandRegistry.js`
Open `webui/src/console/commandRegistry.js` and add your command definition into `COMMAND_REGISTRY`:

```javascript
{
  name: "index:my_feature",
  aliases: ["idx:feature"],
  description: "Explain what your command does",
  category: "Index",
  arguments: [
    {
      name: "index",
      type: "index",
      description: "Target index name",
      required: true,
    },
    {
      name: "json",
      type: "boolean",
      description: "Return raw JSON if true",
      required: false,
      options: ["true", "false"],
    },
  ],
}
```

### Step 2: Implement Backend Endpoint (if required)
Add the corresponding endpoint in `backend/routers/` or business logic in `core_operations.py`/`crud_operations.py`.

```python
@router.get("/my_feature")
def get_my_feature(index: str):
    return client.get(f"/{index}/_my_feature")
```

### Step 3: Implement Command Execution
In `webui/src/console/mockExecutor.js`, handle the command execution in `executeCommand()` by calling your backend endpoint and formatting the output:

```javascript
case "index:my_feature":
  return fetchMyFeature(parsedCommand);
```

### Step 4: Update Documentation
Document your new command in [COMMANDS.md](./COMMANDS.md) with parameters, allowed values, and real-world examples!

---

## 📐 Coding Standards & Style Guide

### Python Backend Guidelines
- Follow **PEP 8** style guidelines.
- Use explicit type annotations for function parameters and return types.
- Always use the logging module (`logger.info()`, `logger.error()`) rather than `print()`.
- Use Pydantic models with `model_config = ConfigDict(strict=True)` for request payloads.
- Ensure all endpoints verify the `verify_api_key` dependency.

### Frontend React Guidelines
- Keep components modular, reusable, and single-responsibility.
- Use functional components with React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- Follow Tailwind CSS utility classes; avoid inline styles whenever practical.
- Test both **Light** and **Dark** theme modes for any UI changes.
- Ensure all interactive elements have accessible labels (`aria-label`, `title`).
- Run the linter before submitting:
  ```bash
  cd webui
  npm run lint
  ```

---

## 🌿 Git Workflow & Commit Guidelines

We recommend following the **Conventional Commits** standard:

### Branch Naming
- `feat/feature-name` (e.g., `feat/es-vector-search`)
- `fix/bug-description` (e.g., `fix/sse-reconnect-leak`)
- `docs/doc-update` (e.g., `docs/add-bulk-examples`)
- `refactor/component-name` (e.g., `refactor/command-parser`)

### Commit Messages
Format commit messages with a prefix and concise description:
```text
feat(console): add support for index:shrink command
fix(backend): handle 404 response gracefully during document delete
docs(commands): add syntax and examples for bulk:update
refactor(ui): streamline cluster health metrics cards
```

---

## 📬 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Navigate to the main repository: [https://github.com/Pulsedude/elasticease-web](https://github.com/Pulsedude/elasticease-web).
3. Click **Compare & pull request**.
4. Fill out the pull request description:
   - What changed and why.
   - Related issue numbers (e.g., `Fixes #12`).
   - Screenshots or terminal recordings if introducing visual changes.
5. Submit the PR for review! Maintainers will review your code, provide constructive feedback, and merge once ready.

---

## 💬 Questions or Need Help?

If you have questions, run into setup issues, or want to discuss an idea before building it:
- Open a GitHub Issue: [https://github.com/Pulsedude/elasticease-web/issues](https://github.com/Pulsedude/elasticease-web/issues)
- Reference the documentation:
  - [Project README](./README.md)
  - [Command Reference Manual](./COMMANDS.md)
  - [MIT License](./LICENSE)
