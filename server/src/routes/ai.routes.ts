import { Router } from "express";
import { AIController } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.post("/chat", AIController.chat);

export default router;
