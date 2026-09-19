import { Request, Response, NextFunction } from "express";
import { FinanceService } from "../services/finance.service";
import { recordAudit } from "../middleware/audit";

export class FinanceController {
  static async getCharges(req: Request, res: Response, next: NextFunction) {
    try {
      const charges = await FinanceService.getPendingCharges(req.query.patientId as string);
      res.json({ success: true, charges });
    } catch (err) {
      next(err);
    }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const invoices = await FinanceService.getInvoices(req.user!, req.query.patientId as string);
      res.json({ success: true, invoices });
    } catch (err) {
      next(err);
    }
  }

  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FinanceService.createInvoiceFromCharges(req.body, req.user!);
      await recordAudit(req, "CREATE", "INVOICE", invoice.id, { amount: invoice.finalAmount });
      res.status(201).json({ success: true, invoice });
    } catch (err) {
      next(err);
    }
  }

  static async applyDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await FinanceService.applyDiscount(req.body, req.user!);
      await recordAudit(req, "APPLY_DISCOUNT", "INVOICE", invoice.id, { discountAmount: invoice.discountAmount });
      res.json({ success: true, invoice });
    } catch (err) {
      next(err);
    }
  }

  static async finalizeInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const invoice = await FinanceService.finalizeInvoice(id, req.user!);
      await recordAudit(req, "FINALIZE", "INVOICE", id);
      res.json({ success: true, invoice });
    } catch (err) {
      next(err);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await FinanceService.recordPayment(req.body, req.user!);
      await recordAudit(req, "RECORD_PAYMENT", "PAYMENT", payment.id, { amount: payment.amount });
      res.status(201).json({ success: true, payment });
    } catch (err) {
      next(err);
    }
  }
}
