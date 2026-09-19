import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class NursingService {
  static async recordVitals(data: {
    patientId: string;
    bloodPressure: string;
    temperature: number;
    pulseRate: number;
    spo2: number;
    respiratoryRate?: number;
    weight?: number;
    notes?: string;
  }, user: AuthUser) {
    let nurseId = user.nurseId;
    if (!nurseId) {
      const defaultNurse = await prisma.nurse.findFirst();
      nurseId = defaultNurse?.id;
    }

    return prisma.vital.create({
      data: {
        patientId: data.patientId,
        nurseId: nurseId || null,
        bloodPressure: data.bloodPressure,
        temperature: data.temperature,
        pulseRate: data.pulseRate,
        spo2: data.spo2,
        respiratoryRate: data.respiratoryRate,
        weight: data.weight,
        notes: data.notes,
      },
    });
  }

  static async getPatientVitals(patientId?: string, user?: AuthUser) {
    const where: any = {};
    if (patientId) {
      if (user && user.role === "PATIENT" && user.patientId !== patientId) {
        throw new ApiError(403, "Forbidden");
      }
      where.patientId = patientId;
    }

    return prisma.vital.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        nurse: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { recordedAt: "desc" },
    });
  }

  static async addNursingNote(data: {
    patientId: string;
    noteType?: string;
    content: string;
  }, user: AuthUser) {
    let nurseId = user.nurseId;
    if (!nurseId) {
      const defaultNurse = await prisma.nurse.findFirst();
      nurseId = defaultNurse?.id || "fallback-nurse";
    }

    return prisma.nursingNote.create({
      data: {
        patientId: data.patientId,
        nurseId: nurseId!,
        noteType: data.noteType || "GENERAL",
        content: data.content,
      },
    });
  }

  static async getNursingNotes(patientId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;

    return prisma.nursingNote.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        nurse: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { recordedAt: "desc" },
    });
  }

  static async recordMedicationAdministration(data: {
    patientId: string;
    prescriptionItemId?: string;
    medicineName: string;
    dosage: string;
    status?: string;
    remarks?: string;
  }, user: AuthUser) {
    let nurseId = user.nurseId;
    if (!nurseId) {
      const defaultNurse = await prisma.nurse.findFirst();
      nurseId = defaultNurse?.id || "fallback-nurse";
    }

    return prisma.medicationAdministration.create({
      data: {
        patientId: data.patientId,
        nurseId: nurseId!,
        prescriptionItemId: data.prescriptionItemId || null,
        medicineName: data.medicineName,
        dosage: data.dosage,
        status: data.status || "GIVEN",
        remarks: data.remarks,
      },
    });
  }

  static async getMedicationSchedule(patientId?: string) {
    const where: any = {};
    if (patientId) where.patientId = patientId;

    return prisma.medicationAdministration.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        nurse: { include: { employee: { include: { user: true } } } },
      },
      orderBy: { administeredAt: "desc" },
    });
  }
}
