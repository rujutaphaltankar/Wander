import { Response } from "express";
import { prisma } from "../config/db";
import { AuthedRequest } from "../middleware/auth";
import { NotFoundError } from "../utils/AppError";

export async function getMyBudgets(req: AuthedRequest, res: Response) {
  const budgets = await prisma.budget.findMany({
    where: { userId: req.user!.id },
    include: { trip: { include: { city: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, budgets });
}

export async function getBudget(req: AuthedRequest, res: Response) {
  const budget = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!budget) throw new NotFoundError("That budget doesn't exist.");
  res.json({ success: true, budget });
}

export async function updateBudget(req: AuthedRequest, res: Response) {
  const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) throw new NotFoundError("That budget doesn't exist.");

  const budget = await prisma.budget.update({
    where: { id: existing.id },
    data: req.body,
  });
  res.json({ success: true, budget });
}

export async function createStandaloneBudget(req: AuthedRequest, res: Response) {
  const { totalInr } = req.body;
  const budget = await prisma.budget.create({
    data: { userId: req.user!.id, totalInr: totalInr ?? 0 },
  });
  res.status(201).json({ success: true, budget });
}
