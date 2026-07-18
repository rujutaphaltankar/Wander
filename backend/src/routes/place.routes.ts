import { Router } from "express";
import * as placeController from "../controllers/place.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createReviewSchema } from "../validation/schemas";

const router = Router();

router.get("/", placeController.listPlaces);
router.get("/:id", placeController.getPlace);
router.post("/:id/reviews", requireAuth, validate(createReviewSchema), placeController.createReview);

// Admin-only management
router.post("/", requireAuth, requireRole("ADMIN"), placeController.createPlace);
router.patch("/:id", requireAuth, requireRole("ADMIN"), placeController.updatePlace);
router.delete("/:id", requireAuth, requireRole("ADMIN"), placeController.deletePlace);

export default router;
