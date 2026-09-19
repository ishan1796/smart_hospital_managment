import { Request, Response, NextFunction } from "express";
import { AppointmentService } from "../services/appointment.service";
import { recordAudit } from "../middleware/audit";

export class AppointmentController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const appointments = await AppointmentService.getAll(req.user!, {
        doctorId: req.query.doctorId as string,
        date: req.query.date as string,
        status: req.query.status as string,
      });
      res.json({ success: true, appointments });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await AppointmentService.create(req.body, req.user!);
      await recordAudit(req, "CREATE", "APPOINTMENT", appointment.id, { token: appointment.tokenNumber });
      res.status(201).json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const appointment = await AppointmentService.updateStatus(id, req.body.status, req.user!);
      await recordAudit(req, "UPDATE_STATUS", "APPOINTMENT", id, { status: req.body.status });
      res.json({ success: true, appointment });
    } catch (err) {
      next(err);
    }
  }
}
