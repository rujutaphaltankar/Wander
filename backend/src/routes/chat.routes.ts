import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { chatMessageSchema } from "../validation/schemas";

const router = Router();

router.post("/", requireAuth, validate(chatMessageSchema), chatController.sendMessage);

export default router;
