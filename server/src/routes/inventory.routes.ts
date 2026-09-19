import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth);

router.get("/items", InventoryController.getItems);
router.post("/stock/add", requireRole("ADMIN", "PHARMACY", "LAB", "MESS"), InventoryController.addStock);
router.post("/stock/issue", requireRole("ADMIN", "PHARMACY", "LAB", "MESS"), InventoryController.issueStock);

router.get("/oxygen", InventoryController.getOxygen);
router.patch("/oxygen/:id", requireRole("ADMIN", "NURSE"), InventoryController.updateOxygen);

export default router;
