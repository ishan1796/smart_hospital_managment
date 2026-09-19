import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class LabService {
  static async getTests() {
    return prisma.labTest.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
    });
  }

  static async getOrders(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.labOrder.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        doctor: { include: { employee: { include: { user: true } }, department: true } },
        items: { include: { labTest: true } },
        samples: true,
        results: { include: { labTest: true } },
      },
      orderBy: { orderDate: "desc" },
    });
  }

  static async collectSample(orderId: string, sampleType: string, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiError(404, "Lab order not found");

      const barcode = `BAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const sample = await tx.labSample.create({
        data: {
          labOrderId: orderId,
          sampleType,
          barcode,
          collectedBy: user.email,
          status: "COLLECTED",
        },
      });

      await tx.labOrder.update({
        where: { id: orderId },
        data: { status: "SAMPLE_COLLECTED" },
      });

      return sample;
    });
  }

  static async enterResults(orderId: string, results: Array<{
    labTestId: string;
    resultValue: string;
    normalRange?: string;
    unit?: string;
    isAbnormal?: boolean;
    remarks?: string;
  }>, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { labTest: true } } },
      });

      if (!order) throw new ApiError(404, "Lab order not found");

      // Save each result
      for (const res of results) {
        await tx.labResult.create({
          data: {
            labOrderId: orderId,
            labTestId: res.labTestId,
            resultValue: res.resultValue,
            normalRange: res.normalRange,
            unit: res.unit,
            isAbnormal: res.isAbnormal || false,
            remarks: res.remarks,
            verifiedBy: user.email,
          },
        });
      }

      // Mark order COMPLETED
      await tx.labOrder.update({
        where: { id: orderId },
        data: { status: "COMPLETED" },
      });

      // Calculate total test charges
      const totalCost = order.items.reduce((sum, item) => sum + item.price, 0);

      // Create Charge in Finance module
      await tx.charge.create({
        data: {
          patientId: order.patientId,
          sourceModule: "LAB",
          sourceId: order.id,
          serviceName: `Laboratory Tests - Order ${order.orderNumber}`,
          quantity: order.items.length,
          unitPrice: totalCost,
          totalAmount: totalCost,
          status: "PENDING",
        },
      });

      // Create a MedicalReport entry
      await tx.medicalReport.create({
        data: {
          patientId: order.patientId,
          doctorId: order.doctorId,
          title: `Diagnostic Lab Report - ${order.orderNumber}`,
          type: "LAB",
          content: JSON.stringify(results),
        },
      });

      return order;
    });
  }
}
