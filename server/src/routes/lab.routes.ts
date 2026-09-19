import { Router } from "express";
import { LabController } from "../controllers/lab.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/tests", LabController.getTests);
router.get("/orders", LabController.getOrders);
router.post("/orders/:id/sample", requireRole("ADMIN", "LAB"), LabController.collectSample);
router.post("/orders/:id/results", requireRole("ADMIN", "LAB"), LabController.enterResults);

export default router;
