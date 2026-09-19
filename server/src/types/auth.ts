export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PATIENT"
  | "PHARMACY"
  | "LAB"
  | "FINANCE"
  | "HRMS"
  | "MESS";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  patientId?: string;
  employeeId?: string;
  doctorId?: string;
  nurseId?: string;
}

export interface AuthUser extends JwtPayload {
  firstName: string;
  lastName: string;
}
