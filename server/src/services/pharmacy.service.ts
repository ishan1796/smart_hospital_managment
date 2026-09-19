import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class PharmacyService {
  static async getPrescriptions(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.prescription.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        doctor: { include: { employee: { include: { user: true } }, department: true } },
        items: { include: { medicine: true } },
        dispensings: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getMedicines(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { category: { contains: search } },
      ];
    }

    return prisma.medicine.findMany({
      where,
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async dispensePrescription(data: {
    prescriptionId: string;
    items: Array<{
      medicineId: string;
      batchId?: string;
      quantity: number;
    }>;
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.findUnique({
        where: { id: data.prescriptionId },
        include: { items: true, patient: true },
      });

      if (!rx) throw new ApiError(404, "Prescription not found");
      if (rx.status === "DISPENSED") throw new ApiError(400, "Prescription has already been dispensed.");

      let totalAmount = 0;
      const dispensingCount = await tx.pharmacyDispensing.count();
      const dispensingNumber = `DSP-${String(dispensingCount + 1).padStart(5, "0")}`;

      const dispensing = await tx.pharmacyDispensing.create({
        data: {
          dispensingNumber,
          prescriptionId: rx.id,
          patientId: rx.patientId,
          pharmacistId: user.userId,
          status: "COMPLETED",
          notes: data.notes,
          totalAmount: 0, // will update below
        },
      });

      for (const item of data.items) {
        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
          include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expiryDate: "asc" } } },
        });

        if (!medicine) throw new ApiError(404, `Medicine ID ${item.medicineId} not found`);
        if (medicine.stockQuantity < item.quantity) {
          throw new ApiError(400, `Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}, Requested: ${item.quantity}`);
        }

        const unitPrice = medicine.unitPrice;
        const lineTotal = unitPrice * item.quantity;
        totalAmount += lineTotal;

        // Decrement stock from selected batch or FIFO batches
        let remainingToDeduct = item.quantity;
        if (item.batchId) {
          await tx.medicineBatch.update({
            where: { id: item.batchId },
            data: { quantity: { decrement: item.quantity } },
          });
        } else {
          for (const batch of medicine.batches) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(batch.quantity, remainingToDeduct);
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: { quantity: { decrement: deduct } },
            });
            remainingToDeduct -= deduct;
          }
        }

        // Decrement master medicine stock
        await tx.medicine.update({
          where: { id: medicine.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        // Create dispensing item
        await tx.pharmacyDispensingItem.create({
          data: {
            dispensingId: dispensing.id,
            medicineId: medicine.id,
            batchId: item.batchId || null,
            quantity: item.quantity,
            unitPrice,
            totalPrice: lineTotal,
          },
        });
      }

      // Update dispensing total
      await tx.pharmacyDispensing.update({
        where: { id: dispensing.id },
        data: { totalAmount },
      });

      // Mark prescription as dispensed
      await tx.prescription.update({
        where: { id: rx.id },
        data: { status: "DISPENSED" },
      });

      // Automatically create a Charge in Finance module
      await tx.charge.create({
        data: {
          patientId: rx.patientId,
          sourceModule: "PHARMACY",
          sourceId: dispensing.id,
          serviceName: `Pharmacy Dispense - Ref ${dispensingNumber}`,
          quantity: 1,
          unitPrice: totalAmount,
          totalAmount: totalAmount,
          status: "PENDING",
        },
      });

      return dispensing;
    });
  }
}
