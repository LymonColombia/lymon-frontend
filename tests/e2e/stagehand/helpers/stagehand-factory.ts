import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
import { createOllamaStagehand } from "./stagehand-ollama.js";
import { createGeminiStagehand, createOpenAIStagehand, createOpenRouterStagehand } from "./stagehand-openai.js";

dotenv.config();

export type Provider = "ollama" | "gemini" | "openai" | "openrouter";

export function createStagehand(provider?: Provider): Stagehand {
  const p = (provider || (process.env['PROVIDER'] as Provider) || "ollama");

  switch (p) {
    case "gemini":
      return createGeminiStagehand();
    case "openai":
      return createOpenAIStagehand();
    case "openrouter":
      return createOpenRouterStagehand();
    case "ollama":
    default:
      return createOllamaStagehand();
  }
}
