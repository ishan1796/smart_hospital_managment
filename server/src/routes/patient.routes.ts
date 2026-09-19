import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/", PatientController.getAll);
router.get("/:id", PatientController.getById);
router.post("/", requireRole("ADMIN", "DOCTOR", "NURSE"), PatientController.create);
router.put("/:id", PatientController.update);

export default router;
