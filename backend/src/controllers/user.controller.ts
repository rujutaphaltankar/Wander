import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth";
import { NotFoundError } from "../utils/AppError";

export async function getProfile(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      trips: { orderBy: { createdAt: "desc" }, take: 5 },
      favorites: { include: { place: true } },
    },
  });
  if (!user) throw new NotFoundError("Account no longer exists.");

  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
}

export async function updateProfile(req: AuthedRequest, res: Response) {
  const { name, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { ...(name && { name }), ...(avatarUrl && { avatarUrl }) },
  });
  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
}

export async function getTravelHistory(req: AuthedRequest, res: Response) {
  const trips = await prisma.trip.findMany({
    where: { userId: req.user!.id },
    include: { city: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, trips });
}
