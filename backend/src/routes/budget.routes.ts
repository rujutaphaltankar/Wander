import { Router } from "express";
import * as budgetController from "../controllers/budget.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateBudgetSchema } from "../validation/schemas";

const router = Router();

router.use(requireAuth);
router.get("/", budgetController.getMyBudgets);
router.post("/", budgetController.createStandaloneBudget);
router.get("/:id", budgetController.getBudget);
router.patch("/:id", validate(updateBudgetSchema), budgetController.updateBudget);

export default router;
