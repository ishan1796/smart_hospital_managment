import { Request, Response, NextFunction } from "express";
import { DietService } from "../services/diet.service";
import { recordAudit } from "../middleware/audit";

export class DietController {
  static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await DietService.createDietPlan(req.body, req.user!);
      await recordAudit(req, "CREATE_DIET_PLAN", "DIET_PLAN", plan.id, {
        patientId: req.body.patientId,
        dietType: req.body.dietType,
      });
      res.status(201).json({ success: true, dietPlan: plan });
    } catch (err) {
      next(err);
    }
  }

  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const dietPlans = await DietService.getDietPlans();
      res.json({ success: true, dietPlans });
    } catch (err) {
      next(err);
    }
  }

  static async getAdmittedPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const admissions = await DietService.getAdmittedPatientsForDiet();
      res.json({ success: true, admissions });
    } catch (err) {
      next(err);
    }
  }

  static async getFulfillments(req: Request, res: Response, next: NextFunction) {
    try {
      const fulfillments = await DietService.getMessFulfillments(
        req.query.mealDate as string,
        req.query.status as string
      );
      res.json({ success: true, fulfillments });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await DietService.updateFulfillmentStatus(
        id,
        req.body.status,
        req.user!
      );
      await recordAudit(req, "UPDATE_STATUS", "MEAL_FULFILLMENT", id, { status: req.body.status });
      res.json({ success: true, fulfillment: updated });
    } catch (err) {
      next(err);
    }
  }
}
