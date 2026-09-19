import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", AppointmentController.getAll);
router.post("/", AppointmentController.create);
router.patch("/:id/status", AppointmentController.updateStatus);

export default router;
