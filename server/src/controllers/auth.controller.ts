import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { recordAudit } from "../middleware/audit";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      req.user = result.user;
      await recordAudit(req, "LOGIN", "USER", result.user.userId, { email });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerPatient(req.body);
      req.user = result.user;
      await recordAudit(req, "REGISTER", "PATIENT", result.user.patientId, { email: req.body.email });
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
}
