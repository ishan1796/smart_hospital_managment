import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class PatientService {
  static async getAll(user: AuthUser, search?: string, limit = 50, offset = 0) {
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { uhid: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Role specific visibility
    if (user.role === "PATIENT") {
      if (!user.patientId) throw new ApiError(404, "Patient profile not found");
      where.id = user.patientId;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          admissions: {
            where: { status: "ACTIVE" },
            include: { ward: true, bed: true },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    // Apply limited view for Pharmacy, Lab, Finance, Mess if needed
    if (["PHARMACY", "LAB", "FINANCE", "MESS"].includes(user.role)) {
      return {
        total,
        patients: patients.map((p) => ({
          id: p.id,
          uhid: p.uhid,
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender,
          phone: p.phone,
          bloodGroup: p.bloodGroup,
          activeAdmission: p.admissions[0]
            ? {
                wardName: p.admissions[0].ward.name,
                bedNumber: p.admissions[0].bed.bedNumber,
              }
            : null,
        })),
      };
    }

    return { total, patients };
  }

  static async getById(patientId: string, user: AuthUser) {
    if (user.role === "PATIENT" && user.patientId !== patientId) {
      throw new ApiError(403, "Unauthorized: You can only access your own profile.");
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          include: { doctor: { include: { employee: { include: { user: true } }, department: true } } },
          orderBy: { appointmentDate: "desc" },
          take: 10,
        },
        encounters: {
          include: {
            doctor: { include: { employee: { include: { user: true } } } },
            diagnoses: true,
            prescriptions: { include: { items: true } },
          },
          orderBy: { encounterDate: "desc" },
          take: 10,
        },
        prescriptions: {
          include: {
            doctor: { include: { employee: { include: { user: true } } } },
            items: true,
          },
          orderBy: { date: "desc" },
        },
        vitals: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
        admissions: {
          include: {
            ward: true,
            bed: true,
            doctor: { include: { employee: { include: { user: true } } } },
            dischargeRecord: true,
          },
          orderBy: { admissionDate: "desc" },
        },
        labOrders: {
          include: {
            items: true,
            results: true,
            doctor: { include: { employee: { include: { user: true } } } },
          },
          orderBy: { orderDate: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        dietPlans: {
          where: { status: "ACTIVE" },
          include: { fulfillments: true },
        },
      },
    });

    if (!patient) throw new ApiError(404, "Patient not found");
    return patient;
  }

  static async create(data: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    bloodGroup?: string;
    phone: string;
    email?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    allergies?: string;
    medicalHistory?: string;
  }) {
    const count = await prisma.patient.count();
    const uhid = `UHID-${String(count + 1).padStart(5, "0")}`;

    return prisma.patient.create({
      data: {
        uhid,
        firstName: data.firstName,
        lastName: data.lastName,
        dob: new Date(data.dob),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        allergies: data.allergies,
        medicalHistory: data.medicalHistory,
      },
    });
  }

  static async update(id: string, data: any, user: AuthUser) {
    if (user.role === "PATIENT" && user.patientId !== id) {
      throw new ApiError(403, "You can only update your own profile.");
    }

    return prisma.patient.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        allergies: data.allergies,
        medicalHistory: data.medicalHistory,
      },
    });
  }
}
