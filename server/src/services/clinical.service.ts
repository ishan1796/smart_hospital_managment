import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class ClinicalService {
  static async createEncounter(data: {
    appointmentId?: string;
    patientId: string;
    doctorId: string;
    symptoms: string;
    notes?: string;
    vitalsSummary?: string;
    diagnoses?: Array<{ icdCode?: string; diagnosisName: string; type?: string; notes?: string }>;
    prescriptions?: {
      instructions?: string;
      items: Array<{
        medicineId?: string;
        medicineName: string;
        dosage: string;
        frequency: string;
        durationDays: number;
        quantity: number;
        route?: string;
        instructions?: string;
      }>;
    };
    labOrders?: Array<{ labTestId: string; testName: string; price: number }>;
  }, user: AuthUser) {
    const doctorId = user.role === "DOCTOR" ? user.doctorId! : data.doctorId;
    if (!doctorId) throw new ApiError(400, "Doctor ID is required");

    return prisma.$transaction(async (tx) => {
      // 1. Create Encounter
      const encounter = await tx.encounter.create({
        data: {
          appointmentId: data.appointmentId || null,
          patientId: data.patientId,
          doctorId,
          symptoms: data.symptoms,
          notes: data.notes,
          vitalsSummary: data.vitalsSummary,
          status: "COMPLETED",
        },
      });

      // Update appointment status if linked
      if (data.appointmentId) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      // 2. Create Diagnoses
      if (data.diagnoses && data.diagnoses.length > 0) {
        for (const diag of data.diagnoses) {
          await tx.diagnosis.create({
            data: {
              encounterId: encounter.id,
              patientId: data.patientId,
              doctorId,
              icdCode: diag.icdCode,
              diagnosisName: diag.diagnosisName,
              type: diag.type || "FINAL",
              notes: diag.notes,
            },
          });
        }
      }

      // 3. Create Prescription & Prescription Items
      let createdRx = null;
      if (data.prescriptions && data.prescriptions.items?.length > 0) {
        createdRx = await tx.prescription.create({
          data: {
            encounterId: encounter.id,
            patientId: data.patientId,
            doctorId,
            instructions: data.prescriptions.instructions,
            status: "PENDING",
            items: {
              create: data.prescriptions.items.map((item) => ({
                medicineId: item.medicineId || null,
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                durationDays: item.durationDays,
                quantity: item.quantity,
                route: item.route || "ORAL",
                instructions: item.instructions,
              })),
            },
          },
          include: { items: true },
        });
      }

      // 4. Create Lab Order if requested
      if (data.labOrders && data.labOrders.length > 0) {
        const orderCount = await tx.labOrder.count();
        const orderNumber = `LAB-${String(orderCount + 1).padStart(5, "0")}`;

        await tx.labOrder.create({
          data: {
            orderNumber,
            patientId: data.patientId,
            doctorId,
            encounterId: encounter.id,
            status: "ORDERED",
            clinicalNotes: data.symptoms,
            items: {
              create: data.labOrders.map((item) => ({
                labTestId: item.labTestId,
                testName: item.testName,
                price: item.price,
              })),
            },
          },
        });
      }

      // 5. Generate OPD Consultation Charge
      const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
      const fee = doctor?.consultationFee || 500;

      await tx.charge.create({
        data: {
          patientId: data.patientId,
          sourceModule: "OPD",
          sourceId: encounter.id,
          serviceName: `OPD Consultation - Dr. ${user.lastName || "Specialist"}`,
          quantity: 1,
          unitPrice: fee,
          totalAmount: fee,
          status: "PENDING",
        },
      });

      return encounter;
    });
  }

  static async getPatientHistory(patientId: string, user: AuthUser) {
    if (user.role === "PATIENT" && user.patientId !== patientId) {
      throw new ApiError(403, "Access denied to other patients' records");
    }

    const [encounters, diagnoses, prescriptions, reports, labOrders] = await Promise.all([
      prisma.encounter.findMany({
        where: { patientId },
        include: {
          doctor: { include: { employee: { include: { user: true } }, department: true } },
          diagnoses: true,
          prescriptions: { include: { items: true } },
        },
        orderBy: { encounterDate: "desc" },
      }),
      prisma.diagnosis.findMany({
        where: { patientId },
        include: { doctor: { include: { employee: { include: { user: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: {
          doctor: { include: { employee: { include: { user: true } } } },
          items: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.medicalReport.findMany({
        where: { patientId },
        include: { doctor: { include: { employee: { include: { user: true } } } } },
        orderBy: { reportDate: "desc" },
      }),
      prisma.labOrder.findMany({
        where: { patientId },
        include: {
          doctor: { include: { employee: { include: { user: true } } } },
          items: true,
          results: true,
        },
        orderBy: { orderDate: "desc" },
      }),
    ]);

    return { encounters, diagnoses, prescriptions, reports, labOrders };
  }

  static async getEncounters(user: AuthUser) {
    const where: any = {};
    if (user.role === "DOCTOR" && user.doctorId) {
      where.doctorId = user.doctorId;
    }

    return prisma.encounter.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { employee: { include: { user: true } }, department: true } },
        diagnoses: true,
        prescriptions: { include: { items: true } },
      },
      orderBy: { encounterDate: "desc" },
    });
  }
}
