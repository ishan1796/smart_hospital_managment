import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";

export const recordAudit = async (
  req: Request,
  action: string,
  entity: string,
  entityId?: string,
  details?: any
) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || null,
        userEmail: req.user?.email || "anonymous",
        userRole: req.user?.role || "GUEST",
        action,
        entity,
        entityId: entityId || null,
        ipAddress: String(ipAddress),
        details: details ? (typeof details === "string" ? details : JSON.stringify(details)) : null,
      },
    });
  } catch (err) {
    console.error("Audit logging error:", err);
  }
};
