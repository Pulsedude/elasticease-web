import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yaml from "yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Read config.yaml safely from candidate locations
function loadConfig() {
  const candidatePaths = [
    path.resolve(projectRoot, 'config.yaml'),
    path.resolve(projectRoot, 'config.yml'),
    path.resolve(__dirname, 'config.yaml'),
    path.resolve(__dirname, 'config.yml'),
    path.resolve(projectRoot, 'example.config.yml')
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const fileContents = fs.readFileSync(candidate, 'utf8');
        const parsed = yaml.parse(fileContents);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {}
  }
  return {};
}

const config = loadConfig();
const frontendBootId = `${Date.now()}`;

function resolveApiKey(mode = 'development') {
  if (process.env.BACKEND_API_KEY) return process.env.BACKEND_API_KEY;
  if (process.env.VITE_BACKEND_API_KEY) return process.env.VITE_BACKEND_API_KEY;
  if (process.env.API_KEY) return process.env.API_KEY;
  if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;

  try {
    const envRoot = loadEnv(mode, projectRoot, '');
    if (envRoot.BACKEND_API_KEY) return envRoot.BACKEND_API_KEY;
    if (envRoot.VITE_BACKEND_API_KEY) return envRoot.VITE_BACKEND_API_KEY;
    if (envRoot.API_KEY) return envRoot.API_KEY;
    if (envRoot.VITE_API_KEY) return envRoot.VITE_API_KEY;
  } catch {}

  try {
    const envPath = path.resolve(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match =
        content.match(/^\s*(?:VITE_)?BACKEND_API_KEY\s*=\s*(.*)$/m) ||
        content.match(/^\s*(?:VITE_)?API_KEY\s*=\s*(.*)$/m);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {}

  try {
    const localEnvPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(localEnvPath)) {
      const content = fs.readFileSync(localEnvPath, 'utf8');
      const match =
        content.match(/^\s*(?:VITE_)?BACKEND_API_KEY\s*=\s*(.*)$/m) ||
        content.match(/^\s*(?:VITE_)?API_KEY\s*=\s*(.*)$/m);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {}

  return '';
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiKey = resolveApiKey(mode);

  return {
    envDir: projectRoot,
    plugins: [react(), tailwindcss()],
    server: {
      host: config.elasticease_web?.frontend?.host || '0.0.0.0',
      port: config.elasticease_web?.frontend?.port || 5173
    },
    define: {
      // Expose backend config to frontend
      __BACKEND_HOST__: JSON.stringify(config.elasticease_web?.backend?.host || '127.0.0.1'),
      __BACKEND_PORT__: JSON.stringify(config.elasticease_web?.backend?.port || '8000'),
      __BACKEND_BASE_URL__: JSON.stringify(config.elasticease_web?.backend?.base_url || 'http://127.0.0.1:8000'),
      __API_BASE_URL__: JSON.stringify(config.elasticease_web?.backend?.base_url || `http://${config.elasticease_web?.backend?.host || '127.0.0.1'}:${config.elasticease_web?.backend?.port || '8000'}`),
      __BACKEND_API_KEY__: JSON.stringify(apiKey),
      __API_KEY__: JSON.stringify(apiKey),
      'import.meta.env.VITE_BACKEND_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.BACKEND_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.API_KEY': JSON.stringify(apiKey),
      __FRONTEND_BOOT_ID__: JSON.stringify(frontendBootId),
      __ES_BASE_URL__: JSON.stringify(config.elasticease_web?.elasticsearch?.base_url || 'http://localhost:9200'),
      __SELECTED_AI_INFERENCE__: JSON.stringify(config.elasticease_web?.selected_ai_inference || 'ollama'),
      __AI_MODE__: JSON.stringify(config.elasticease_web?.ai_mode ?? true),
      __OLLAMA_MODEL__: JSON.stringify(config.elasticease_web?.model_providers?.ollama?.model || 'gpt-oss:120b-cloud'),
      __OLLAMA_BASE_URL__: JSON.stringify(config.elasticease_web?.model_providers?.ollama?.base_url || 'http://127.0.0.1:11434'),
      __LITELLM_MODEL__: JSON.stringify(config.elasticease_web?.model_providers?.litellm?.model || 'gemini/gemini-3-flash-preview'),
    }
  };
});
