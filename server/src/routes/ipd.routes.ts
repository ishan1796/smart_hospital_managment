import { Router } from "express";
import { IpdController } from "../controllers/ipd.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/wards", IpdController.getWards);
router.get("/beds", IpdController.getBeds);
router.post("/admit", requireRole("ADMIN", "DOCTOR"), IpdController.admit);
router.post("/discharge", requireRole("ADMIN", "DOCTOR"), IpdController.discharge);

export default router;
