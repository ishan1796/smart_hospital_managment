import { Request, Response, NextFunction } from "express";
import { PatientService } from "../services/patient.service";
import { recordAudit } from "../middleware/audit";

export class PatientController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const limit = parseInt((req.query.limit as string) || "50", 10);
      const offset = parseInt((req.query.offset as string) || "0", 10);
      const result = await PatientService.getAll(req.user!, search, limit, offset);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const patient = await PatientService.getById(id, req.user!);
      await recordAudit(req, "VIEW_SENSITIVE", "PATIENT", id);
      res.json({ success: true, patient });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await PatientService.create(req.body);
      await recordAudit(req, "CREATE", "PATIENT", patient.id, { uhid: patient.uhid });
      res.status(201).json({ success: true, patient });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const patient = await PatientService.update(id, req.body, req.user!);
      await recordAudit(req, "UPDATE", "PATIENT", id);
      res.json({ success: true, patient });
    } catch (err) {
      next(err);
    }
  }
}
