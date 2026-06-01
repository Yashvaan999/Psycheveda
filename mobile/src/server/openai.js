import OpenAI from 'openai';

// Server-side only. Used by Expo Router API routes (app/*+api.js).
// Uses Replit AI Integrations (OpenAI-compatible) — no personal API key
// required. AI_INTEGRATIONS_OPENAI_BASE_URL / _API_KEY are injected by
// Replit once the OpenAI integration is connected.
export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}
