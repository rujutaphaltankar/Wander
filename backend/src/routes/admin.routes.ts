import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/stats", adminController.getStats);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.setUserRole);
router.delete("/users/:id", adminController.deleteUser);
router.get("/reviews", adminController.listReviewsForModeration);
router.patch("/reviews/:id/moderate", adminController.moderateReview);

export default router;
