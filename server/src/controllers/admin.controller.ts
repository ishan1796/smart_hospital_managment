import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service";
import { recordAudit } from "../middleware/audit";

export class AdminController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboardMetrics();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AdminService.getUsers();
      res.json({ success: true, users });
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.createUser(req.body);
      await recordAudit(req, "CREATE", "USER", user.id, { email: user.email, role: user.role });
      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await AdminService.toggleUserStatus(id);
      await recordAudit(req, "TOGGLE_STATUS", "USER", user.id, { isActive: user.isActive });
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await AdminService.getAuditLogs(limit, req.query.action as string, req.query.entity as string);
      res.json({ success: true, auditLogs: logs });
    } catch (err) {
      next(err);
    }
  }
}
