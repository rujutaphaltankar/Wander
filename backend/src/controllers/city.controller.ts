import { Request, Response } from "express";
import { prisma } from "../config/db";
import { ensureCityExists } from "../services/cityPopulator.service";

export async function listCities(req: Request, res: Response) {
  const q = (req.query.q as string) ?? "";
  const where = q ? { name: { contains: q } } : {};
  let cities = await prisma.city.findMany({ where, take: 50 });

  if (cities.length === 0 && q.trim().length > 0) {
    const city = await ensureCityExists(q);
    if (city) {
      cities = [city];
    }
  }

  res.json({ success: true, count: cities.length, cities });
}

export async function getCity(req: Request, res: Response) {
  const city = await prisma.city.findUnique({ where: { id: req.params.id }, include: { places: { take: 50 } } });
  if (!city) return res.status(404).json({ success: false, message: "City not found." });
  res.json({ success: true, city });
}

