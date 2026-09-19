import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { AuthUser, JwtPayload } from "../types/auth";
import { prisma } from "../config/db";

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication required. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient: { select: { id: true } },
        employee: {
          select: {
            id: true,
            doctor: { select: { id: true } },
            nurse: { select: { id: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: "User account is inactive or not found." });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      firstName: user.firstName,
      lastName: user.lastName,
      patientId: user.patient?.id,
      employeeId: user.employee?.id,
      doctorId: user.employee?.doctor?.id,
      nurseId: user.employee?.nurse?.id,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
  }
};
