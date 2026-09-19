import { prisma } from "../config/db";
import { config } from "../config/env";
import { AuthUser } from "../types/auth";
import { ApiError } from "../middleware/errorHandler";

export class AIService {
  private static async callGemini(systemInstruction: string, userPrompt: string): Promise<string> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        });

        const data = await response.json();
        if (data.error) {
          lastError = new Error(data.error.message || "Gemini API error");
          continue;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to get response from Gemini AI.");
  }

  // Real-time Database Context Extractors
  private static async getAdminContext() {
    const [
      totalPatients,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      paymentAggregate,
      deptRevenue,
      lowStockItems,
      totalStaff,
      pendingLeaves,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.admission.count({ where: { status: "ACTIVE" } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.charge.groupBy({
        by: ["sourceModule"],
        _sum: { totalAmount: true },
      }),
      prisma.inventoryItem.findMany({
        where: { currentStock: { lte: 20 } },
        select: { name: true, category: true, currentStock: true, minStockLevel: true, unit: true },
      }),
      prisma.employee.count({ where: { employmentStatus: "ACTIVE" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    ]);

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const deptRevMap = deptRevenue.reduce((acc, curr) => {
      acc[curr.sourceModule] = curr._sum.totalAmount || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      hospitalName: "AegisCare Super Specialty Hospital",
      totalRegisteredPatients: totalPatients,
      activeAdmissions,
      bedOccupancy: `${occupiedBeds} / ${totalBeds} (${occupancyRate}%)`,
      bedOccupancyPercentage: occupancyRate,
      totalRevenueCollected: paymentAggregate._sum.amount || 0,
      departmentRevenue: deptRevMap,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      activeStaffCount: totalStaff,
      pendingLeaveRequests: pendingLeaves,
    };
  }

  private static async getHrmsContext() {
    const [employees, pendingLeaves, approvedLeaves] = await Promise.all([
      prisma.employee.findMany({
        where: { employmentStatus: "ACTIVE" },
        include: {
          user: { select: { firstName: true, lastName: true, role: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        include: {
          employee: { include: { user: true, department: true } },
        },
      }),
      prisma.leaveRequest.findMany({
        where: { status: "APPROVED" },
        include: {
          employee: { include: { user: true, department: true } },
        },
      }),
    ]);

    let totalMonthlySalaryLiability = 0;
    const departmentSalaries: Record<string, { count: number; totalSalary: number }> = {};
    const roleDistribution: Record<string, number> = {};

    for (const emp of employees) {
      const salary = emp.salary || 0;
      totalMonthlySalaryLiability += salary;

      const dept = emp.department?.name || "General";
      if (!departmentSalaries[dept]) {
        departmentSalaries[dept] = { count: 0, totalSalary: 0 };
      }
      departmentSalaries[dept].count += 1;
      departmentSalaries[dept].totalSalary += salary;

      const role = emp.user?.role || "STAFF";
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    return {
      totalActiveEmployees: employees.length,
      totalMonthlySalaryLiability,
      averageMonthlySalary: employees.length > 0 ? Math.round(totalMonthlySalaryLiability / employees.length) : 0,
      departmentSalaries,
      roleDistribution,
      pendingLeaveRequestsCount: pendingLeaves.length,
      pendingLeaveRequests: pendingLeaves.map((l) => ({
        employeeName: `${l.employee.user.firstName} ${l.employee.user.lastName}`,
        role: l.employee.user.role,
        department: l.employee.department.name,
        leaveType: l.leaveType,
        days: Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 3600 * 24)) + 1,
        reason: l.reason,
      })),
      staffOnLeaveTodayCount: approvedLeaves.length,
      staffOnLeaveToday: approvedLeaves.map((l) => ({
        employeeName: `${l.employee.user.firstName} ${l.employee.user.lastName}`,
        department: l.employee.department.name,
        leaveType: l.leaveType,
        until: new Date(l.endDate).toLocaleDateString(),
      })),
    };
  }

  private static async getDoctorContext(user: AuthUser) {
    const [admissions, appointments, labOrders] = await Promise.all([
      prisma.admission.findMany({
        where: { status: "ACTIVE" },
        include: {
          patient: true,
          bed: { include: { ward: true } },
          doctor: { include: { employee: { include: { user: true } } } },
          dietPlans: { where: { status: "ACTIVE" } },
        },
      }),
      prisma.appointment.findMany({
        where: { status: { in: ["SCHEDULED", "CONFIRMED"] } },
        include: {
          patient: true,
          doctor: { include: { employee: { include: { user: true } } } },
          department: true,
        },
        orderBy: { appointmentDate: "asc" },
        take: 10,
      }),
      prisma.labOrder.findMany({
        where: { status: { in: ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING"] } },
        include: {
          patient: true,
          items: { include: { labTest: true } },
        },
        take: 10,
      }),
    ]);

    return {
      activeInpatientCount: admissions.length,
      admittedInpatients: admissions.map((a) => {
        const age = a.patient.dob ? new Date().getFullYear() - new Date(a.patient.dob).getFullYear() : "N/A";
        return {
          uhid: a.patient.uhid,
          patientName: `${a.patient.firstName} ${a.patient.lastName}`,
          age,
          gender: a.patient.gender,
          ward: a.bed?.ward?.name || "General",
          bed: a.bed?.bedNumber || "Unassigned",
          admissionDate: new Date(a.admissionDate).toLocaleDateString(),
          allergies: a.patient.allergies || "None",
          activeDietPlan: a.dietPlans[0]?.dietType || "NORMAL",
          attendingDoctor: a.doctor?.employee?.user
            ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
            : "Specialist",
        };
      }),
      upcomingAppointmentsCount: appointments.length,
      upcomingAppointments: appointments.map((appt) => ({
        token: appt.tokenNumber,
        patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
        timeSlot: appt.timeSlot,
        date: new Date(appt.appointmentDate).toLocaleDateString(),
        status: appt.status,
      })),
      pendingLabOrdersCount: labOrders.length,
      pendingLabOrders: labOrders.map((lo) => ({
        testNames: lo.items.map((i) => i.testName || i.labTest?.name).join(", "),
        patientName: `${lo.patient.firstName} ${lo.patient.lastName}`,
        status: lo.status,
        orderDate: new Date(lo.orderDate).toLocaleDateString(),
      })),
    };
  }

  private static async getFinanceContext() {
    const [invoices, payments, chargesByDept] = await Promise.all([
      prisma.invoice.findMany({
        select: {
          subtotal: true,
          discountAmount: true,
          finalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
        },
      }),
      prisma.payment.findMany({
        select: {
          amount: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      prisma.charge.groupBy({
        by: ["sourceModule"],
        _sum: { totalAmount: true },
      }),
    ]);

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstandingReceivables = 0;
    const invoiceStatusCount: Record<string, number> = {};

    for (const inv of invoices) {
      totalBilled += inv.finalAmount;
      totalCollected += inv.paidAmount;
      totalOutstandingReceivables += inv.balanceAmount;
      invoiceStatusCount[inv.status] = (invoiceStatusCount[inv.status] || 0) + 1;
    }

    const paymentMethodTotals: Record<string, number> = {};
    for (const p of payments) {
      paymentMethodTotals[p.paymentMethod] = (paymentMethodTotals[p.paymentMethod] || 0) + p.amount;
    }

    const deptRevenueMap: Record<string, number> = {};
    for (const c of chargesByDept) {
      deptRevenueMap[c.sourceModule] = c._sum.totalAmount || 0;
    }

    return {
      totalInvoicesCount: invoices.length,
      totalBilled,
      totalCollected,
      totalOutstandingReceivables,
      collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      invoiceStatusCount,
      paymentMethodTotals,
      departmentRevenue: deptRevenueMap,
    };
  }

  // Role-specific Gemini AI Executive Summary Generator
  static async getRoleExecutiveSummary(role: string, user: AuthUser) {
    let systemInstruction = "";
    let rawMetrics: any = {};
    let promptTitle = "";

    switch (role.toUpperCase()) {
      case "ADMIN": {
        rawMetrics = await this.getAdminContext();
        systemInstruction =
          "You are the Chief Hospital Operations Executive AI for AegisCare Super Specialty Hospital. Generate an authoritative, professional Executive Hospital Operations and Income Summary for the Hospital Board and Medical Director. Break down hospital income across all departments (IPD, OPD, Pharmacy, Lab), bed occupancy rates, patient throughput, low-stock inventory alerts, and actionable next-shift recommendations. Format with clean Markdown headers, summary tables, and bullet points.";
        promptTitle = "Executive Hospital Operations & Income Summary";
        break;
      }
      case "HRMS": {
        rawMetrics = await this.getHrmsContext();
        systemInstruction =
          "You are the Hospital Human Resources & Payroll Intelligence Advisor for AegisCare Super Specialty Hospital. Generate an executive Payroll & Workforce Briefing. Detail the exact total monthly salary liability to be paid (in Indian Rupees ₹), department-wise payroll allocation, active employee counts across clinical and non-clinical roles, pending leave approvals requiring HR action, and staff currently on approved leave. Format with clean Markdown headers, financial summary tables, and HR action items.";
        promptTitle = "HRMS Payroll Liability & Workforce Summary";
        break;
      }
      case "DOCTOR": {
        rawMetrics = await this.getDoctorContext(user);
        systemInstruction =
          "You are the Senior Clinical Intelligence Assistant for AegisCare Super Specialty Hospital. Generate a comprehensive Clinical & Inpatient Care Briefing for attending physicians and medical officers. Summarize the active inpatient census, high-risk patient flags (allergies, diet prescriptions), pending urgent laboratory orders, and scheduled OPD consultations. Format with clean Markdown headers, patient status tables, and clinical priority bullet points.";
        promptTitle = "Physician Clinical & Inpatient Overview";
        break;
      }
      case "FINANCE": {
        rawMetrics = await this.getFinanceContext();
        systemInstruction =
          "You are the Chief Financial Controller AI for AegisCare Super Specialty Hospital. Generate a comprehensive Financial Health, Revenue Realization, and Receivables Audit. Detail total billed revenue, collected cashflows, outstanding patient receivables, payment method breakdown (Cash, Card, UPI, Insurance), and departmental income contributions. Format with clean Markdown headers, financial summary tables, and revenue optimization recommendations.";
        promptTitle = "Financial Controller Revenue & Receivables Audit";
        break;
      }
      default: {
        rawMetrics = await this.getAdminContext();
        systemInstruction =
          "You are the Executive Hospital AI Advisor for AegisCare Super Specialty Hospital. Generate a high-level operational overview covering hospital capacity, financial performance, and clinical workflows.";
        promptTitle = "Executive Hospital Overview";
        break;
      }
    }

    const userPrompt = `Generate the ${promptTitle} based on the following real-time database telemetry:\n\n${JSON.stringify(rawMetrics, null, 2)}`;

    let aiSummary = "";
    try {
      aiSummary = await this.callGemini(systemInstruction, userPrompt);
    } catch (err: any) {
      console.warn("Gemini API call failed, generating deterministic executive summary:", err.message);
      if (role === "ADMIN") {
        aiSummary = `### 🏥 Executive Hospital Operations & Income Summary\n\n- **Total Revenue Collected**: ₹${rawMetrics.totalRevenueCollected.toLocaleString()}\n- **Bed Occupancy**: ${rawMetrics.bedOccupancy}\n- **Active Inpatient Admissions**: ${rawMetrics.activeAdmissions}\n- **Total Registered Patients**: ${rawMetrics.totalRegisteredPatients}\n- **Critical Stock Alerts**: ${rawMetrics.lowStockCount} items low in inventory.\n\n*Live system telemetry synced from AegisCare Core Operations.*`;
      } else if (role === "HRMS") {
        aiSummary = `### 👥 HRMS Payroll & Workforce Intelligence Summary\n\n- **Total Monthly Salary Liability To Be Paid**: ₹${rawMetrics.totalMonthlySalaryLiability.toLocaleString()}\n- **Total Active Staff Count**: ${rawMetrics.totalActiveEmployees} employees\n- **Average Monthly Salary**: ₹${rawMetrics.averageMonthlySalary.toLocaleString()}\n- **Pending Leave Requests Requiring Action**: ${rawMetrics.pendingLeaveRequestsCount}\n- **Staff on Approved Leave Today**: ${rawMetrics.staffOnLeaveTodayCount}`;
      } else if (role === "FINANCE") {
        aiSummary = `### 💰 Financial Audit & Revenue Realization Summary\n\n- **Total Invoiced / Billed**: ₹${rawMetrics.totalBilled.toLocaleString()}\n- **Total Revenue Collected**: ₹${rawMetrics.totalCollected.toLocaleString()} (${rawMetrics.collectionRate}% Collection Rate)\n- **Outstanding Patient Receivables**: ₹${rawMetrics.totalOutstandingReceivables.toLocaleString()}`;
      } else {
        aiSummary = `### 👨‍⚕️ Clinical Care & Inpatient Summary\n\n- **Active Inpatients Under Care**: ${rawMetrics.activeInpatientCount}\n- **Upcoming Consultations**: ${rawMetrics.upcomingAppointmentsCount}\n- **Pending Laboratory Investigations**: ${rawMetrics.pendingLabOrdersCount}`;
      }
    }

    return {
      title: promptTitle,
      summary: aiSummary,
      metrics: rawMetrics,
      generatedAt: new Date().toISOString(),
    };
  }

  // Conversational AI Chat Copilot
  static async handleChat(prompt: string, user: AuthUser, conversationId?: string) {
    const userRole = user.role;
    let roleContext: any = null;

    if (userRole === "PATIENT") {
      if (user.patientId) {
        const [appts, rxs, reports, bills] = await Promise.all([
          prisma.appointment.findMany({ where: { patientId: user.patientId }, include: { doctor: { include: { employee: { include: { user: true } } } }, department: true }, take: 5 }),
          prisma.prescription.findMany({ where: { patientId: user.patientId }, include: { items: true }, take: 5 }),
          prisma.medicalReport.findMany({ where: { patientId: user.patientId }, take: 5 }),
          prisma.invoice.findMany({ where: { patientId: user.patientId }, take: 5 }),
        ]);
        roleContext = { appointments: appts, prescriptions: rxs, reports, invoices: bills };
      }
    } else if (userRole === "HRMS") {
      roleContext = await this.getHrmsContext();
    } else if (userRole === "DOCTOR" || userRole === "NURSE") {
      roleContext = await this.getDoctorContext(user);
    } else if (userRole === "FINANCE") {
      roleContext = await this.getFinanceContext();
    } else {
      roleContext = await this.getAdminContext();
    }

    const systemInstruction = `You are AegisCare AI, the intelligent hospital assistant for AegisCare Super Specialty Hospital.
The current user is authenticated with Role: ${userRole} (Name: ${user.firstName} ${user.lastName}).
You have direct access to the real-time hospital database context provided below.
Answer user questions accurately, professionally, concisely, and supportively using the real-time context.
For medical emergency questions from patients, always include an urgent safety disclaimer advising immediate emergency care (911/112).
Format responses with clean Markdown.`;

    const userQuery = `Current Live Hospital Context:\n${JSON.stringify(roleContext, null, 2)}\n\nUser Question:\n${prompt}`;

    try {
      const geminiReply = await this.callGemini(systemInstruction, userQuery);
      return {
        reply: geminiReply,
        toolUsed: "Gemini 3.6 Flash",
        toolData: roleContext,
      };
    } catch (err: any) {
      console.warn("Fallback to local rules due to Gemini error:", err.message);
      return {
        reply: `Here is the current summary based on live hospital records:\n\n${JSON.stringify(roleContext, null, 2)}`,
        toolUsed: "Local Database Telemetry",
        toolData: roleContext,
      };
    }
  }
}
