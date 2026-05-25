import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";

dotenv.config();

/**
 * Factory que crea una instancia de Stagehand configurada para usar Google Gemini.
 *
 * Variables de entorno:
 *   GEMINI_API_KEY   (obligatoria)
 *   GEMINI_MODEL     (default: gemini-2.5-flash-preview-04-17)
 *   HEADLESS         (default: false)
 */
export function createGeminiStagehand(): Stagehand {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en .env");
  }

  const model = process.env['GEMINI_MODEL'] || "gemini-2.5-flash-preview-04-17";
  const headless = process.env['HEADLESS'] === "true";

  return new Stagehand({
    env: "LOCAL",
    model: {
      modelName: model,
      apiKey,
      provider: "google",
    },
    localBrowserLaunchOptions: {
      headless,
    },
  });
}

/**
 * OpenRouter — API compatible con OpenAI. Modelos gratuitos disponibles.
 *
 * Variables de entorno:
 *   OPENROUTER_API_KEY (obligatoria, obténla gratis en https://openrouter.ai/keys)
 *   OPENROUTER_MODEL   (default: gpt-4o-mini)
 *   HEADLESS           (default: false)
 *
 * Nota: Stagehand v3 usa provider "openai" internamente. OpenRouter es compatible
 * con la API de OpenAI, por lo que funciona como baseURL personalizada.
 * Los modelos gratuitos en OpenRouter incluyen:
 *   - google/gemini-2.5-flash-exp:free
 *   - meta-llama/llama-3.1-70b-instruct:free
 *   - deepseek/deepseek-chat:free
 * Pero Stagehand solo acepta modelName de su lista AvailableModel. Usa "gpt-4o-mini"
 * como alias seguro; OpenRouter lo mapeará según disponibilidad.
 */
export function createOpenRouterStagehand(): Stagehand {
  const apiKey = process.env['OPENROUTER_API_KEY'];
  if (!apiKey) {
    throw new Error("Falta OPENROUTER_API_KEY en .env. Obtén una gratis en https://openrouter.ai/keys");
  }

  const model = process.env['OPENROUTER_MODEL'] || "gpt-4o-mini";
  const headless = process.env['HEADLESS'] === "true";

  return new Stagehand({
    env: "LOCAL",
    model: {
      modelName: model,
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      provider: "openai",
    },
    localBrowserLaunchOptions: {
      headless,
    },
  });
}

/**
 * OpenAI directo.
 *
 * Variables de entorno:
 *   OPENAI_API_KEY (obligatoria)
 *   OPENAI_MODEL   (default: gpt-4o-mini)
 *   HEADLESS       (default: false)
 */
export function createOpenAIStagehand(): Stagehand {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en .env");
  }

  const model = process.env['OPENAI_MODEL'] || "gpt-4o-mini";
  const headless = process.env['HEADLESS'] === "true";

  return new Stagehand({
    env: "LOCAL",
    model: {
      modelName: model,
      apiKey,
      provider: "openai",
    },
    localBrowserLaunchOptions: {
      headless,
    },
  });
}
