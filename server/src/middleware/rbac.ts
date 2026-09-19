import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/auth";
import { prisma } from "../config/db";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(", ")}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    if (req.user.role === "ADMIN") {
      return next();
    }

    const hasPerm = await prisma.rolePermission.findFirst({
      where: {
        role: req.user.role,
        permission: { code: permissionCode },
      },
    });

    if (!hasPerm) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permissionCode}].`,
      });
      return;
    }

    next();
  };
};
