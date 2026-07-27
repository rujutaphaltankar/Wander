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

export interface GeneratedPlace {
  name: string;
  type: "ATTRACTION" | "RESTAURANT";
  category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  priceLevel: number;
  avgCostInr: number;
  entryFeeInr: number | null;
  openingHours: string;
  visitDuration: string;
  crowdLevel: "Low" | "Medium" | "High";
  cuisine: string | null;
  isVegFriendly: boolean;
}

export interface GeneratedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  places: GeneratedPlace[];
}

function buildCityPrompt(cityName: string): string {
  return `You are a travel database assistant.
Generate structured information for the city "${cityName}".
Provide the official name of the city, the country name, the city center's latitude and longitude, a short description (under 40 words), and:
1. A list of 6 top attractions (landmarks, museums, parks, historical sites).
2. A list of 6 top restaurants/food places, specifically including local street food spots, cafes, and popular local diners.

Respond with ONLY minified JSON, no markdown fences, no commentary, matching exactly this structure:
{"name":"City Name","country":"Country Name","latitude":48.8566,"longitude":2.3522,"description":"Short description of the city","places":[{"name":"Place Name","type":"ATTRACTION","category":"Historical","description":"Description under 15 words","address":"Area name","latitude":48.8584,"longitude":2.2945,"priceLevel":2,"avgCostInr":300,"entryFeeInr":1200,"openingHours":"9:00 AM - 6:00 PM","visitDuration":"2 hr","crowdLevel":"Medium","cuisine":null,"isVegFriendly":true}]}

Use real, plausible coordinates and prices. Convert entry fees and average meal costs to Indian Rupees (INR). set cuisine to null for attractions.`;
}

export function generateMockCityAndPlaces(cityName: string): GeneratedCity {
  const formattedCityName = cityName.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    name: formattedCityName,
    country: "Global",
    latitude: 0,
    longitude: 0,
    description: `A beautiful and historic city known for its vibrant culture, landmarks, and delicious local cuisine.`,
    places: [
      {
        name: `${formattedCityName} Landmark Plaza`,
        type: "ATTRACTION",
        category: "Historical",
        description: "The historic central plaza of the city, surrounded by gorgeous architecture.",
        address: "City Center, " + formattedCityName,
        latitude: 0.001,
        longitude: 0.001,
        priceLevel: 1,
        avgCostInr: 0,
        entryFeeInr: 0,
        openingHours: "24/7",
        visitDuration: "1 hr",
        crowdLevel: "High",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `Museum of ${formattedCityName}`,
        type: "ATTRACTION",
        category: "Museum",
        description: "Explore the fascinating history and art of the region through interactive exhibits.",
        address: "Culture Way, " + formattedCityName,
        latitude: -0.002,
        longitude: 0.003,
        priceLevel: 2,
        avgCostInr: 150,
        entryFeeInr: 150,
        openingHours: "9:00 AM - 5:00 PM",
        visitDuration: "2 hr",
        crowdLevel: "Medium",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${formattedCityName} Botanical Gardens`,
        type: "ATTRACTION",
        category: "Nature",
        description: "A peaceful sanctuary featuring diverse plant species and scenic walking paths.",
        address: "Green Boulevard, " + formattedCityName,
        latitude: 0.005,
        longitude: -0.004,
        priceLevel: 1,
        avgCostInr: 50,
        entryFeeInr: 50,
        openingHours: "8:00 AM - 6:00 PM",
        visitDuration: "1.5 hr",
        crowdLevel: "Low",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${formattedCityName} Street Food Market`,
        type: "RESTAURANT",
        category: "Street food",
        description: "A bustling market offering the absolute best of local street eats and snacks.",
        address: "Bazaar Street, " + formattedCityName,
        latitude: -0.001,
        longitude: -0.001,
        priceLevel: 1,
        avgCostInr: 200,
        entryFeeInr: null,
        openingHours: "4:00 PM - 11:00 PM",
        visitDuration: "1.5 hr",
        crowdLevel: "High",
        cuisine: "Local",
        isVegFriendly: true,
      },
      {
        name: `The ${formattedCityName} Cafe`,
        type: "RESTAURANT",
        category: "Cafe",
        description: "A cozy spot offering great coffee, fresh pastries, and light breakfast options.",
        address: "Main Road, " + formattedCityName,
        latitude: 0.002,
        longitude: -0.002,
        priceLevel: 2,
        avgCostInr: 250,
        entryFeeInr: null,
        openingHours: "7:00 AM - 8:00 PM",
        visitDuration: "1 hr",
        crowdLevel: "Medium",
        cuisine: "Cafe",
        isVegFriendly: true,
      },
      {
        name: `Heritage Royal Dining`,
        type: "RESTAURANT",
        category: "Fine dining",
        description: "Experience authentic premium recipes handed down through generations.",
        address: "High Street, " + formattedCityName,
        latitude: -0.003,
        longitude: 0.002,
        priceLevel: 4,
        avgCostInr: 1200,
        entryFeeInr: null,
        openingHours: "12:00 PM - 11:00 PM",
        visitDuration: "2 hr",
        crowdLevel: "Medium",
        cuisine: "Traditional",
        isVegFriendly: true,
      },
    ],
  };
}

export async function generateCityAndPlaces(cityName: string): Promise<GeneratedCity> {
  // If API key is not configured, return mock data immediately
  if (!env.anthropicApiKey && !env.openaiApiKey) {
    console.log(`[AI] API keys not set, returning mock data for ${cityName}`);
    return generateMockCityAndPlaces(cityName);
  }

  try {
    const prompt = buildCityPrompt(cityName);
    const raw = env.aiProvider === "openai" ? await callOpenAI(prompt) : await callAnthropic(prompt);
    const parsed = JSON.parse(stripCodeFences(raw)) as GeneratedCity;
    if (!parsed.name || !parsed.places || !Array.isArray(parsed.places)) {
      throw new Error("Invalid structure returned by AI");
    }
    return parsed;
  } catch (err) {
    console.error(`[AI] Error generating city info, falling back to mock:`, err);
    return generateMockCityAndPlaces(cityName);
  }
}

