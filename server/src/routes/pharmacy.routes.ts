import { Router } from "express";
import { PharmacyController } from "../controllers/pharmacy.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/prescriptions", PharmacyController.getPrescriptions);
router.get("/medicines", PharmacyController.getMedicines);
router.post("/dispense", requireRole("ADMIN", "PHARMACY"), PharmacyController.dispense);

export default router;
