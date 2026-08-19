import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { NotFoundError } from "../utils/AppError";
import { ensureCityExists } from "../services/cityPopulator.service";

// GET /api/places?city=Tokyo&type=RESTAURANT&category=Street+food&maxPrice=500&veg=true
//
// Supports type=ATTRACTION | RESTAURANT | ACTIVITY
export async function listPlaces(req: Request, res: Response) {
  const { city, type, category, maxPrice, veg, q } = req.query as Record<string, string | undefined>;

  const where: Prisma.PlaceWhereInput = {};
  if (city) {
    const populatedCity = await ensureCityExists(city);
    if (populatedCity) {
      where.cityId = populatedCity.id;
    } else {
      where.city = { name: { equals: city } };
    }
  }

  // Allow ATTRACTION, RESTAURANT, and ACTIVITY types
  const validTypes = ["ATTRACTION", "RESTAURANT", "ACTIVITY"];
  if (type && validTypes.includes(type)) where.type = type;

  if (category) where.category = { equals: category };
  if (maxPrice) where.avgCostInr = { lte: Number(maxPrice) };
  if (veg === "true") where.isVegFriendly = true;
  if (q) where.name = { contains: q };

  const places = await prisma.place.findMany({
    where,
    orderBy: { rating: "desc" },
    take: 100,
  });

  res.json({ success: true, count: places.length, places });
}

export async function getPlace(req: Request, res: Response) {
  const place = await prisma.place.findUnique({
    where: { id: req.params.id },
    include: { reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!place) throw new NotFoundError("That place doesn't exist.");
  res.json({ success: true, place });
}

// ---- Admin-only management below ----

export async function createPlace(req: Request, res: Response) {
  const place = await prisma.place.create({ data: req.body });
  res.status(201).json({ success: true, place });
}

export async function updatePlace(req: Request, res: Response) {
  const place = await prisma.place.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, place });
}

export async function deletePlace(req: Request, res: Response) {
  await prisma.place.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Place removed." });
}

export async function createReview(req: Request & { user?: { id: string } }, res: Response) {
  const placeId = (req.params.id || req.body.placeId) as string;
  const { rating, comment } = req.body;

  if (!placeId) {
    throw new NotFoundError("Place ID is required.");
  }

  const review = await prisma.review.create({
    data: { userId: req.user!.id, placeId, rating: Number(rating), comment },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const agg = await prisma.review.aggregate({
    where: { placeId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  const place = await prisma.place.update({
    where: { id: placeId },
    data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  res.status(201).json({ success: true, review, place });
}
