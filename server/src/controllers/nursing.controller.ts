import { Request, Response, NextFunction } from "express";
import { NursingService } from "../services/nursing.service";
import { recordAudit } from "../middleware/audit";

export class NursingController {
  static async recordVitals(req: Request, res: Response, next: NextFunction) {
    try {
      const vitals = await NursingService.recordVitals(req.body, req.user!);
      await recordAudit(req, "CREATE", "VITALS", vitals.id, { patientId: req.body.patientId });
      res.status(201).json({ success: true, vitals });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientVitals(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = (req.params.patientId || req.query.patientId) as string;
      const vitals = await NursingService.getPatientVitals(patientId, req.user!);
      res.json({ success: true, vitals });
    } catch (err) {
      next(err);
    }
  }

  static async addNursingNote(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await NursingService.addNursingNote(req.body, req.user!);
      await recordAudit(req, "CREATE", "NURSING_NOTE", note.id, { patientId: req.body.patientId });
      res.status(201).json({ success: true, note });
    } catch (err) {
      next(err);
    }
  }

  static async getNursingNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = (req.params.patientId || req.query.patientId) as string;
      const notes = await NursingService.getNursingNotes(patientId);
      res.json({ success: true, notes });
    } catch (err) {
      next(err);
    }
  }

  static async recordMedicationAdministration(req: Request, res: Response, next: NextFunction) {
    try {
      const med = await NursingService.recordMedicationAdministration(req.body, req.user!);
      await recordAudit(req, "RECORD_ADMINISTRATION", "MEDICATION", med.id, { medicineName: req.body.medicineName });
      res.status(201).json({ success: true, medicationAdministration: med });
    } catch (err) {
      next(err);
    }
  }

  static async getMedicationSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await NursingService.getMedicationSchedule(req.query.patientId as string);
      res.json({ success: true, schedule });
    } catch (err) {
      next(err);
    }
  }
}
