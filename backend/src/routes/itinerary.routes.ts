import { Router } from "express";
import * as itineraryController from "../controllers/itinerary.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { generateItinerarySchema } from "../validation/schemas";

const router = Router();

router.use(requireAuth);
router.post("/", validate(generateItinerarySchema), itineraryController.createItinerary);
router.get("/", itineraryController.listTrips);
router.get("/:id", itineraryController.getTrip);
router.delete("/:id", itineraryController.deleteTrip);

export default router;
