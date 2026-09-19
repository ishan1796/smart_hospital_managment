import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { config } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser, JwtPayload, UserRole } from "../types/auth";

export class AuthService {
  static async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        patient: { select: { id: true, uhid: true } },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: { select: { id: true, name: true } },
            doctor: { select: { id: true, specialization: true } },
            nurse: { select: { id: true, assignedWardId: true } },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Account is disabled. Please contact administrator.");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      patientId: user.patient?.id,
      employeeId: user.employee?.id,
      doctorId: user.employee?.doctor?.id,
      nurseId: user.employee?.nurse?.id,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        ...payload,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  static async registerPatient(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dob: string;
    gender: string;
    bloodGroup?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ApiError(400, "Email address already in use");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const count = await prisma.patient.count();
    const uhid = `UHID-${String(count + 1).padStart(5, "0")}`;

    const newUser = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: "PATIENT",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        patient: {
          create: {
            uhid,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: new Date(data.dob),
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            phone: data.phone,
            email: data.email.toLowerCase().trim(),
            address: data.address,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
          },
        },
      },
      include: {
        patient: true,
      },
    });

    const payload: JwtPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: "PATIENT",
      patientId: newUser.patient?.id,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return {
      token,
      user: {
        ...payload,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    };
  }

  static async getMe(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            uhid: true,
            dob: true,
            gender: true,
            bloodGroup: true,
            address: true,
            allergies: true,
            emergencyContact: true,
          },
        },
        employee: {
          include: {
            department: true,
            doctor: true,
            nurse: {
              include: { assignedWard: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }
}
