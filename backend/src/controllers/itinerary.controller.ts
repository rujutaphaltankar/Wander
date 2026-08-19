import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth";
import { generateItinerary } from "../services/ai.service";
import { ensureCityExists } from "../services/cityPopulator.service";
import { NotFoundError } from "../utils/AppError";
import { encodeStringArray, decodeStringArray } from "../utils/json";

function withParsedInterests<T extends { interests: string }>(trip: T) {
  return { ...trip, interests: decodeStringArray(trip.interests) };
}

export async function createItinerary(req: AuthedRequest, res: Response) {
  const { cityName, days, people, budgetInr, hotelName, travelMode, foodPref, interests } = req.body;

  let city = await ensureCityExists(cityName);
  if (!city) {
    city = await prisma.city.upsert({
      where: { name_country: { name: cityName, country: "India" } },
      update: {},
      create: { name: cityName, country: "India", latitude: 0, longitude: 0 },
    });
  }

  const aiDays = await generateItinerary({
    cityName, days, people, budgetInr, hotelName, travelMode, foodPref, interests,
  });

  const trip = await prisma.trip.create({

    data: {
      userId: req.user!.id,
      cityId: city.id,
      title: `${days}-day trip to ${cityName}`,
      days,
      people,
      budgetInr,
      hotelName,
      travelMode,
      foodPref,
      interests: encodeStringArray(interests),
      itineraryDays: {
        create: aiDays.map((d) => ({
          dayNumber: d.day,
          activities: {
            create: d.activities.map((a, idx) => ({
              order: idx,
              time: a.time,
              title: a.title,
              type: a.type,
              durationLabel: a.durationLabel,
              costInr: a.costInr ?? 0,
              note: a.note,
            })),
          },
        })),
      },
    },
    include: { itineraryDays: { include: { activities: true }, orderBy: { dayNumber: "asc" } } },
  });

  // Seed a matching budget record so the client can go straight to the tracker.
  const totals = { food: 0, transport: 0, tickets: 0, shopping: 0, hotel: 0 };
  aiDays.forEach((d) =>
    d.activities.forEach((a) => {
      const cost = a.costInr ?? 0;
      if (a.type === "FOOD") totals.food += cost;
      else if (a.type === "TRANSPORT") totals.transport += cost;
      else if (a.type === "ATTRACTION") totals.tickets += cost;
      else if (a.type === "SHOPPING") totals.shopping += cost;
      else if (a.type === "HOTEL") totals.hotel += cost;
    })
  );

  await prisma.budget.create({
    data: {
      userId: req.user!.id,
      tripId: trip.id,
      totalInr: budgetInr,
      spentFoodInr: totals.food,
      spentTransportInr: totals.transport,
      spentTicketsInr: totals.tickets,
      spentShoppingInr: totals.shopping,
      spentHotelInr: totals.hotel,
    },
  });

  res.status(201).json({ success: true, trip: withParsedInterests(trip) });
}

export async function listTrips(req: AuthedRequest, res: Response) {
  const trips = await prisma.trip.findMany({
    where: { userId: req.user!.id },
    include: { city: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, trips: trips.map(withParsedInterests) });
}

export async function getTrip(req: AuthedRequest, res: Response) {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      itineraryDays: {
        include: { activities: { include: { place: true } } },
        orderBy: { dayNumber: "asc" },
      },
      city: { include: { places: true } },
      budget: true,
    },
  });
  if (!trip) throw new NotFoundError("That trip doesn't exist.");
  res.json({ success: true, trip: withParsedInterests(trip) });
}

export async function deleteTrip(req: AuthedRequest, res: Response) {
  const trip = await prisma.trip.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!trip) throw new NotFoundError("That trip doesn't exist.");
  await prisma.trip.delete({ where: { id: trip.id } });
  res.json({ success: true, message: "Trip deleted." });
}
