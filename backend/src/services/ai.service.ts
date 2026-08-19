import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface ItineraryActivityDraft {
  day: number;
  time: string;
  title: string;
  type: "FOOD" | "ATTRACTION" | "TRANSPORT" | "SHOPPING" | "REST" | "HOTEL" | "ACTIVITY";
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
Total budget: roughly INR ${req.budgetInr} (convert all costs to INR equivalent for this city). Hotel base: ${req.hotelName ?? "city center"}. Preferred travel mode: ${req.travelMode}.
Food preference: ${req.foodPref ?? "no preference"}. Interests: ${req.interests.join(", ") || "general sightseeing"}.
Each day should have 6-8 activities including meals, at least one sightseeing or experience activity, one transport step, and a rest break.
Use real, specific, well-known place names for ${req.cityName} — not generic names.
Include "ACTIVITY" type for experiences like tours, nightlife, beaches, markets, shows, adventure sports.
Respond with ONLY minified JSON, no markdown fences, no commentary, matching exactly this shape:
{"days":[{"day":1,"activities":[{"time":"8:00 AM","title":"...","type":"FOOD|ATTRACTION|TRANSPORT|SHOPPING|REST|HOTEL|ACTIVITY","durationLabel":"45 min","costInr":300,"note":"..."}]}]}
costInr is an integer in Indian Rupees (0 if free). Keep "note" under 12 words. Do not include any text outside the JSON.`;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
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
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new AppError(`AI provider request failed (${response.status}): ${err}`, 502);
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
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new AppError(`AI provider request failed (${response.status}): ${err}`, 502);
  }
  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function callGroq(prompt: string): Promise<string> {
  if (!env.groqApiKey) {
    throw new AppError("AI provider is not configured. Set GROQ_API_KEY in .env.", 503);
  }
  const candidateModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
  ];

  let lastError = "";
  for (const model of candidateModels) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
        const content = data.choices[0]?.message?.content ?? "";
        if (content) return content;
      } else {
        lastError = await response.text().catch(() => "");
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new AppError(`Groq request failed: ${lastError}`, 502);
}

async function callAI(prompt: string): Promise<string> {
  if (env.aiProvider === "openai") return callOpenAI(prompt);
  if (env.aiProvider === "groq") return callGroq(prompt);
  return callAnthropic(prompt);
}

function cleanAiOutput(text: string): string {
  let cleaned = stripCodeFences(text);
  // Remove reasoning tags if any
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Find opening and closing braces
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export function buildFallbackItinerary(req: ItineraryRequest): { day: number; activities: Omit<ItineraryActivityDraft, "day">[] }[] {
  const days: { day: number; activities: Omit<ItineraryActivityDraft, "day">[] }[] = [];
  const city = req.cityName;
  const costPerMeal = Math.max(150, Math.round(req.budgetInr / (req.days * 5)));
  const costPerAttraction = Math.max(100, Math.round(req.budgetInr / (req.days * 4)));

  for (let i = 1; i <= req.days; i++) {
    days.push({
      day: i,
      activities: [
        {
          time: "8:30 AM",
          title: `Breakfast at ${city} Central Café`,
          type: "FOOD",
          durationLabel: "45 min",
          costInr: costPerMeal,
          note: "Local breakfast & coffee",
        },
        {
          time: "9:45 AM",
          title: `Explore ${city} Historic Center & Landmarks`,
          type: "ATTRACTION",
          durationLabel: "2.5 hr",
          costInr: costPerAttraction,
          note: "Iconic architecture & heritage",
        },
        {
          time: "1:00 PM",
          title: `Lunch at Traditional ${city} Kitchen`,
          type: "FOOD",
          durationLabel: "1 hr",
          costInr: costPerMeal * 1.2,
          note: req.foodPref ? `${req.foodPref} specialty` : "Authentic regional lunch",
        },
        {
          time: "2:30 PM",
          title: `${city} City Museum & Cultural Gallery`,
          type: "ATTRACTION",
          durationLabel: "2 hr",
          costInr: costPerAttraction,
          note: "Art and history exhibits",
        },
        {
          time: "5:00 PM",
          title: `${city} Promenade & Sunset Viewpoint`,
          type: "ACTIVITY",
          durationLabel: "1.5 hr",
          costInr: 0,
          note: "Scenic evening walking tour",
        },
        {
          time: "7:30 PM",
          title: `Dinner at ${city} Night Market Eatery`,
          type: "FOOD",
          durationLabel: "1.5 hr",
          costInr: costPerMeal * 1.4,
          note: "Dinner with local street delicacies",
        },
      ],
    });
  }

  return days;
}

export async function generateItinerary(
  req: ItineraryRequest
): Promise<{ day: number; activities: Omit<ItineraryActivityDraft, "day">[] }[]> {
  try {
    const prompt = buildPrompt(req);
    const raw = await callAI(prompt);
    const cleaned = cleanAiOutput(raw);
    const parsed = JSON.parse(cleaned);

    if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
      return parsed.days;
    }
  } catch (err) {
    console.warn("[AI] Itinerary generation via AI failed, using dynamic builder:", err);
  }

  return buildFallbackItinerary(req);
}

export async function chatWithAssistant(message: string, cityName?: string): Promise<string> {
  const prompt = `You are Wander's in-app travel assistant${cityName ? ` for ${cityName}` : ""}.
Answer the traveler's question in 2-4 short sentences, practical and specific. No markdown, no headers.
Question: "${message}"`;

  const raw = await callAI(prompt);
  return raw.trim();
}

export interface GeneratedPlace {
  name: string;
  type: "ATTRACTION" | "RESTAURANT" | "ACTIVITY";
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
  currencyCode: string;
  places: GeneratedPlace[];
}

function buildCityPrompt(cityName: string): string {
  return `You are a travel database assistant for a global travel app.
Generate structured information for the city "${cityName}".
Provide: the official city name, the country name, city center latitude/longitude, a short description (under 40 words), the local currency ISO code (e.g. USD, EUR, GBP, JPY, INR, AED, THB), and:
1. 4 top ATTRACTION places (landmarks, museums, historical sites, parks, viewpoints — use real, specific, well-known places).
2. 4 top RESTAURANT places (local cuisine, street food, cafes, popular eateries — use real place names or well-known food areas).
3. 4 top ACTIVITY places (tours, nightlife, beaches, adventure sports, markets, shows, experiences, cultural events — use real names).

For ALL places, use real, accurate coordinates within the city. Convert all costs to Indian Rupees (INR).

Respond with ONLY minified JSON, no markdown fences, no commentary, matching exactly this structure:
{"name":"City Name","country":"Country Name","latitude":48.8566,"longitude":2.3522,"description":"Short city description.","currencyCode":"EUR","places":[{"name":"Eiffel Tower","type":"ATTRACTION","category":"Landmark","description":"Iconic iron lattice tower on the Champ de Mars.","address":"Champ de Mars, 5 Av. Anatole France","latitude":48.8584,"longitude":2.2945,"priceLevel":3,"avgCostInr":2100,"entryFeeInr":2100,"openingHours":"9:00 AM - 11:45 PM","visitDuration":"2 hr","crowdLevel":"High","cuisine":null,"isVegFriendly":true}]}

cuisine should be null for ATTRACTION and ACTIVITY types. isVegFriendly should reflect whether the place has vegetarian options.`;
}

export function generateMockCityAndPlaces(cityName: string): GeneratedCity {
  const c = cityName.trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
  return {
    name: c,
    country: "Global",
    latitude: 0,
    longitude: 0,
    description: `A beautiful and vibrant city known for its culture, landmarks, and delicious local cuisine.`,
    currencyCode: "INR",
    places: [
      {
        name: `${c} Central Landmark`,
        type: "ATTRACTION",
        category: "Historical",
        description: "The iconic historic center of the city with stunning architecture.",
        address: `City Center, ${c}`,
        latitude: 0.001,
        longitude: 0.001,
        priceLevel: 1,
        avgCostInr: 0,
        entryFeeInr: 0,
        openingHours: "24/7",
        visitDuration: "1.5 hr",
        crowdLevel: "High",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `Museum of ${c}`,
        type: "ATTRACTION",
        category: "Museum",
        description: "Explore the history, art and culture of the region through exhibits.",
        address: `Culture Street, ${c}`,
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
        name: `${c} Botanical Gardens`,
        type: "ATTRACTION",
        category: "Nature",
        description: "Peaceful gardens with diverse plant species and scenic walking paths.",
        address: `Green Boulevard, ${c}`,
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
        name: `${c} Old Town`,
        type: "ATTRACTION",
        category: "Historical",
        description: "Charming historic district with cobblestone streets and heritage buildings.",
        address: `Old Quarter, ${c}`,
        latitude: 0.003,
        longitude: 0.002,
        priceLevel: 1,
        avgCostInr: 0,
        entryFeeInr: 0,
        openingHours: "24/7",
        visitDuration: "2 hr",
        crowdLevel: "Medium",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${c} Street Food Market`,
        type: "RESTAURANT",
        category: "Street food",
        description: "Bustling market offering the best local street eats and snacks.",
        address: `Bazaar Street, ${c}`,
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
        name: `The ${c} Café`,
        type: "RESTAURANT",
        category: "Café",
        description: "Cozy café with great coffee, pastries, and light breakfast options.",
        address: `Main Road, ${c}`,
        latitude: 0.002,
        longitude: -0.002,
        priceLevel: 2,
        avgCostInr: 300,
        entryFeeInr: null,
        openingHours: "7:00 AM - 8:00 PM",
        visitDuration: "1 hr",
        crowdLevel: "Medium",
        cuisine: "Café",
        isVegFriendly: true,
      },
      {
        name: `Heritage Royal Dining`,
        type: "RESTAURANT",
        category: "Fine dining",
        description: "Premium dining with authentic local recipes passed through generations.",
        address: `High Street, ${c}`,
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
      {
        name: `${c} Local Kitchen`,
        type: "RESTAURANT",
        category: "Local cuisine",
        description: "Authentic home-style cooking with fresh local ingredients.",
        address: `Food Lane, ${c}`,
        latitude: -0.004,
        longitude: -0.003,
        priceLevel: 2,
        avgCostInr: 400,
        entryFeeInr: null,
        openingHours: "10:00 AM - 10:00 PM",
        visitDuration: "1 hr",
        crowdLevel: "High",
        cuisine: "Local",
        isVegFriendly: true,
      },
      {
        name: `${c} Cultural Tour`,
        type: "ACTIVITY",
        category: "Tours",
        description: "Guided walking tour through the city's most iconic neighborhoods.",
        address: `Meeting Point: City Center, ${c}`,
        latitude: 0.0015,
        longitude: 0.0015,
        priceLevel: 2,
        avgCostInr: 800,
        entryFeeInr: 800,
        openingHours: "9:00 AM - 6:00 PM",
        visitDuration: "3 hr",
        crowdLevel: "Medium",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${c} Night Market`,
        type: "ACTIVITY",
        category: "Nightlife",
        description: "Vibrant night market with local crafts, street food and live performances.",
        address: `Night Bazaar, ${c}`,
        latitude: -0.002,
        longitude: -0.002,
        priceLevel: 1,
        avgCostInr: 300,
        entryFeeInr: null,
        openingHours: "7:00 PM - 12:00 AM",
        visitDuration: "2 hr",
        crowdLevel: "High",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${c} Adventure Park`,
        type: "ACTIVITY",
        category: "Adventure",
        description: "Thrilling outdoor activities including zip-lining and rock climbing.",
        address: `Adventure Zone, ${c}`,
        latitude: 0.006,
        longitude: 0.004,
        priceLevel: 3,
        avgCostInr: 1500,
        entryFeeInr: 1500,
        openingHours: "10:00 AM - 5:00 PM",
        visitDuration: "3 hr",
        crowdLevel: "Medium",
        cuisine: null,
        isVegFriendly: true,
      },
      {
        name: `${c} Local Craft Workshop`,
        type: "ACTIVITY",
        category: "Cultural experience",
        description: "Hands-on workshop learning traditional local crafts and art forms.",
        address: `Artisan Quarter, ${c}`,
        latitude: -0.004,
        longitude: 0.003,
        priceLevel: 2,
        avgCostInr: 600,
        entryFeeInr: 600,
        openingHours: "10:00 AM - 4:00 PM",
        visitDuration: "2 hr",
        crowdLevel: "Low",
        cuisine: null,
        isVegFriendly: true,
      },
    ],
  };
}

export async function generateCityAndPlaces(cityName: string): Promise<GeneratedCity> {
  if (!env.anthropicApiKey && !env.openaiApiKey && !env.groqApiKey) {
    console.log(`[AI] API keys not set, returning mock data for ${cityName}`);
    return generateMockCityAndPlaces(cityName);
  }

  try {
    const prompt = buildCityPrompt(cityName);
    const raw = await callAI(prompt);
    const parsed = JSON.parse(stripCodeFences(raw)) as GeneratedCity;
    if (!parsed.name || !parsed.places || !Array.isArray(parsed.places)) {
      throw new Error("Invalid structure returned by AI");
    }
    // Ensure currencyCode has a fallback
    if (!parsed.currencyCode) parsed.currencyCode = "INR";
    return parsed;
  } catch (err) {
    console.error(`[AI] Error generating city info, falling back to mock:`, err);
    return generateMockCityAndPlaces(cityName);
  }
}
