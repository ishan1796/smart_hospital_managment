import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/charges", FinanceController.getCharges);
router.get("/invoices", FinanceController.getInvoices);
router.post("/invoices", requireRole("ADMIN", "FINANCE"), FinanceController.createInvoice);
router.post("/invoices/discount", requireRole("ADMIN", "FINANCE"), FinanceController.applyDiscount);
router.patch("/invoices/:id/finalize", requireRole("ADMIN", "FINANCE"), FinanceController.finalizeInvoice);
router.post("/payments", requireRole("ADMIN", "FINANCE", "PATIENT"), FinanceController.recordPayment);

export default router;
