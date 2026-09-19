import { Router } from "express";
import authRoutes from "./auth.routes";
import patientRoutes from "./patient.routes";
import appointmentRoutes from "./appointment.routes";
import clinicalRoutes from "./clinical.routes";
import nursingRoutes from "./nursing.routes";
import pharmacyRoutes from "./pharmacy.routes";
import inventoryRoutes from "./inventory.routes";
import ipdRoutes from "./ipd.routes";
import labRoutes from "./lab.routes";
import dietRoutes from "./diet.routes";
import financeRoutes from "./finance.routes";
import hrmsRoutes from "./hrms.routes";
import adminRoutes from "./admin.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/clinical", clinicalRoutes);
router.use("/nursing", nursingRoutes);
router.use("/pharmacy", pharmacyRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/ipd", ipdRoutes);
router.use("/lab", labRoutes);
router.use("/diet", dietRoutes);
router.use("/finance", financeRoutes);
router.use("/hrms", hrmsRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Hospital Management & Operations API",
    version: "1.0.0",
  });
});

export default router;
