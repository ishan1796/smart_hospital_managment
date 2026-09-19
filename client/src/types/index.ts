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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  patientId?: string;
  employeeId?: string;
  doctorId?: string;
  nurseId?: string;
  patient?: any;
  employee?: any;
}

export interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup?: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergies?: string;
  medicalHistory?: string;
  createdAt: string;
  admissions?: any[];
  appointments?: any[];
  encounters?: any[];
  prescriptions?: any[];
  vitals?: any[];
  labOrders?: any[];
  invoices?: any[];
}

export interface Appointment {
  id: string;
  tokenNumber: number;
  patientId: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string;
  timeSlot: string;
  status: "SCHEDULED" | "CHECKED_IN" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  type: "OPD" | "FOLLOW_UP" | "EMERGENCY";
  reason?: string;
  patient?: Patient;
  doctor?: {
    id: string;
    specialization: string;
    employee: { user: { firstName: string; lastName: string; email: string } };
    department: { id: string; name: string };
  };
  department?: { id: string; name: string };
}

export interface Encounter {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  encounterDate: string;
  symptoms: string;
  notes?: string;
  vitalsSummary?: string;
  status: string;
  diagnoses?: any[];
  prescriptions?: any[];
  doctor?: any;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  status: "PENDING" | "DISPENSED" | "CANCELLED";
  instructions?: string;
  items: Array<{
    id: string;
    medicineId?: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    route?: string;
    instructions?: string;
    isDispensed: boolean;
  }>;
  doctor?: any;
  patient?: Patient;
}

export interface Bed {
  id: string;
  wardId: string;
  bedNumber: string;
  type: string;
  dailyRate: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  ward?: { id: string; name: string; type: string; floor: number };
  admissions?: any[];
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  type: string;
  floor: number;
  capacity: number;
  beds?: Bed[];
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  form: string;
  strength: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  batches?: any[];
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  normalRange?: string;
  unit?: string;
  price: number;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  doctorId: string;
  orderDate: string;
  status: "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  clinicalNotes?: string;
  patient?: Patient;
  doctor?: any;
  items: Array<{ id: string; testName: string; price: number; labTest?: LabTest }>;
  samples?: any[];
  results?: Array<{
    id: string;
    resultValue: string;
    normalRange?: string;
    unit?: string;
    isAbnormal: boolean;
    remarks?: string;
    verifiedBy?: string;
    labTest?: LabTest;
  }>;
}

export interface Charge {
  id: string;
  patientId: string;
  sourceModule: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "PENDING" | "INVOICED" | "CANCELLED";
  createdAt: string;
  patient?: Patient;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "DRAFT" | "FINALIZED" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";
  finalizedBy?: string;
  notes?: string;
  createdAt: string;
  patient?: Patient;
  items?: any[];
  discounts?: any[];
  payments?: any[];
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  salary: number;
  employmentStatus: string;
  user?: User;
  department?: { id: string; name: string };
}

export interface MealFulfillment {
  id: string;
  patientId: string;
  bedNumber: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  dietType: string;
  mealItems?: string;
  specialInstructions?: string;
  status: "PENDING" | "PREPARED" | "DELIVERED";
  preparedAt?: string;
  deliveredAt?: string;
  deliveredBy?: string;
}
