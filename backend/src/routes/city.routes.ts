import { Router } from "express";
import * as cityController from "../controllers/city.controller";

const router = Router();

router.get("/", cityController.listCities);
router.get("/:id/weather", cityController.getCityWeather);
router.get("/:id", cityController.getCity);

export default router;
