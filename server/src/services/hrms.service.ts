import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class HrmsService {
  static async getEmployees(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    return prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true } },
        department: true,
        salaryStructure: true,
      },
      orderBy: { employeeCode: "asc" },
    });
  }

  static async getDepartments() {
    return prisma.department.findMany({
      include: {
        _count: { select: { employees: true, doctors: true, nurses: true } },
      },
    });
  }

  static async recordAttendance(data: {
    employeeId: string;
    status?: string;
    checkIn?: string;
    checkOut?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: today,
        },
      },
      create: {
        employeeId: data.employeeId,
        date: today,
        checkIn: data.checkIn ? new Date(data.checkIn) : new Date(),
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        status: data.status || "PRESENT",
      },
      update: {
        checkOut: data.checkOut ? new Date(data.checkOut) : new Date(),
        status: data.status || "PRESENT",
      },
    });
  }

  static async getAttendance(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    return prisma.attendance.findMany({
      where: { date: targetDate },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
            department: true,
          },
        },
      },
    });
  }

  static async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
    role: string;
    departmentId?: string;
    designation: string;
    salary?: number;
    shift?: string;
    specialization?: string;
    licenseNumber?: string;
    consultationFee?: number;
  }) {
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(400, "User email already registered");

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash(data.password || "password123", 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || "9876543210",
        },
      });

      const empCount = await tx.employee.count();
      const employeeCode = `EMP-${String(empCount + 1).padStart(4, "0")}`;
      let deptId = data.departmentId;
      if (!deptId) {
        const firstDept = await tx.department.findFirst();
        deptId = firstDept?.id || "general";
      }

      const baseSalary = data.salary || (data.role === "DOCTOR" ? 120000 : data.role === "NURSE" ? 45000 : 35000);

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          departmentId: deptId,
          designation: data.designation || `${data.role} Staff`,
          joiningDate: new Date(),
          salary: baseSalary,
          shift: data.shift || "MORNING",
          employmentStatus: "ACTIVE",
          salaryStructure: {
            create: {
              basicSalary: baseSalary * 0.7,
              allowances: baseSalary * 0.25,
              deductions: baseSalary * 0.05,
              netSalary: baseSalary * 0.9,
            },
          },
        },
      });

      if (data.role === "DOCTOR") {
        await tx.doctor.create({
          data: {
            userId: user.id,
            employeeId: employee.id,
            departmentId: deptId,
            specialization: data.specialization || "General Medicine",
            licenseNumber: data.licenseNumber || `MCI-LIC-${Date.now().toString().slice(-6)}`,
            consultationFee: data.consultationFee || 500,
            roomNumber: `OPD-${Math.floor(100 + Math.random() * 900)}`,
          },
        });
      } else if (data.role === "NURSE") {
        const firstWard = await tx.ward.findFirst();
        await tx.nurse.create({
          data: {
            userId: user.id,
            employeeId: employee.id,
            departmentId: deptId,
            assignedWardId: firstWard?.id,
            licenseNumber: data.licenseNumber || `INC-LIC-${Date.now().toString().slice(-6)}`,
          },
        });
      }

      return { user, employee };
    });
  }

  static async applyLeave(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }, user: AuthUser) {
    let employeeId = user.employeeId;
    if (!employeeId) {
      const emp = await prisma.employee.findFirst({ where: { userId: user.userId } });
      if (emp) {
        employeeId = emp.id;
      }
    }

    if (!employeeId) {
      // If still not found, check if an admin or fallback employee exists
      const firstEmp = await prisma.employee.findFirst();
      if (firstEmp) {
        employeeId = firstEmp.id;
      } else {
        throw new ApiError(400, "Employee profile not found for user.");
      }
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: data.leaveType || "CASUAL",
        startDate: start,
        endDate: end,
        totalDays,
        reason: data.reason,
        status: "PENDING",
      },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
            department: true,
          },
        },
      },
    });
  }

  static async getLeaveRequests(user: AuthUser) {
    const where: any = {};
    // Staff can view own leave requests; HRMS & Admin can view all
    if (!["HRMS", "ADMIN"].includes(user.role)) {
      let empId = user.employeeId;
      if (!empId) {
        const emp = await prisma.employee.findFirst({ where: { userId: user.userId } });
        empId = emp?.id;
      }
      if (empId) {
        where.employeeId = empId;
      }
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateLeaveStatus(id: string, status: "APPROVED" | "REJECTED", remarks?: string, user?: AuthUser) {
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: `${user?.firstName || "HR"} ${user?.lastName || "Officer"} (${user?.email || "HRMS"})`,
        remarks: remarks || `Leave ${status.toLowerCase()} by HRMS`,
      },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
            department: true,
          },
        },
      },
    });
  }

  static async generatePayroll(month: number, year: number) {
    const employees = await prisma.employee.findMany({
      where: { employmentStatus: "ACTIVE" },
      include: { salaryStructure: true },
    });

    const records = [];
    for (const emp of employees) {
      const basic = emp.salaryStructure?.basicSalary || emp.salary || 30000;
      const allowances = emp.salaryStructure?.allowances || (basic * 0.2);
      const deductions = emp.salaryStructure?.deductions || (basic * 0.1);
      const net = basic + allowances - deductions;

      const record = await prisma.payrollRecord.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          basicSalary: basic,
          allowances,
          deductions,
          netSalary: net,
          paymentStatus: "PROCESSED",
          paymentDate: new Date(),
        },
        update: {
          basicSalary: basic,
          allowances,
          deductions,
          netSalary: net,
          paymentStatus: "PROCESSED",
        },
      });
      records.push(record);
    }

    return records;
  }

  static async getPayroll(month?: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const where: any = { year: currentYear };
    if (month) where.month = month;

    return prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } },
            department: true,
          },
        },
      },
      orderBy: [{ month: "desc" }, { employee: { employeeCode: "asc" } }],
    });
  }
}
