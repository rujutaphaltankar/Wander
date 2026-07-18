import { Router } from "express";
import * as favoriteController from "../controllers/favorite.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { addFavoriteSchema } from "../validation/schemas";

const router = Router();

router.use(requireAuth);
router.get("/", favoriteController.listFavorites);
router.post("/", validate(addFavoriteSchema), favoriteController.addFavorite);
router.delete("/:placeId", favoriteController.removeFavorite);

export default router;
