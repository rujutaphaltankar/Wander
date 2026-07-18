import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface ItineraryActivityDraft {
  day: number;
  time: string;
  title: string;
  type: "FOOD" | "ATTRACTION" | "TRANSPORT" | "SHOPPING" | "REST" | "HOTEL";
  durationLabel: string;
  costInr: number;
  note: string;
}

export interface ItineraryRequest {
  cityName: string;
  days: number;
  people: number;
  budgetInr: number;
  hotelName?: string;
  travelMode: string;
  foodPref?: string;
  interests: string[];
}

function buildPrompt(req: ItineraryRequest): string {
  return `Create a ${req.days}-day travel itinerary for ${req.people} people visiting ${req.cityName}.
Total budget: roughly INR ${req.budgetInr}. Hotel base: ${req.hotelName ?? "city center"}. Preferred travel mode: ${req.travelMode}.
Food preference: ${req.foodPref ?? "no preference"}. Interests: ${req.interests.join(", ") || "general sightseeing"}.
Keep each day to 5-6 activities including meals, one transport step, and a rest break. Use real, plausible place names for ${req.cityName} where possible.
Respond with ONLY minified JSON, no markdown fences, no commentary, matching exactly this shape:
{"days":[{"day":1,"activities":[{"time":"8:00 AM","title":"...","type":"FOOD|ATTRACTION|TRANSPORT|SHOPPING|REST|HOTEL","durationLabel":"45 min","costInr":300,"note":"..."}]}]}
costInr is an integer (0 if free). Keep "note" under 12 words.`;
}

function stripCodeFences(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!env.anthropicApiKey) {
    throw new AppError("AI provider is not configured. Set ANTHROPIC_API_KEY in .env.", 503);
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new AppError(`AI provider request failed (${response.status}).`, 502);
  }
  const data = (await response.json()) as { content: Array<{ type: string; text?: string }> };
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!env.openaiApiKey) {
    throw new AppError("AI provider is not configured. Set OPENAI_API_KEY in .env.", 503);
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new AppError(`AI provider request failed (${response.status}).`, 502);
  }
  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

export async function generateItinerary(
  req: ItineraryRequest
): Promise<{ day: number; activities: Omit<ItineraryActivityDraft, "day">[] }[]> {
  const prompt = buildPrompt(req);
  const raw = env.aiProvider === "openai" ? await callOpenAI(prompt) : await callAnthropic(prompt);

  let parsed: { days: { day: number; activities: Omit<ItineraryActivityDraft, "day">[] }[] };
  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch {
    throw new AppError("The AI returned an unexpected response. Please try generating again.", 502);
  }

  if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    throw new AppError("The AI didn't return a usable itinerary. Please try again.", 502);
  }

  return parsed.days;
}

export async function chatWithAssistant(message: string, cityName?: string): Promise<string> {
  const prompt = `You are Wander's in-app travel assistant${cityName ? ` for ${cityName}` : ""}.
Answer the traveler's question in 2-4 short sentences, practical and specific. No markdown, no headers.
Question: "${message}"`;

  const raw = env.aiProvider === "openai" ? await callOpenAI(prompt) : await callAnthropic(prompt);
  return raw.trim();
}
