import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class IpdService {
  static async getWards() {
    return prisma.ward.findMany({
      include: {
        rooms: true,
        beds: {
          include: {
            admissions: {
              where: { status: "ACTIVE" },
              include: { patient: true, doctor: { include: { employee: { include: { user: true } } } } },
            },
          },
        },
      },
    });
  }

  static async getBeds(wardId?: string, status?: string) {
    const where: any = {};
    if (wardId) where.wardId = wardId;
    if (status) where.status = status;

    return prisma.bed.findMany({
      where,
      include: {
        ward: true,
        room: true,
        admissions: {
          where: { status: "ACTIVE" },
          include: {
            patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
            doctor: { include: { employee: { include: { user: true } } } },
          },
        },
      },
      orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
    });
  }

  static async admitPatient(data: {
    patientId: string;
    doctorId: string;
    wardId: string;
    bedId: string;
    reason: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      // 1. Check bed availability
      const bed = await tx.bed.findUnique({
        where: { id: data.bedId },
      });

      if (!bed) throw new ApiError(404, "Bed not found");
      if (bed.status !== "AVAILABLE") {
        throw new ApiError(400, `Bed ${bed.bedNumber} is not available (Current status: ${bed.status}). Cannot double-book.`);
      }

      // 2. Check if patient already has an active admission
      const existingAdmission = await tx.admission.findFirst({
        where: { patientId: data.patientId, status: "ACTIVE" },
      });
      if (existingAdmission) {
        throw new ApiError(400, "Patient is already admitted to an active bed.");
      }

      const count = await tx.admission.count();
      const admissionNumber = `ADM-${String(count + 1).padStart(5, "0")}`;

      // 3. Create Admission
      const admission = await tx.admission.create({
        data: {
          admissionNumber,
          patientId: data.patientId,
          doctorId: data.doctorId,
          wardId: data.wardId,
          bedId: data.bedId,
          reason: data.reason,
          status: "ACTIVE",
        },
      });

      // 4. Create Bed Assignment
      await tx.bedAssignment.create({
        data: {
          admissionId: admission.id,
          bedId: data.bedId,
        },
      });

      // 5. Update Bed status to OCCUPIED
      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: "OCCUPIED" },
      });

      return admission;
    });
  }

  static async dischargePatient(data: {
    admissionId: string;
    finalDiagnosis: string;
    conditionAtDischarge?: string;
    dischargeType?: string;
    instructions?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findUnique({
        where: { id: data.admissionId },
        include: { bed: true },
      });

      if (!admission) throw new ApiError(404, "Admission record not found");
      if (admission.status !== "ACTIVE") {
        throw new ApiError(400, "Patient is not currently actively admitted.");
      }

      const dischargeDate = new Date();

      // 1. Update Admission status
      await tx.admission.update({
        where: { id: admission.id },
        data: {
          status: "DISCHARGED",
          dischargeDate,
          dischargeSummary: data.instructions || data.finalDiagnosis,
        },
      });

      // 2. Release Bed Assignment & Bed
      await tx.bedAssignment.updateMany({
        where: { admissionId: admission.id, releasedAt: null },
        data: { releasedAt: dischargeDate },
      });

      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: "AVAILABLE" },
      });

      // 3. Create Discharge record
      const discharge = await tx.discharge.create({
        data: {
          admissionId: admission.id,
          patientId: admission.patientId,
          dischargeDate,
          finalDiagnosis: data.finalDiagnosis,
          conditionAtDischarge: data.conditionAtDischarge || "STABLE",
          dischargeType: data.dischargeType || "REGULAR",
          instructions: data.instructions,
        },
      });

      // 4. Calculate Bed stay days and generate Bed Charge
      const stayDays = Math.max(
        1,
        Math.ceil((dischargeDate.getTime() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const bedRate = admission.bed.dailyRate || 1000;
      const totalBedCharge = stayDays * bedRate;

      await tx.charge.create({
        data: {
          patientId: admission.patientId,
          sourceModule: "IPD",
          sourceId: admission.id,
          serviceName: `IPD Bed Stay (${stayDays} days @ ₹${bedRate}/day - Bed ${admission.bed.bedNumber})`,
          quantity: stayDays,
          unitPrice: bedRate,
          totalAmount: totalBedCharge,
          status: "PENDING",
        },
      });

      return discharge;
    });
  }
}
