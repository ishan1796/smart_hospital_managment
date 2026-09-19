import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/me", requireAuth, AuthController.getMe);

export default router;
