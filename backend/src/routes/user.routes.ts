import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validation/schemas";

const router = Router();

router.use(requireAuth);
router.get("/me", userController.getProfile);
router.patch("/me", validate(updateProfileSchema), userController.updateProfile);
router.get("/me/history", userController.getTravelHistory);

export default router;
