import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";

export type AIProvider = "anthropic" | "google" | "openai";

/**
 * Get the configured AI provider
 * Reads from AI_PROVIDER env var, defaults to anthropic
 */
export function getDefaultProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider | undefined;
  if (provider && ["anthropic", "google", "openai"].includes(provider)) {
    return provider;
  }
  return "anthropic";
}

/**
 * Get the language model for a specific provider
 */
export function getModel(provider?: AIProvider): LanguageModelV1 {
  const selectedProvider = provider ?? getDefaultProvider();

  switch (selectedProvider) {
    case "anthropic":
      return anthropic("claude-sonnet-4-20250514");
    case "google":
      return google("gemini-2.0-flash");
    case "openai":
      return openai("gpt-4o");
    default:
      return anthropic("claude-sonnet-4-20250514");
  }
}

/**
 * Get available providers based on which API keys are configured
 */
export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = [];

  if (process.env.ANTHROPIC_API_KEY) {
    available.push("anthropic");
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    available.push("google");
  }
  if (process.env.OPENAI_API_KEY) {
    available.push("openai");
  }

  return available;
}

/**
 * Provider display names for UI
 */
export const providerNames: Record<AIProvider, string> = {
  anthropic: "Claude (Anthropic)",
  google: "Gemini (Google)",
  openai: "GPT-4o (OpenAI)",
};

