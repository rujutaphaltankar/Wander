import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import placeRoutes from "./place.routes";
import itineraryRoutes from "./itinerary.routes";
import budgetRoutes from "./budget.routes";
import favoriteRoutes from "./favorite.routes";
import chatRoutes from "./chat.routes";
import adminRoutes from "./admin.routes";
import cityRoutes from "./city.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, message: "Wander API is running." }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/places", placeRoutes);
router.use("/cities", cityRoutes);
router.use("/itineraries", itineraryRoutes);
router.use("/budgets", budgetRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/chat", chatRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

export default router;
