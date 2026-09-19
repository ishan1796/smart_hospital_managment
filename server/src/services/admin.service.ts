import { prisma } from "../config/db";
import bcrypt from "bcryptjs";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class AdminService {
  static async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalPatients,
      todayAppointments,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      pendingLabOrders,
      lowStockItems,
      todayPayments,
      allPayments,
      chargesByModule,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: { appointmentDate: { gte: today, lte: endOfDay } },
      }),
      prisma.admission.count({ where: { status: "ACTIVE" } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.labOrder.count({ where: { status: { in: ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING"] } } }),
      prisma.inventoryItem.count({
        where: { currentStock: { lte: 20 } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: today, lte: endOfDay } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.charge.groupBy({
        by: ["sourceModule"],
        _sum: { totalAmount: true },
      }),
    ]);

    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // 7-day appointment trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const count = await prisma.appointment.count({
        where: { appointmentDate: { gte: d, lte: dEnd } },
      });

      last7Days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toISOString().split("T")[0],
        appointments: count,
      });
    }

    return {
      kpis: {
        totalPatients,
        todayAppointments,
        activeAdmissions,
        totalBeds,
        occupiedBeds,
        bedOccupancyRate,
        pendingLabOrders,
        lowStockItems,
        todayRevenue: todayPayments._sum.amount || 0,
        totalRevenue: allPayments._sum.amount || 0,
      },
      charts: {
        revenueByModule: chargesByModule.map((c) => ({
          module: c.sourceModule,
          revenue: c._sum.totalAmount || 0,
        })),
        appointmentTrends: last7Days,
        bedDistribution: [
          { name: "Occupied", value: occupiedBeds, color: "#ef4444" },
          { name: "Available", value: Math.max(0, totalBeds - occupiedBeds), color: "#10b981" },
        ],
      },
    };
  }

  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        employee: { select: { employeeCode: true, designation: true, department: { select: { name: true } } } },
        patient: { select: { uhid: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createUser(data: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    phone?: string;
    departmentId?: string;
    designation?: string;
    specialization?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (existing) throw new ApiError(400, "User email already exists");

    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      });

      if (["DOCTOR", "NURSE", "PHARMACY", "LAB", "FINANCE", "HRMS", "MESS"].includes(data.role)) {
        const empCount = await tx.employee.count();
        const employeeCode = `EMP-${String(empCount + 1).padStart(4, "0")}`;
        const deptId = data.departmentId || (await tx.department.findFirst())?.id || "general";

        const emp = await tx.employee.create({
          data: {
            userId: user.id,
            employeeCode,
            departmentId: deptId,
            designation: data.designation || `${data.role} Staff`,
            joiningDate: new Date(),
            salary: 45000,
          },
        });

        if (data.role === "DOCTOR") {
          await tx.doctor.create({
            data: {
              userId: user.id,
              employeeId: emp.id,
              departmentId: deptId,
              specialization: data.specialization || "General Medicine",
              licenseNumber: `DOC-LIC-${Date.now()}`,
              consultationFee: 500,
            },
          });
        } else if (data.role === "NURSE") {
          await tx.nurse.create({
            data: {
              userId: user.id,
              employeeId: emp.id,
              departmentId: deptId,
              licenseNumber: `NUR-LIC-${Date.now()}`,
            },
          });
        }
      }

      return user;
    });
  }

  static async toggleUserStatus(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  static async getAuditLogs(limit = 100, action?: string, entity?: string) {
    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

    return prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
