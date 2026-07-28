import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import yaml from "yaml";
import fs from "fs";

const fileContents = fs.readFileSync("../config.yaml", "utf8");
const config = yaml.parse(fileContents);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: config.elasticease_web.frontend.host,
    port: config.elasticease_web.frontend.port
  }
})
