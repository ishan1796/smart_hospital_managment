import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class FinanceService {
  static async getPendingCharges(patientId?: string) {
    const where: any = { status: "PENDING" };
    if (patientId) where.patientId = patientId;

    return prisma.charge.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getInvoices(user: AuthUser, patientId?: string) {
    const where: any = {};
    if (user.role === "PATIENT") {
      where.patientId = user.patientId;
    } else if (patientId) {
      where.patientId = patientId;
    }

    return prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true } },
        items: true,
        discounts: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createInvoiceFromCharges(data: {
    patientId: string;
    chargeIds: string[];
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const charges = await tx.charge.findMany({
        where: {
          id: { in: data.chargeIds },
          patientId: data.patientId,
          status: "PENDING",
        },
      });

      if (charges.length === 0) {
        throw new ApiError(400, "No valid pending charges selected for this patient.");
      }

      const subtotal = charges.reduce((sum, c) => sum + c.totalAmount, 0);
      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          patientId: data.patientId,
          subtotal,
          discountAmount: 0,
          discountPercent: 0,
          taxAmount: 0,
          finalAmount: subtotal,
          paidAmount: 0,
          balanceAmount: subtotal,
          status: "DRAFT",
          notes: data.notes,
        },
      });

      // Create invoice items & mark charges as INVOICED
      for (const charge of charges) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            chargeId: charge.id,
            description: charge.serviceName,
            quantity: charge.quantity,
            unitPrice: charge.unitPrice,
            amount: charge.totalAmount,
          },
        });

        await tx.charge.update({
          where: { id: charge.id },
          data: { status: "INVOICED" },
        });
      }

      return invoice;
    });
  }

  static async applyDiscount(data: {
    invoiceId: string;
    discountType: "PERCENTAGE" | "FLAT";
    value: number;
    reason: string;
  }, user: AuthUser) {
    if (!["FINANCE", "ADMIN"].includes(user.role)) {
      throw new ApiError(403, "Permission Denied: Only Finance or Admin can apply billing discounts.");
    }

    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (["PAID", "CANCELLED"].includes(invoice.status)) {
        throw new ApiError(400, `Cannot apply discount to invoice in ${invoice.status} status.`);
      }

      let discountAmount = 0;
      let discountPercent = 0;

      if (data.discountType === "PERCENTAGE") {
        discountPercent = Math.min(100, Math.max(0, data.value));
        discountAmount = (invoice.subtotal * discountPercent) / 100;
      } else {
        discountAmount = Math.min(invoice.subtotal, Math.max(0, data.value));
        discountPercent = (discountAmount / invoice.subtotal) * 100;
      }

      const finalAmount = Math.max(0, invoice.subtotal - discountAmount);
      const balanceAmount = Math.max(0, finalAmount - invoice.paidAmount);

      // Save discount record
      await tx.discount.create({
        data: {
          invoiceId: invoice.id,
          discountType: data.discountType,
          value: data.value,
          discountAmount,
          reason: data.reason,
          approvedBy: user.email,
        },
      });

      // Update invoice
      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          discountAmount,
          discountPercent,
          finalAmount,
          balanceAmount,
          status: balanceAmount === 0 && invoice.paidAmount > 0 ? "PAID" : "FINALIZED",
          finalizedBy: user.email,
          finalizedAt: new Date(),
        },
        include: { items: true, discounts: true, payments: true },
      });
    });
  }

  static async finalizeInvoice(invoiceId: string, user: AuthUser) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new ApiError(404, "Invoice not found");

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "FINALIZED",
        finalizedBy: user.email,
        finalizedAt: new Date(),
      },
    });
  }

  static async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    notes?: string;
  }, user: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) throw new ApiError(404, "Invoice not found");
      if (invoice.status === "PAID") {
        throw new ApiError(400, "Invoice is already fully paid.");
      }

      if (data.amount <= 0) {
        throw new ApiError(400, "Payment amount must be greater than zero.");
      }

      const paymentCount = await tx.payment.count();
      const receiptNumber = `RCP-${String(paymentCount + 1).padStart(5, "0")}`;

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          amount: data.amount,
          paymentMethod: data.paymentMethod || "CASH",
          transactionRef: data.transactionRef,
          recordedBy: user.email,
          notes: data.notes,
        },
      });

      const newPaidAmount = invoice.paidAmount + data.amount;
      const newBalanceAmount = Math.max(0, invoice.finalAmount - newPaidAmount);
      const newStatus = newBalanceAmount === 0 ? "PAID" : "PARTIALLY_PAID";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      });

      return payment;
    });
  }
}
