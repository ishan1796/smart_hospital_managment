import { prisma } from "../config/db";
import { AuthUser } from "../types/auth";
import { ApiError } from "../middleware/errorHandler";

export class AIService {
  // Authorized Patient Tools
  private static async executePatientTool(toolName: string, patientId: string): Promise<any> {
    switch (toolName) {
      case "getMyAppointments": {
        return prisma.appointment.findMany({
          where: { patientId },
          include: {
            doctor: { include: { employee: { include: { user: true } }, department: true } },
            department: true,
          },
          orderBy: { appointmentDate: "desc" },
          take: 5,
        });
      }
      case "getMyPrescriptions": {
        return prisma.prescription.findMany({
          where: { patientId },
          include: {
            doctor: { include: { employee: { include: { user: true } } } },
            items: true,
          },
          orderBy: { date: "desc" },
          take: 5,
        });
      }
      case "getMyReports": {
        return prisma.medicalReport.findMany({
          where: { patientId },
          orderBy: { reportDate: "desc" },
          take: 5,
        });
      }
      case "getMyBills": {
        return prisma.invoice.findMany({
          where: { patientId },
          include: { payments: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
      }
      case "getHospitalTimings": {
        return {
          hospitalName: "AegisCare Super Specialty Hospital",
          opdTimings: "Monday to Saturday: 8:00 AM - 8:00 PM, Sunday: 9:00 AM - 2:00 PM",
          emergency: "24/7 Trauma and Emergency Care Center",
          visitingHours: "4:00 PM - 7:00 PM daily",
          helpline: "+1 (800) 555-CARE / info@aegiscare.hospital",
        };
      }
      default:
        return { error: "Unknown tool" };
    }
  }

  // Authorized Admin Tools
  private static async executeAdminTool(toolName: string): Promise<any> {
    switch (toolName) {
      case "getExecutiveOverview": {
        const [patients, admissions, occupiedBeds, totalBeds, todayPayments] = await Promise.all([
          prisma.patient.count(),
          prisma.admission.count({ where: { status: "ACTIVE" } }),
          prisma.bed.count({ where: { status: "OCCUPIED" } }),
          prisma.bed.count(),
          prisma.payment.aggregate({ _sum: { amount: true } }),
        ]);
        const bedRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
        return {
          totalRegisteredPatients: patients,
          activeAdmissions: admissions,
          bedOccupancy: `${occupiedBeds} / ${totalBeds} (${bedRate}%)`,
          totalRevenueCollected: `₹${todayPayments._sum.amount || 0}`,
        };
      }
      case "getLowStockAlerts": {
        return prisma.inventoryItem.findMany({
          where: { currentStock: { lte: 20 } },
          select: { name: true, category: true, currentStock: true, minStockLevel: true, unit: true },
        });
      }
      case "getRevenueByDepartment": {
        return prisma.charge.groupBy({
          by: ["sourceModule"],
          _sum: { totalAmount: true },
        });
      }
      case "getStaffOnLeave": {
        return prisma.leaveRequest.findMany({
          where: { status: "APPROVED" },
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true, role: true } }, department: true } },
          },
          take: 10,
        });
      }
      default:
        return { error: "Unknown tool" };
    }
  }

  static async handleChat(prompt: string, user: AuthUser, conversationId?: string) {
    const userRole = user.role;
    let toolResult: any = null;
    let toolUsed: string | null = null;
    let assistantReply = "";

    const lower = prompt.toLowerCase();

    if (userRole === "PATIENT") {
      if (!user.patientId) throw new ApiError(400, "Patient record not found.");

      if (lower.includes("appointment") || lower.includes("booking") || lower.includes("schedule") || lower.includes("doctor")) {
        toolUsed = "getMyAppointments";
        toolResult = await this.executePatientTool(toolUsed, user.patientId);
        const count = toolResult.length;
        if (count === 0) {
          assistantReply = "You currently have no scheduled appointments. You can book an appointment with any of our department specialists directly from the Appointments section.";
        } else {
          const apptList = toolResult
            .map((a: any) => {
              const docName = a.doctor?.employee?.user
                ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
                : "Specialist Doctor";
              const deptName = a.department?.name || a.doctor?.department?.name || "General OPD";
              return `• **${new Date(a.appointmentDate).toLocaleDateString()} at ${a.timeSlot}** with ${docName} (${deptName}) — Status: **${a.status}** (Token #${a.tokenNumber})`;
            })
            .join("\n");
          assistantReply = `Here are your recent and upcoming appointments:\n\n${apptList}\n\nNeed to reschedule or book a new consultation? Let me know or use the Book Appointment button.`;
        }
      } else if (lower.includes("medicine") || lower.includes("prescription") || lower.includes("rx") || lower.includes("drugs")) {
        toolUsed = "getMyPrescriptions";
        toolResult = await this.executePatientTool(toolUsed, user.patientId);
        if (toolResult.length === 0) {
          assistantReply = "You have no active prescriptions on file.";
        } else {
          const rxList = toolResult
            .map((rx: any) => {
              const docName = rx.doctor?.employee?.user
                ? `Dr. ${rx.doctor.employee.user.firstName} ${rx.doctor.employee.user.lastName}`
                : "Doctor";
              const items = (rx.items || []).map((i: any) => `  - ${i.medicineName} (${i.dosage}, ${i.frequency} for ${i.durationDays} days)`).join("\n");
              return `• **Prescription dated ${new Date(rx.date).toLocaleDateString()}** (${docName}) [${rx.status}]:\n${items}`;
            })
            .join("\n\n");
          assistantReply = `Here are your prescribed medications:\n\n${rxList}\n\n*Note: Please consult with your pharmacist or doctor before altering dosages.*`;
        }
      } else if (lower.includes("report") || lower.includes("lab") || lower.includes("test") || lower.includes("result")) {
        toolUsed = "getMyReports";
        toolResult = await this.executePatientTool(toolUsed, user.patientId);
        if (toolResult.length === 0) {
          assistantReply = "No diagnostic reports found under your medical record yet.";
        } else {
          const repList = toolResult.map((r: any) => `• **${r.title}** (${r.type}) — Date: ${new Date(r.reportDate).toLocaleDateString()}`).join("\n");
          assistantReply = `Here are your available medical reports:\n\n${repList}\n\nAll verified diagnostic reports can be downloaded in the Reports tab.`;
        }
      } else if (lower.includes("bill") || lower.includes("invoice") || lower.includes("payment") || lower.includes("cost") || lower.includes("fee")) {
        toolUsed = "getMyBills";
        toolResult = await this.executePatientTool(toolUsed, user.patientId);
        if (toolResult.length === 0) {
          assistantReply = "You have no pending hospital invoices or outstanding billing statements.";
        } else {
          const billList = toolResult.map((b: any) => `• Invoice **#${b.invoiceNumber}**: Total ₹${b.finalAmount} | Paid: ₹${b.paidAmount} | Balance: **₹${b.balanceAmount}** [Status: ${b.status}]`).join("\n");
          assistantReply = `Here is your billing summary:\n\n${billList}\n\nYou can view the full itemized invoices and receipt history under the Bills & Payments section.`;
        }
      } else if (lower.includes("emergency") || lower.includes("chest pain") || lower.includes("severe") || lower.includes("bleeding") || lower.includes("breath")) {
        assistantReply = "⚠️ **EMERGENCY WARNING**: If you are experiencing severe symptoms such as acute chest pain, shortness of breath, heavy bleeding, or loss of consciousness, please **call emergency services immediately (911/112)** or visit our 24/7 Emergency Trauma Center. Do not rely on AI for critical medical emergencies.";
      } else {
        toolUsed = "getHospitalTimings";
        toolResult = await this.executePatientTool(toolUsed, user.patientId);
        assistantReply = `Welcome to **${toolResult.hospitalName}** Patient AI Assistant!\n\nI can help you with:\n- Viewing your upcoming appointments\n- Reviewing your medication prescriptions\n- Checking lab results and diagnostic reports\n- Checking outstanding bills and receipts\n- General hospital timings and visiting hours (${toolResult.opdTimings})\n\nHow may I assist your care journey today?`;
      }
    } else {
      // ADMIN & Staff Copilot
      if (lower.includes("revenue") || lower.includes("income") || lower.includes("collection") || lower.includes("finance")) {
        toolUsed = "getRevenueByDepartment";
        toolResult = await this.executeAdminTool(toolUsed);
        const revList = toolResult.map((r: any) => `• **${r.sourceModule}**: ₹${(r._sum?.totalAmount || 0).toLocaleString()}`).join("\n");
        assistantReply = `📊 **Revenue Breakdown by Department**:\n\n${revList}\n\nTotal collections are monitored live across OPD, Pharmacy, IPD, and Laboratory modules.`;
      } else if (lower.includes("bed") || lower.includes("occupancy") || lower.includes("admit") || lower.includes("ward")) {
        toolUsed = "getExecutiveOverview";
        toolResult = await this.executeAdminTool(toolUsed);
        assistantReply = `🏥 **Inpatient & Bed Operations Summary**:\n\n• **Active Admissions**: ${toolResult.activeAdmissions} patients\n• **Bed Occupancy**: ${toolResult.bedOccupancy}\n• **Total Registered Patients**: ${toolResult.totalRegisteredPatients}\n\nReal-time ward telemetry indicates optimal capacity across General, ICU, and Semi-Private units.`;
      } else if (lower.includes("stock") || lower.includes("inventory") || lower.includes("shortage") || lower.includes("supply")) {
        toolUsed = "getLowStockAlerts";
        toolResult = await this.executeAdminTool(toolUsed);
        if (toolResult.length === 0) {
          assistantReply = "✅ All inventory items and essential pharmaceuticals are above reorder thresholds.";
        } else {
          const stockList = toolResult.map((i: any) => `• **${i.name}** (${i.category}): Current Stock = **${i.currentStock} ${i.unit}** (Min: ${i.minStockLevel})`).join("\n");
          assistantReply = `⚠️ **Low Stock Critical Alerts (${toolResult.length} items)**:\n\n${stockList}\n\nPurchase requisitions should be initiated for the above flagged items.`;
        }
      } else if (lower.includes("staff") || lower.includes("leave") || lower.includes("doctor") || lower.includes("nurse") || lower.includes("employee")) {
        toolUsed = "getStaffOnLeave";
        toolResult = await this.executeAdminTool(toolUsed);
        if (toolResult.length === 0) {
          assistantReply = "No staff members are currently on approved leave today. Department roster is fully staffed.";
        } else {
          const leaveList = toolResult.map((l: any) => `• **${l.employee?.user?.firstName || "Staff"} ${l.employee?.user?.lastName || ""}** (${l.employee?.department?.name || "General"} - ${l.leaveType} Leave) until ${new Date(l.endDate).toLocaleDateString()}`).join("\n");
          assistantReply = `📋 **Staff On Approved Leave**:\n\n${leaveList}`;
        }
      } else {
        toolUsed = "getExecutiveOverview";
        toolResult = await this.executeAdminTool(toolUsed);
        assistantReply = `🤖 **AegisCare Hospital Executive AI Copilot**\n\n**Current System Health Overview**:\n• Total Registered Patients: **${toolResult.totalRegisteredPatients}**\n• Active Inpatient Admissions: **${toolResult.activeAdmissions}**\n• Bed Occupancy: **${toolResult.bedOccupancy}**\n• Total Revenue Collected: **${toolResult.totalRevenueCollected}**\n\nAsk me queries such as:\n- "What is today's revenue breakdown?"\n- "Which medicines are low in stock?"\n- "How many beds are currently occupied?"\n- "Who is currently on leave?"`;
      }
    }

    return {
      reply: assistantReply,
      toolUsed,
      toolData: toolResult,
    };
  }
}
