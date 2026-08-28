import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yaml from "yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config.yaml from project root (one level up from webui)
const configPath = path.resolve(__dirname, '../config.yaml');
const fileContents = fs.readFileSync(configPath, "utf8");
const config = yaml.parse(fileContents);
const frontendBootId = `${Date.now()}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: config.elasticease_web.frontend.host,
    port: config.elasticease_web.frontend.port
  },
  define: {
    // Expose backend config to frontend
    __BACKEND_HOST__: JSON.stringify(config.elasticease_web.backend.host),
    __BACKEND_PORT__: JSON.stringify(config.elasticease_web.backend.port),
    __FRONTEND_BOOT_ID__: JSON.stringify(frontendBootId),
    __ES_BASE_URL__: JSON.stringify(config.elasticease_web.elasticsearch.base_url),
    __SELECTED_AI_INFERENCE__: JSON.stringify(config.elasticease_web?.selected_ai_inference || 'ollama'),
    __AI_MODE__: JSON.stringify(config.elasticease_web?.ai_mode ?? true),
    __OLLAMA_MODEL__: JSON.stringify(config.elasticease_web?.model_providers?.ollama?.model || 'gpt-oss:120b-cloud'),
    __OLLAMA_BASE_URL__: JSON.stringify(config.elasticease_web?.model_providers?.ollama?.base_url || 'http://127.0.0.1:11434'),
    __LITELLM_MODEL__: JSON.stringify(config.elasticease_web?.model_providers?.litellm?.model || 'gemini/gemini-3-flash-preview'),
  }
})
