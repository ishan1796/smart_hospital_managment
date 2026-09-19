import { Router } from "express";
import { ClinicalController } from "../controllers/clinical.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.post("/encounters", requireRole("ADMIN", "DOCTOR"), ClinicalController.createEncounter);
router.get("/encounters", requireRole("ADMIN", "DOCTOR", "NURSE"), ClinicalController.getEncounters);
router.get("/history/:patientId", ClinicalController.getPatientHistory);

export default router;
