import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";

dotenv.config();

/**
 * Factory que crea una instancia de Stagehand configurada para usar Ollama local.
 *
 * Variables de entorno:
 *   OLLAMA_BASE_URL  (default: http://localhost:11434/v1)
 *   OLLAMA_API_KEY   (default: ollama)
 *   OLLAMA_MODEL     (default: llama3.1)
 *   HEADLESS         (default: false)
 */
export function createOllamaStagehand(): Stagehand {
  const baseURL = process.env['OLLAMA_BASE_URL'] || "http://localhost:11434/v1";
  const apiKey = process.env['OLLAMA_API_KEY'] || "ollama";
  const model = process.env['OLLAMA_MODEL'] || "llama3.1";
  const headless = process.env['HEADLESS'] === "true";

  return new Stagehand({
    env: "LOCAL",
    model: {
      modelName: model,
      apiKey,
      baseURL,
      provider: "ollama",
    },
    localBrowserLaunchOptions: {
      headless,
    },
  });
}
