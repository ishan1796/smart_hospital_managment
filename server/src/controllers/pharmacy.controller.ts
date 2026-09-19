import { Request, Response, NextFunction } from "express";
import { PharmacyService } from "../services/pharmacy.service";
import { recordAudit } from "../middleware/audit";

export class PharmacyController {
  static async getPrescriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const prescriptions = await PharmacyService.getPrescriptions(status);
      res.json({ success: true, prescriptions });
    } catch (err) {
      next(err);
    }
  }

  static async getMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const medicines = await PharmacyService.getMedicines(search);
      res.json({ success: true, medicines });
    } catch (err) {
      next(err);
    }
  }

  static async dispense(req: Request, res: Response, next: NextFunction) {
    try {
      const dispensing = await PharmacyService.dispensePrescription(req.body, req.user!);
      await recordAudit(req, "DISPENSE", "PHARMACY", dispensing.id, {
        prescriptionId: req.body.prescriptionId,
        amount: dispensing.totalAmount,
      });
      res.status(201).json({ success: true, dispensing });
    } catch (err) {
      next(err);
    }
  }
}
