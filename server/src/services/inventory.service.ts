import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class InventoryService {
  static async getItems(category?: string, lowStockOnly = false) {
    const where: any = {};
    if (category) where.category = category;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        batches: { orderBy: { expiryDate: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    if (lowStockOnly) {
      return items.filter((item) => item.currentStock <= item.minStockLevel);
    }

    return items;
  }

  static async addStock(data: {
    inventoryItemId: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    expiryDate?: string;
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });
      if (!item) throw new ApiError(404, "Inventory item not found");

      // Update or create batch
      await tx.inventoryBatch.upsert({
        where: {
          inventoryItemId_batchNumber: {
            inventoryItemId: data.inventoryItemId,
            batchNumber: data.batchNumber,
          },
        },
        create: {
          inventoryItemId: data.inventoryItemId,
          batchNumber: data.batchNumber,
          quantity: data.quantity,
          unitCost: data.unitCost,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        },
        update: {
          quantity: { increment: data.quantity },
          unitCost: data.unitCost,
        },
      });

      // Update item currentStock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { currentStock: { increment: data.quantity } },
      });

      // Record transaction
      await tx.stockTransaction.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          type: "PURCHASE",
          quantity: data.quantity,
          referenceType: "RESTOCK",
          performedBy: user.email,
          notes: data.notes || `Added batch ${data.batchNumber}`,
        },
      });

      return updatedItem;
    });
  }

  static async issueStock(data: {
    inventoryItemId: string;
    quantity: number;
    departmentName?: string;
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });
      if (!item) throw new ApiError(404, "Inventory item not found");
      if (item.currentStock < data.quantity) {
        throw new ApiError(400, `Insufficient stock. Current: ${item.currentStock}, Requested: ${data.quantity}`);
      }

      const updated = await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { currentStock: { decrement: data.quantity } },
      });

      await tx.stockTransaction.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          type: "ISSUE",
          quantity: data.quantity,
          referenceType: data.departmentName || "GENERAL_ISSUE",
          performedBy: user.email,
          notes: data.notes,
        },
      });

      return updated;
    });
  }

  // Oxygen cylinder management
  static async getOxygenCylinders(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return prisma.oxygenCylinder.findMany({
      where,
      include: { ward: true, logs: { orderBy: { timestamp: "desc" }, take: 5 } },
      orderBy: { cylinderCode: "asc" },
    });
  }

  static async updateOxygenStatus(id: string, data: {
    status: string;
    location?: string;
    wardId?: string;
    assignedPatientId?: string;
    pressureBar?: number;
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const cyl = await tx.oxygenCylinder.findUnique({ where: { id } });
      if (!cyl) throw new ApiError(404, "Oxygen cylinder not found");

      const updated = await tx.oxygenCylinder.update({
        where: { id },
        data: {
          status: data.status,
          currentLocation: data.location || cyl.currentLocation,
          wardId: data.wardId !== undefined ? data.wardId : cyl.wardId,
          assignedPatientId: data.assignedPatientId !== undefined ? data.assignedPatientId : cyl.assignedPatientId,
          currentPressureBar: data.pressureBar !== undefined ? data.pressureBar : cyl.currentPressureBar,
        },
      });

      await tx.oxygenLog.create({
        data: {
          cylinderId: id,
          previousStatus: cyl.status,
          newStatus: data.status,
          location: data.location || cyl.currentLocation,
          updatedBy: user.email,
          notes: data.notes,
        },
      });

      return updated;
    });
  }
}
