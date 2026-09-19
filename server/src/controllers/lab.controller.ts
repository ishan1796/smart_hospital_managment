import { Request, Response, NextFunction } from "express";
import { LabService } from "../services/lab.service";
import { recordAudit } from "../middleware/audit";

export class LabController {
  static async getTests(req: Request, res: Response, next: NextFunction) {
    try {
      const tests = await LabService.getTests();
      res.json({ success: true, tests });
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await LabService.getOrders(req.query.status as string);
      res.json({ success: true, orders });
    } catch (err) {
      next(err);
    }
  }

  static async collectSample(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const sample = await LabService.collectSample(id, req.body.sampleType || "BLOOD", req.user!);
      await recordAudit(req, "COLLECT_SAMPLE", "LAB_ORDER", id, { barcode: sample.barcode });
      res.json({ success: true, sample });
    } catch (err) {
      next(err);
    }
  }

  static async enterResults(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const order = await LabService.enterResults(id, req.body.results, req.user!);
      await recordAudit(req, "ENTER_RESULTS", "LAB_ORDER", id);
      res.json({ success: true, order });
    } catch (err) {
      next(err);
    }
  }
}
