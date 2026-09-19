import { Request, Response, NextFunction } from "express";
import { AIService } from "../services/ai.service";
import { recordAudit } from "../middleware/audit";

export class AIController {
  static async getExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = (req.query.role as string) || user.role;
      const result = await AIService.getRoleExecutiveSummary(role, user);
      await recordAudit(req, "AI_SUMMARY_GENERATED", "AI", undefined, { role, title: result.title });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt, conversationId } = req.body;
      if (!prompt) {
        res.status(400).json({ success: false, message: "Prompt is required." });
        return;
      }

      const result = await AIService.handleChat(prompt, req.user!, conversationId);
      await recordAudit(req, "AI_QUERY", "AI", undefined, { prompt: prompt.substring(0, 80), toolUsed: result.toolUsed });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
