import { Router } from "express";
import { HrmsController } from "../controllers/hrms.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/employees", requireRole("ADMIN", "HRMS"), HrmsController.getEmployees);
router.post("/employees", requireRole("ADMIN", "HRMS"), HrmsController.createEmployee);
router.get("/departments", HrmsController.getDepartments);

router.post("/attendance", requireRole("ADMIN", "HRMS"), HrmsController.recordAttendance);
router.get("/attendance", requireRole("ADMIN", "HRMS"), HrmsController.getAttendance);

router.post("/leave", HrmsController.applyLeave);
router.get("/leave", HrmsController.getLeaveRequests);
router.patch("/leave/:id/status", requireRole("ADMIN", "HRMS"), HrmsController.updateLeaveStatus);

router.post("/payroll/generate", requireRole("ADMIN", "HRMS"), HrmsController.generatePayroll);
router.get("/payroll", requireRole("ADMIN", "HRMS", "FINANCE"), HrmsController.getPayroll);

export default router;
