import { Request, Response, NextFunction } from "express";
import { HrmsService } from "../services/hrms.service";
import { recordAudit } from "../middleware/audit";

export class HrmsController {
  static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const employees = await HrmsService.getEmployees(req.query.departmentId as string);
      res.json({ success: true, employees });
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HrmsService.createEmployee(req.body);
      await recordAudit(req, "CREATE_EMPLOYEE", "EMPLOYEE", result.employee.id, {
        role: req.body.role,
        departmentId: req.body.departmentId,
      });
      res.status(201).json({ success: true, employee: result.employee, user: result.user });
    } catch (err) {
      next(err);
    }
  }

  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await HrmsService.getDepartments();
      res.json({ success: true, departments });
    } catch (err) {
      next(err);
    }
  }

  static async recordAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await HrmsService.recordAttendance(req.body);
      res.json({ success: true, attendance });
    } catch (err) {
      next(err);
    }
  }

  static async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await HrmsService.getAttendance(req.query.date as string);
      res.json({ success: true, attendance });
    } catch (err) {
      next(err);
    }
  }

  static async applyLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const leave = await HrmsService.applyLeave(req.body, req.user!);
      await recordAudit(req, "APPLY_LEAVE", "LEAVE_REQUEST", leave.id);
      res.status(201).json({ success: true, leaveRequest: leave });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequests = await HrmsService.getLeaveRequests(req.user!);
      res.json({ success: true, leaveRequests });
    } catch (err) {
      next(err);
    }
  }

  static async updateLeaveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const leave = await HrmsService.updateLeaveStatus(
        id,
        req.body.status,
        req.body.remarks,
        req.user!
      );
      await recordAudit(req, "UPDATE_LEAVE_STATUS", "LEAVE_REQUEST", id, { status: req.body.status });
      res.json({ success: true, leaveRequest: leave });
    } catch (err) {
      next(err);
    }
  }

  static async generatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const month = parseInt(req.body.month, 10) || new Date().getMonth() + 1;
      const year = parseInt(req.body.year, 10) || new Date().getFullYear();
      const records = await HrmsService.generatePayroll(month, year);
      await recordAudit(req, "GENERATE_PAYROLL", "PAYROLL", `${month}-${year}`);
      res.json({ success: true, payrollRecords: records });
    } catch (err) {
      next(err);
    }
  }

  static async getPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const records = await HrmsService.getPayroll(month, year);
      res.json({ success: true, payrollRecords: records });
    } catch (err) {
      next(err);
    }
  }
}
