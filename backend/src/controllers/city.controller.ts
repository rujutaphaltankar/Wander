import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function listCities(req: Request, res: Response) {
  const q = (req.query.q as string) ?? "";
  const where = q ? { name: { contains: q } } : {};
  const cities = await prisma.city.findMany({ where, take: 50 });
  res.json({ success: true, count: cities.length, cities });
}

export async function getCity(req: Request, res: Response) {
  const city = await prisma.city.findUnique({ where: { id: req.params.id }, include: { places: { take: 50 } } });
  if (!city) return res.status(404).json({ success: false, message: "City not found." });
  res.json({ success: true, city });
}
