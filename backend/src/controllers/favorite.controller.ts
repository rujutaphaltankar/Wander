import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth";

export async function listFavorites(req: AuthedRequest, res: Response) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: { place: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, favorites });
}

export async function addFavorite(req: AuthedRequest, res: Response) {
  const { placeId } = req.body;
  const favorite = await prisma.favorite.upsert({
    where: { userId_placeId: { userId: req.user!.id, placeId } },
    update: {},
    create: { userId: req.user!.id, placeId },
  });
  res.status(201).json({ success: true, favorite });
}

export async function removeFavorite(req: AuthedRequest, res: Response) {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.id, placeId: req.params.placeId },
  });
  res.json({ success: true, message: "Removed from favorites." });
}
