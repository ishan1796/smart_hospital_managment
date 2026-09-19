import { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service";
import { recordAudit } from "../middleware/audit";

export class InventoryController {
  static async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string;
      const lowStock = req.query.lowStock === "true";
      const items = await InventoryService.getItems(category, lowStock);
      res.json({ success: true, items });
    } catch (err) {
      next(err);
    }
  }

  static async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await InventoryService.addStock(req.body, req.user!);
      await recordAudit(req, "ADD_STOCK", "INVENTORY", item.id, { quantity: req.body.quantity });
      res.json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }

  static async issueStock(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await InventoryService.issueStock(req.body, req.user!);
      await recordAudit(req, "ISSUE_STOCK", "INVENTORY", item.id, { quantity: req.body.quantity });
      res.json({ success: true, item });
    } catch (err) {
      next(err);
    }
  }

  static async getOxygen(req: Request, res: Response, next: NextFunction) {
    try {
      const cylinders = await InventoryService.getOxygenCylinders(req.query.status as string);
      res.json({ success: true, cylinders });
    } catch (err) {
      next(err);
    }
  }

  static async updateOxygen(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const cyl = await InventoryService.updateOxygenStatus(id, req.body, req.user!);
      await recordAudit(req, "UPDATE_STATUS", "OXYGEN_CYLINDER", cyl.id, { status: req.body.status });
      res.json({ success: true, cylinder: cyl });
    } catch (err) {
      next(err);
    }
  }
}
