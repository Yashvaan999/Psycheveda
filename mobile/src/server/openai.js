import OpenAI from 'openai';

// Server-side only. Used by Expo Router API routes (app/*+api.js).
// Uses the user's own OpenAI API key, stored as the OPENAI_API_KEY secret.
export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}
