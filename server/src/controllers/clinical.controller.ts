import { Request, Response, NextFunction } from "express";
import { ClinicalService } from "../services/clinical.service";
import { recordAudit } from "../middleware/audit";

export class ClinicalController {
  static async createEncounter(req: Request, res: Response, next: NextFunction) {
    try {
      const encounter = await ClinicalService.createEncounter(req.body, req.user!);
      await recordAudit(req, "CREATE", "ENCOUNTER", encounter.id, { patientId: req.body.patientId });
      res.status(201).json({ success: true, encounter });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.params.patientId as string;
      const history = await ClinicalService.getPatientHistory(patientId, req.user!);
      res.json({ success: true, history });
    } catch (err) {
      next(err);
    }
  }

  static async getEncounters(req: Request, res: Response, next: NextFunction) {
    try {
      const encounters = await ClinicalService.getEncounters(req.user!);
      res.json({ success: true, encounters });
    } catch (err) {
      next(err);
    }
  }
}
