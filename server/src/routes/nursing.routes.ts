import { Router } from "express";
import { NursingController } from "../controllers/nursing.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.post("/vitals", requireRole("ADMIN", "NURSE"), NursingController.recordVitals);
router.get("/vitals", NursingController.getPatientVitals);
router.get("/vitals/:patientId", NursingController.getPatientVitals);

router.post("/notes", requireRole("ADMIN", "NURSE"), NursingController.addNursingNote);
router.get("/notes", NursingController.getNursingNotes);
router.get("/notes/:patientId", NursingController.getNursingNotes);

router.post("/medications", requireRole("ADMIN", "NURSE"), NursingController.recordMedicationAdministration);
router.get("/medications", NursingController.getMedicationSchedule);

export default router;
