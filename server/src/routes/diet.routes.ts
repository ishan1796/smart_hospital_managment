import { Router } from "express";
import { DietController } from "../controllers/diet.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.post("/plan", requireRole("ADMIN", "DOCTOR", "NURSE"), DietController.createPlan);
router.get("/plans", requireRole("ADMIN", "DOCTOR", "NURSE", "MESS"), DietController.getPlans);
router.get("/admitted-patients", requireRole("ADMIN", "DOCTOR", "NURSE"), DietController.getAdmittedPatients);
router.get("/fulfillments", requireRole("ADMIN", "MESS", "DOCTOR", "NURSE"), DietController.getFulfillments);
router.patch("/fulfillments/:id/status", requireRole("ADMIN", "MESS"), DietController.updateStatus);

export default router;
