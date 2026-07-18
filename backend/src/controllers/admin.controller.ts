import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function getStats(_req: Request, res: Response) {
  const [userCount, tripCount, placeCount, reviewCount] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.place.count(),
    prisma.review.count(),
  ]);
  res.json({ success: true, stats: { userCount, tripCount, placeCount, reviewCount } });
}

export async function listUsers(req: Request, res: Response) {
  const { page = "1", pageSize = "20" } = req.query as Record<string, string>;
  const take = Number(pageSize);
  const skip = (Number(page) - 1) * take;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.user.count(),
  ]);

  res.json({ success: true, users, total, page: Number(page), pageSize: take });
}

export async function setUserRole(req: Request, res: Response) {
  const { role } = req.body as { role: "USER" | "ADMIN" };
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ success: true, user: { id: user.id, role: user.role } });
}

export async function deleteUser(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "User removed." });
}

export async function listReviewsForModeration(req: Request, res: Response) {
  const reviews = await prisma.review.findMany({
    include: { user: { select: { name: true, email: true } }, place: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ success: true, reviews });
}

export async function moderateReview(req: Request, res: Response) {
  const { isApproved } = req.body as { isApproved: boolean };
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved } });
  res.json({ success: true, review });
}
