import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/metrics", AdminController.getMetrics);
router.get("/users", AdminController.getUsers);
router.post("/users", AdminController.createUser);
router.patch("/users/:id/toggle", AdminController.toggleUserStatus);
router.get("/audit-logs", AdminController.getAuditLogs);

export default router;
