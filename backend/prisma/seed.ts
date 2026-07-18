import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const pune = await prisma.city.upsert({
    where: { name_country: { name: "Pune", country: "India" } },
    update: {},
    create: {
      name: "Pune",
      country: "India",
      latitude: 18.5204,
      longitude: 73.8567,
      description: "A cultural and educational hub in Maharashtra, known for its blend of historic sites and modern nightlife.",
    },
  });

  const paris = await prisma.city.upsert({
    where: { name_country: { name: "Paris", country: "France" } },
    update: {},
    create: {
      name: "Paris",
      country: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      description: "The city of lights — museums, cafés, and world-class monuments.",
    },
  });

  const newyork = await prisma.city.upsert({
    where: { name_country: { name: "New York", country: "USA" } },
    update: {},
    create: {
      name: "New York",
      country: "USA",
      latitude: 40.7128,
      longitude: -74.006,
      description: "The Big Apple — diverse neighbourhoods, food, and landmarks.",
    },
  });

  const tokyo = await prisma.city.upsert({
    where: { name_country: { name: "Tokyo", country: "Japan" } },
    update: {},
    create: {
      name: "Tokyo",
      country: "Japan",
      latitude: 35.6762,
      longitude: 139.6503,
      description: "A fast-paced megacity mixing tradition and cutting-edge tech.",
    },
  });

  const attractions = [
    { name: "Shaniwar Wada", category: "Historical", description: "17th-century fortified palace with a light & sound show at dusk.", entryFeeInr: 25, openingHours: "8 AM - 6:30 PM", visitDuration: "1.5 hr", crowdLevel: "Medium", tag: "Must visit" },
    { name: "Aga Khan Palace", category: "Historical", description: "Colonial-era palace and Gandhi memorial set in landscaped gardens.", entryFeeInr: 15, openingHours: "9 AM - 5:30 PM", visitDuration: "1 hr", crowdLevel: "Low", tag: "Must visit" },
    { name: "Sinhagad Fort", category: "Adventure", description: "Hilltop fort with a short trek and panoramic valley views.", entryFeeInr: 0, openingHours: "6 AM - 6 PM", visitDuration: "3 hr", crowdLevel: "High", tag: "Popular" },
    { name: "Osho Teerth Park", category: "Nature", description: "A quiet bamboo-lined park built around a natural rain ravine.", entryFeeInr: 0, openingHours: "6 AM - 9 PM", visitDuration: "45 min", crowdLevel: "Low", tag: "Hidden gem" },
    { name: "Phoenix Marketcity", category: "Shopping", description: "The city's largest mall — retail, food court, and a multiplex.", entryFeeInr: 0, openingHours: "11 AM - 10 PM", visitDuration: "2 hr", crowdLevel: "High", tag: "Popular" },
    { name: "High Spirits", category: "Nightlife", description: "Long-running live-music venue with a garden seating area.", entryFeeInr: 0, openingHours: "7 PM - 1:30 AM", visitDuration: "2 hr", crowdLevel: "Medium", tag: "Popular" },
  ];

  for (const a of attractions) {
    await prisma.place.create({
      data: {
        cityId: pune.id,
        type: "ATTRACTION",
        name: a.name,
        category: a.category,
        description: a.description,
        entryFeeInr: a.entryFeeInr,
        openingHours: a.openingHours,
        visitDuration: a.visitDuration,
        crowdLevel: a.crowdLevel,
        tag: a.tag,
        rating: 4.2 + Math.random() * 0.6,
        ratingCount: Math.floor(50 + Math.random() * 900),
      },
    });
  }

  const restaurants = [
    { name: "Prakash Chaat House", category: "Street food", cuisine: "Street food", avgCostInr: 100, priceLevel: 1, tag: "Hidden gem", isVegFriendly: true },
    { name: "Vaishali", category: "South Indian", cuisine: "South Indian", avgCostInr: 250, priceLevel: 2, tag: "Popular", isVegFriendly: true },
    { name: "German Bakery", category: "Cafe", cuisine: "Cafe / continental", avgCostInr: 500, priceLevel: 2, tag: "Popular", isVegFriendly: true },
    { name: "Malaka Spice", category: "Asian", cuisine: "South-East Asian", avgCostInr: 1000, priceLevel: 3, tag: "Must visit", isVegFriendly: false },
    { name: "Little Italy", category: "Fine dining", cuisine: "Italian", avgCostInr: 2000, priceLevel: 4, tag: "Popular", isVegFriendly: true },
    { name: "Goodluck Cafe", category: "Irani cafe", cuisine: "Irani", avgCostInr: 250, priceLevel: 2, tag: "Hidden gem", isVegFriendly: false },
  ];

  for (const r of restaurants) {
    await prisma.place.create({
      data: {
        cityId: pune.id,
        type: "RESTAURANT",
        name: r.name,
        category: r.category,
        cuisine: r.cuisine,
        avgCostInr: r.avgCostInr,
        priceLevel: r.priceLevel,
        tag: r.tag,
        isVegFriendly: r.isVegFriendly,
        rating: 4.0 + Math.random() * 0.8,
        ratingCount: Math.floor(50 + Math.random() * 900),
      },
    });
  }

  // Paris sample places
  await prisma.place.createMany({
    data: [
      {
        cityId: paris.id,
        type: "ATTRACTION",
        name: "Eiffel Tower",
        category: "Historical",
        description: "Iconic 19th-century iron tower with panoramic city views.",
        tag: "Must visit",
        rating: 4.6,
        ratingCount: 12000,
      },
      {
        cityId: paris.id,
        type: "RESTAURANT",
        name: "Le Comptoir",
        category: "Cafe",
        cuisine: "French",
        avgCostInr: 2500,
        priceLevel: 3,
        tag: "Popular",
        rating: 4.3,
        ratingCount: 800,
      },
    ],
  });

  // New York sample places
  await prisma.place.createMany({
    data: [
      {
        cityId: newyork.id,
        type: "ATTRACTION",
        name: "Central Park",
        category: "Nature",
        description: "Large public park in the centre of Manhattan.",
        tag: "Must visit",
        rating: 4.7,
        ratingCount: 15000,
      },
      {
        cityId: newyork.id,
        type: "RESTAURANT",
        name: "Joe's Pizza",
        category: "Street food",
        cuisine: "Pizza",
        avgCostInr: 600,
        priceLevel: 1,
        tag: "Hidden gem",
        rating: 4.2,
        ratingCount: 3200,
      },
    ],
  });

  // Tokyo sample places
  await prisma.place.createMany({
    data: [
      {
        cityId: tokyo.id,
        type: "ATTRACTION",
        name: "Senso-ji Temple",
        category: "Historical",
        description: "Ancient Buddhist temple located in Asakusa.",
        tag: "Must visit",
        rating: 4.5,
        ratingCount: 9200,
      },
      {
        cityId: tokyo.id,
        type: "RESTAURANT",
        name: "Sushi Dai",
        category: "Fine dining",
        cuisine: "Japanese",
        avgCostInr: 3000,
        priceLevel: 4,
        tag: "Popular",
        rating: 4.8,
        ratingCount: 4200,
      },
    ],
  });

  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@wander.app" },
    update: {},
    create: {
      email: "admin@wander.app",
      passwordHash: adminPasswordHash,
      name: "Wander Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed complete. Admin login: admin@wander.app / Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
