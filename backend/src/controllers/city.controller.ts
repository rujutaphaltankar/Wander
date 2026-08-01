import { Request, Response } from "express";
import { prisma } from "../config/db";
import { ensureCityExists } from "../services/cityPopulator.service";

export async function listCities(req: Request, res: Response) {
  const q = (req.query.q as string) ?? "";
  const where = q ? { name: { contains: q } } : {};
  let cities = await prisma.city.findMany({ where, take: 50 });

  if (cities.length === 0 && q.trim().length > 0) {
    const city = await ensureCityExists(q);
    if (city) cities = [city];
  }

  res.json({ success: true, count: cities.length, cities });
}

export async function getCity(req: Request, res: Response) {
  const city = await prisma.city.findUnique({
    where: { id: req.params.id },
    include: { places: { take: 50 } },
  });
  if (!city) return res.status(404).json({ success: false, message: "City not found." });
  res.json({ success: true, city });
}

// GET /api/cities/:id/weather — proxies Open-Meteo (free, no key required)
export async function getCityWeather(req: Request, res: Response) {
  const city = await prisma.city.findUnique({ where: { id: req.params.id } });
  if (!city) return res.status(404).json({ success: false, message: "City not found." });

  if (!city.latitude || !city.longitude) {
    return res.status(422).json({ success: false, message: "City has no coordinates." });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`;
    const weatherRes = await fetch(url);
    if (!weatherRes.ok) throw new Error(`Open-Meteo returned ${weatherRes.status}`);
    const data = await weatherRes.json() as any;
    res.json({ success: true, cityName: city.name, weather: data.current_weather ?? null });
  } catch (err) {
    res.status(502).json({ success: false, message: "Could not fetch weather data." });
  }
}
