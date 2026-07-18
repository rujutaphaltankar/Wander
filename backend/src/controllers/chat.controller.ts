import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { chatWithAssistant } from "../services/ai.service";

export async function sendMessage(req: AuthedRequest, res: Response) {
  const { message, cityName } = req.body;
  const reply = await chatWithAssistant(message, cityName);
  res.json({ success: true, reply });
}
