import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class DietService {
  static async createDietPlan(data: {
    patientId: string;
    admissionId?: string;
    dietType: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    specialInstructions?: string;
  }, user: AuthUser) {
    let doctorId = user.doctorId;
    if (!doctorId) {
      const defaultDoc = await prisma.doctor.findFirst();
      doctorId = defaultDoc?.id || "doc-1";
    }

    // Find active admission and bed for this patient
    const admission = await prisma.admission.findFirst({
      where: {
        OR: [
          { patientId: data.patientId, status: "ACTIVE" },
          ...(data.admissionId ? [{ id: data.admissionId }] : []),
        ],
      },
      include: { bed: true },
    });

    // Deactivate previous diet plans for this patient
    await prisma.dietPlan.updateMany({
      where: { patientId: data.patientId, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    const dietPlan = await prisma.dietPlan.create({
      data: {
        patientId: data.patientId,
        admissionId: admission?.id || data.admissionId || null,
        doctorId: doctorId!,
        dietType: data.dietType || "NORMAL",
        breakfast: data.breakfast || "Standard Balanced Breakfast",
        lunch: data.lunch || "Standard Balanced Lunch",
        dinner: data.dinner || "Standard Balanced Dinner",
        specialInstructions: data.specialInstructions,
        status: "ACTIVE",
      },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true } },
        doctor: { include: { employee: { include: { user: true } } } },
        admission: { include: { bed: { include: { ward: true } } } },
      },
    });

    // Create meal fulfillments for today
    const bedNumber = admission?.bed?.bedNumber || "WARD-BED";
    const mealTypes = ["BREAKFAST", "LUNCH", "DINNER"];

    for (const meal of mealTypes) {
      await prisma.mealFulfillment.create({
        data: {
          dietPlanId: dietPlan.id,
          patientId: data.patientId,
          bedNumber,
          mealType: meal,
          status: "PENDING",
          notes: data.specialInstructions,
        },
      });
    }

    return dietPlan;
  }

  static async getDietPlans() {
    return prisma.dietPlan.findMany({
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, allergies: true, gender: true } },
        doctor: { include: { employee: { include: { user: true } }, department: true } },
        admission: { include: { bed: { include: { ward: true } } } },
        fulfillments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAdmittedPatientsForDiet() {
    return prisma.admission.findMany({
      where: { status: "ACTIVE" },
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, allergies: true, bloodGroup: true, gender: true } },
        bed: { include: { ward: true } },
        doctor: { include: { employee: { include: { user: true } } } },
        dietPlans: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { admissionDate: "desc" },
    });
  }

  // Mess module query: RESTRICTED - No diagnosis, prescriptions, or full history!
  static async getMessFulfillments(mealDate?: string, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const fulfillments = await prisma.mealFulfillment.findMany({
      where,
      include: {
        dietPlan: {
          select: {
            dietType: true,
            breakfast: true,
            lunch: true,
            dinner: true,
            specialInstructions: true,
          },
        },
      },
      orderBy: { mealDate: "desc" },
    });

    // Strip any sensitive clinical data
    return fulfillments.map((f) => ({
      id: f.id,
      patientId: f.patientId,
      bedNumber: f.bedNumber,
      mealType: f.mealType,
      dietType: f.dietPlan.dietType,
      mealItems:
        f.mealType === "BREAKFAST"
          ? f.dietPlan.breakfast
          : f.mealType === "LUNCH"
          ? f.dietPlan.lunch
          : f.dietPlan.dinner,
      specialInstructions: f.dietPlan.specialInstructions,
      status: f.status,
      preparedAt: f.preparedAt,
      deliveredAt: f.deliveredAt,
      deliveredBy: f.deliveredBy,
    }));
  }

  static async updateFulfillmentStatus(id: string, status: "PREPARED" | "DELIVERED", user: AuthUser) {
    const now = new Date();
    const data: any = { status };

    if (status === "PREPARED") {
      data.preparedAt = now;
    } else if (status === "DELIVERED") {
      data.deliveredAt = now;
      data.deliveredBy = `${user.firstName || "Kitchen"} ${user.lastName || "Staff"}`;
    }

    return prisma.mealFulfillment.update({
      where: { id },
      data,
    });
  }
}
