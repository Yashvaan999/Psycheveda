import { getOpenAIClient } from '../src/server/openai';

// Maps the user's current tier to the next tier up the Success Identity ladder
// and the macro-habit tracking duration mandated by the Psycheveda prompt.
const TIER_DAYS = { SURVIVOR: 7, SOLDIER: 14, WARRIOR: 21, SUPERHERO: 21 };

const SYSTEM_PROMPT = `# CONTEXT
You are an expert full-stack behavioral psychologist, an NLP researcher, and an enterprise holistic health coach. You are the core generative routine engine for "Psycheveda"—an app that bridges modern psychology with circadian and Vedic lifestyle optimization.

The application has already calculated the user's current baseline metrics and categorized them into a specific Success Identity Tier (Survivor, Soldier, Warrior, or Superhero) based on a 30-question diagnostic test.

# OBJECTIVE
Generate a highly customized, frictionless, and actionable daily goal plan packaged as a structured JSON object. This plan will act as the user's main core goal track in the application to elevate them exactly ONE tier up the Success Identity ladder (Survivor -> Soldier, Soldier -> Warrior, or Warrior -> Superhero) without causing cognitive fatigue or over-stretching their resources.

# THE TRANSITION ARCHITECTURE & RULES
You must rigorously craft the tasks according to the user's specific tier jump parameters:

1. SURVIVOR TO SOLDIER ROUTINE PRINCIPLES:
   - Focus is entirely on basic biological stabilization, nervous system regulation, and zero-friction execution.
   - Absolutely no strenuous workouts, complex multi-stage career goals, or high-effort tasks.
   - Tailor directly to age and dietary frameworks (e.g., warm, easy-digest anti-inflammatory steps for a 45-year-old vegetarian; strict morning circadian daylight locks and rapid sugar/caffeine control hooks for a 25-year-old non-vegetarian).

2. SOLDIER TO WARRIOR ROUTINE PRINCIPLES:
   - Focus shifts from basic survival to substituting exhausting willpower with automated lifestyle habits.
   - Introduce moderate movement and proactive energy buffers during the day to prevent post-meal or mid-afternoon crashes.
   - Enforce full cognitive journaling and proactive gratitude logging to build mental momentum.

3. WARRIOR TO SUPERHERO ROUTINE PRINCIPLES:
   - Focus is on peak performance alignment, strict environmental sleep hygiene controls, and biological optimization.
   - Tasks include advanced high-intensity or structural resistance physical training, early morning deep framing exercises, and managing secondary stressors.

# PROGRAMMING & OUTPUT REQUIREMENTS
Return ONLY a valid, minified JSON object matching the TypeScript interface below. Do not include any conversational prose, prefaces, or explanatory markdown wrappers.

interface GeneratedPlan {
  planTitle: string; // Dynamic title indicating the exact tier transition (e.g., "7-Day Physiological Stabilization Loop")
  macroGoalDurationDays: number; // Duration of the macro-habit tracking loop (Survivor->Soldier: 7, Soldier->Warrior: 14, Warrior->Superhero: 21)
  dailyTasks: Array<{
    taskId: string; // Unique string shorthand (e.g., "morning_daylight_anchor")
    taskTitle: string; // Concise, highly actionable title
    timeWindow: "Morning" | "Afternoon" | "Evening"; // Maps to the time-adaptive UI tracker component
    scheduledTimeRelative: string; // Estimated time stamp calculated dynamically relative to user_wake_time and user_sleep_time
    psychologicalJustification: string; // Internal operational reason linking back to user's age, dietary parameters, or vulnerability metric
  }>;
}`;

// Verifies the caller's Supabase session by validating the bearer token against
// the Supabase auth endpoint. Returns the user object or null. This prevents the
// route from being an open, billable OpenAI proxy.
async function verifyUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

// Lightweight in-memory per-user cooldown to blunt rapid-fire cost abuse. Resets
// on server restart; adequate for a single-instance dev/preview deployment.
const RATE_LIMIT_MS = 15000;
const lastCallByUser = new Map();

function buildUserPrompt(p) {
  return `# USER INPUT MATRIX
The user profile data has been captured via the UI:
- Age: ${p.age || 'Not specified'}
- Gender: ${p.gender || 'Not specified'}
- Occupation: ${p.occupation || 'Not specified'}
- Marital Status: ${p.marital_status || 'Not specified'}
- Location/Region: ${p.region || 'Not specified'}
- Food Preference: ${p.food_preference || 'Not specified'}
- Sleep Schedule: ${p.wake_time || 'Not specified'} to ${p.sleep_time || 'Not specified'}
- Current Calculated Identity Tier: ${p.current_tier || 'Not specified'}
- Primary Systemic Vulnerability: ${p.lowest_parameter || 'Not specified'}

Generate the GeneratedPlan JSON now.`;
}

export async function POST(request) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return Response.json(
        { error: 'You must be signed in to generate a plan.' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const last = lastCallByUser.get(user.id) || 0;
    if (now - last < RATE_LIMIT_MS) {
      return Response.json(
        { error: 'Please wait a few seconds before generating another plan.' },
        { status: 429 }
      );
    }
    lastCallByUser.set(user.id, now);

    const body = await request.json();
    const tier = String(body.current_tier || '').toUpperCase();

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 8192,
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    let plan;
    try {
      plan = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: 'The plan came back in an unexpected format. Please try again.' },
        { status: 502 }
      );
    }

    if (!plan || !Array.isArray(plan.dailyTasks) || plan.dailyTasks.length === 0) {
      return Response.json(
        { error: 'The plan came back empty. Please try again.' },
        { status: 502 }
      );
    }

    const fallbackDays = TIER_DAYS[tier] || 7;
    const days = Number(plan.macroGoalDurationDays);
    plan.macroGoalDurationDays = Number.isFinite(days) && days > 0 ? Math.min(31, days) : fallbackDays;

    return Response.json({ plan });
  } catch (e) {
    console.error('Elevate plan generation failed:', e?.message || e);
    return Response.json(
      { error: 'We could not generate your plan right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
