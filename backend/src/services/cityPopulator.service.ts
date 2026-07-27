import { prisma } from "../config/db";
import { generateCityAndPlaces } from "./ai.service";

export async function ensureCityExists(cityName: string) {
  const trimmed = cityName.trim();
  if (!trimmed) return null;

  // Case-insensitive lookup using findMany (safe for SQLite)
  const allCities = await prisma.city.findMany();
  const existing = allCities.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );

  if (existing) {
    // If the city exists but has no places, populate them
    const placeCount = await prisma.place.count({ where: { cityId: existing.id } });
    if (placeCount > 0) {
      return existing;
    }
    
    // City exists but has no places - generate and insert places only
    console.log(`[CityPopulator] City ${existing.name} has no places, generating...`);
    const generated = await generateCityAndPlaces(existing.name);
    if (generated && generated.places.length > 0) {
      await prisma.place.createMany({
        data: generated.places.map((p) => ({
          cityId: existing.id,
          type: p.type,
          name: p.name,
          category: p.category,
          description: p.description,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          priceLevel: p.priceLevel,
          avgCostInr: p.avgCostInr,
          entryFeeInr: p.entryFeeInr,
          openingHours: p.openingHours,
          visitDuration: p.visitDuration,
          crowdLevel: p.crowdLevel,
          cuisine: p.cuisine,
          isVegFriendly: p.isVegFriendly,
        })),
      });
    }
    return existing;
  }

  // City does not exist at all - generate city and places
  console.log(`[CityPopulator] City ${trimmed} not found. Generating dynamically...`);
  const generated = await generateCityAndPlaces(trimmed);

  // Check if city was created by a concurrent request
  const checkAgain = await prisma.city.findFirst({
    where: { name: generated.name, country: generated.country },
  });
  if (checkAgain) return checkAgain;

  const city = await prisma.city.create({
    data: {
      name: generated.name,
      country: generated.country,
      latitude: generated.latitude,
      longitude: generated.longitude,
      description: generated.description,
    },
  });

  if (generated.places && generated.places.length > 0) {
    await prisma.place.createMany({
      data: generated.places.map((p) => ({
        cityId: city.id,
        type: p.type,
        name: p.name,
        category: p.category,
        description: p.description,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        priceLevel: p.priceLevel,
        avgCostInr: p.avgCostInr,
        entryFeeInr: p.entryFeeInr,
        openingHours: p.openingHours,
        visitDuration: p.visitDuration,
        crowdLevel: p.crowdLevel,
        cuisine: p.cuisine,
        isVegFriendly: p.isVegFriendly,
      })),
    });
  }

  return city;
}
