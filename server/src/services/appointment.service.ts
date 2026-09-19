import { prisma } from "../config/db";
import { ApiError } from "../middleware/errorHandler";
import { AuthUser } from "../types/auth";

export class AppointmentService {
  static async getAll(user: AuthUser, query: { doctorId?: string; date?: string; status?: string }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);
      where.appointmentDate = { gte: start, lte: end };
    }

    if (user.role === "PATIENT") {
      if (!user.patientId) throw new ApiError(404, "Patient profile not found");
      where.patientId = user.patientId;
    } else if (user.role === "DOCTOR") {
      if (user.doctorId) where.doctorId = user.doctorId;
    } else if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, uhid: true, firstName: true, lastName: true, phone: true, gender: true, dob: true } },
        doctor: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            department: true,
          },
        },
        department: true,
        encounter: { select: { id: true, status: true } },
      },
      orderBy: [{ appointmentDate: "asc" }, { tokenNumber: "asc" }],
    });
  }

  static async create(data: {
    patientId?: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
    type?: string;
  }, user: AuthUser) {
    const patientId = user.role === "PATIENT" ? user.patientId : data.patientId;
    if (!patientId) {
      throw new ApiError(400, "Patient ID is required.");
    }

    const date = new Date(data.appointmentDate);
    date.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const doctor = await prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { department: true },
    });

    if (!doctor) throw new ApiError(404, "Doctor not found");

    // Token generation for the day
    const countForDay = await prisma.appointment.count({
      where: {
        doctorId: data.doctorId,
        appointmentDate: { gte: date, lte: endOfDay },
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId || doctor.departmentId,
        appointmentDate: new Date(data.appointmentDate),
        timeSlot: data.timeSlot,
        reason: data.reason,
        type: data.type || "OPD",
        tokenNumber: countForDay + 1,
        status: "SCHEDULED",
      },
      include: {
        patient: true,
        doctor: { include: { employee: { include: { user: true } } } },
        department: true,
      },
    });

    return appointment;
  }

  static async updateStatus(id: string, status: string, user: AuthUser) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) throw new ApiError(404, "Appointment not found");

    if (user.role === "PATIENT" && status !== "CANCELLED") {
      throw new ApiError(403, "Patients can only cancel their appointments.");
    }

    return prisma.appointment.update({
      where: { id },
      data: { status },
      include: { patient: true, doctor: true },
    });
  }
}
