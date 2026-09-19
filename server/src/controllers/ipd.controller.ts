import { Request, Response, NextFunction } from "express";
import { IpdService } from "../services/ipd.service";
import { recordAudit } from "../middleware/audit";

export class IpdController {
  static async getWards(req: Request, res: Response, next: NextFunction) {
    try {
      const wards = await IpdService.getWards();
      res.json({ success: true, wards });
    } catch (err) {
      next(err);
    }
  }

  static async getBeds(req: Request, res: Response, next: NextFunction) {
    try {
      const beds = await IpdService.getBeds(req.query.wardId as string, req.query.status as string);
      res.json({ success: true, beds });
    } catch (err) {
      next(err);
    }
  }

  static async admit(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await IpdService.admitPatient(req.body, req.user!);
      await recordAudit(req, "ADMIT", "PATIENT", req.body.patientId, { bedId: req.body.bedId });
      res.status(201).json({ success: true, admission });
    } catch (err) {
      next(err);
    }
  }

  static async discharge(req: Request, res: Response, next: NextFunction) {
    try {
      const discharge = await IpdService.dischargePatient(req.body, req.user!);
      await recordAudit(req, "DISCHARGE", "PATIENT", discharge.patientId, { admissionId: req.body.admissionId });
      res.json({ success: true, discharge });
    } catch (err) {
      next(err);
    }
  }
}
