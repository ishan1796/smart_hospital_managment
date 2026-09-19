const fs = require('fs');

const content = `import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hospital Management & Operations Database Seeding...");

  // 1. Clear existing tables
  await prisma.auditLog.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.mealFulfillment.deleteMany();
  await prisma.dietPlan.deleteMany();
  await prisma.oxygenLog.deleteMany();
  await prisma.oxygenCylinder.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labSample.deleteMany();
  await prisma.labOrderItem.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.pharmacyDispensingItem.deleteMany();
  await prisma.pharmacyDispensing.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalReport.deleteMany();
  await prisma.medicationAdministration.deleteMany();
  await prisma.nursingNote.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.discharge.deleteMany();
  await prisma.bedAssignment.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.service.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Departments
  console.log("Creating Departments...");
  const cardiology = await prisma.department.create({ data: { name: "Cardiology", code: "CARD", description: "Heart & Cardiovascular Care" } });
  const neurology = await prisma.department.create({ data: { name: "Neurology", code: "NEUR", description: "Brain & Nervous System" } });
  const orthopedics = await prisma.department.create({ data: { name: "Orthopedics", code: "ORTH", description: "Bones & Joints" } });
  const generalMed = await prisma.department.create({ data: { name: "General Medicine", code: "GMED", description: "Internal Healthcare" } });
  const pediatrics = await prisma.department.create({ data: { name: "Pediatrics", code: "PED", description: "Child & Infant Health" } });

  // 3. Wards & Beds
  console.log("Creating Wards & Beds...");
  const icuWard = await prisma.ward.create({ data: { name: "ICU Ward", code: "ICU-01", type: "ICU", floor: 2, capacity: 6 } });
  const genWard = await prisma.ward.create({ data: { name: "General Ward", code: "GEN-01", type: "GENERAL", floor: 1, capacity: 10 } });

  const createdBeds: any[] = [];
  for (let i = 1; i <= 6; i++) {
    const b = await prisma.bed.create({
      data: {
        wardId: icuWard.id,
        bedNumber: "ICU-B0" + i,
        type: "ICU",
        dailyRate: 3500,
        status: i === 1 ? "OCCUPIED" : "AVAILABLE"
      }
    });
    createdBeds.push(b);
  }
  for (let i = 1; i <= 8; i++) {
    const b = await prisma.bed.create({
      data: {
        wardId: genWard.id,
        bedNumber: "GEN-B0" + i,
        type: "STANDARD",
        dailyRate: 1000,
        status: "AVAILABLE"
      }
    });
    createdBeds.push(b);
  }

  // 4. Users & Employees for all 9 Roles
  console.log("Creating System Users for all 9 Roles...");

  // ADMIN
  await prisma.user.create({
    data: {
      email: "admin@hospital.com",
      passwordHash,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "SuperUser",
      phone: "+91 98765 00001"
    }
  });

  // DOCTOR 1
  const docUser1 = await prisma.user.create({
    data: {
      email: "doctor@hospital.com",
      passwordHash,
      role: "DOCTOR",
      firstName: "Rajesh",
      lastName: "Sharma",
      phone: "+91 98765 00002"
    }
  });
  const docEmp1 = await prisma.employee.create({
    data: {
      userId: docUser1.id,
      employeeCode: "EMP-0101",
      departmentId: cardiology.id,
      designation: "Senior Cardiologist",
      joiningDate: new Date("2020-01-15"),
      salary: 150000
    }
  });
  const doctor1 = await prisma.doctor.create({
    data: {
      userId: docUser1.id,
      employeeId: docEmp1.id,
      departmentId: cardiology.id,
      specialization: "Interventional Cardiology",
      licenseNumber: "MCI-CARD-88412",
      consultationFee: 800,
      roomNumber: "OPD-102"
    }
  });
  await prisma.salaryStructure.create({
    data: {
      employeeId: docEmp1.id,
      basicSalary: 100000,
      hra: 30000,
      allowances: 20000,
      deductions: 10000,
      netSalary: 140000
    }
  });

  // DOCTOR 2
  const docUser2 = await prisma.user.create({
    data: {
      email: "doc.neuro@hospital.com",
      passwordHash,
      role: "DOCTOR",
      firstName: "Anjali",
      lastName: "Menon",
      phone: "+91 98765 00003"
    }
  });
  const docEmp2 = await prisma.employee.create({
    data: {
      userId: docUser2.id,
      employeeCode: "EMP-0102",
      departmentId: neurology.id,
      designation: "Consultant Neurologist",
      joiningDate: new Date("2021-03-10"),
      salary: 140000
    }
  });
  await prisma.doctor.create({
    data: {
      userId: docUser2.id,
      employeeId: docEmp2.id,
      departmentId: neurology.id,
      specialization: "Neurology Specialist",
      licenseNumber: "MCI-NEUR-77319",
      consultationFee: 750,
      roomNumber: "OPD-105"
    }
  });

  // NURSE 1
  const nurseUser1 = await prisma.user.create({
    data: {
      email: "nurse@hospital.com",
      passwordHash,
      role: "NURSE",
      firstName: "Priya",
      lastName: "Patel",
      phone: "+91 98765 00005"
    }
  });
  const nurseEmp1 = await prisma.employee.create({
    data: {
      userId: nurseUser1.id,
      employeeCode: "EMP-0201",
      departmentId: generalMed.id,
      designation: "Senior Staff Nurse",
      joiningDate: new Date("2021-08-20"),
      salary: 55000
    }
  });
  const nurse1 = await prisma.nurse.create({
    data: {
      userId: nurseUser1.id,
      employeeId: nurseEmp1.id,
      departmentId: generalMed.id,
      licenseNumber: "INC-NUR-99120",
      assignedWardId: icuWard.id
    }
  });

  // PHARMACY
  const pharmUser = await prisma.user.create({
    data: {
      email: "pharmacy@hospital.com",
      passwordHash,
      role: "PHARMACY",
      firstName: "Amit",
      lastName: "Kumar",
      phone: "+91 98765 00006"
    }
  });
  await prisma.employee.create({
    data: {
      userId: pharmUser.id,
      employeeCode: "EMP-0301",
      departmentId: generalMed.id,
      designation: "Chief Pharmacist",
      joiningDate: new Date("2020-11-01"),
      salary: 60000
    }
  });

  // LAB
  const labUser = await prisma.user.create({
    data: {
      email: "lab@hospital.com",
      passwordHash,
      role: "LAB",
      firstName: "Dr. Sneha",
      lastName: "Reddy",
      phone: "+91 98765 00007"
    }
  });
  await prisma.employee.create({
    data: {
      userId: labUser.id,
      employeeCode: "EMP-0401",
      departmentId: generalMed.id,
      designation: "Senior Biochemist & Lab Incharge",
      joiningDate: new Date("2021-01-10"),
      salary: 70000
    }
  });

  // FINANCE
  const finUser = await prisma.user.create({
    data: {
      email: "finance@hospital.com",
      passwordHash,
      role: "FINANCE",
      firstName: "Vikram",
      lastName: "Mehta",
      phone: "+91 98765 00008"
    }
  });
  await prisma.employee.create({
    data: {
      userId: finUser.id,
      employeeCode: "EMP-0501",
      departmentId: generalMed.id,
      designation: "Finance & Billing Manager",
      joiningDate: new Date("2019-04-12"),
      salary: 80000
    }
  });

  // HRMS
  const hrmsUser = await prisma.user.create({
    data: {
      email: "hrms@hospital.com",
      passwordHash,
      role: "HRMS",
      firstName: "Ananya",
      lastName: "Roy",
      phone: "+91 98765 00009"
    }
  });
  await prisma.employee.create({
    data: {
      userId: hrmsUser.id,
      employeeCode: "EMP-0601",
      departmentId: generalMed.id,
      designation: "Human Resources Lead",
      joiningDate: new Date("2020-05-18"),
      salary: 75000
    }
  });

  // MESS
  const messUser = await prisma.user.create({
    data: {
      email: "mess@hospital.com",
      passwordHash,
      role: "MESS",
      firstName: "Suresh",
      lastName: "Nair",
      phone: "+91 98765 00010"
    }
  });
  await prisma.employee.create({
    data: {
      userId: messUser.id,
      employeeCode: "EMP-0701",
      departmentId: generalMed.id,
      designation: "Dietary Supervisor",
      joiningDate: new Date("2022-02-01"),
      salary: 42000
    }
  });

  // PATIENT USER
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@hospital.com",
      passwordHash,
      role: "PATIENT",
      firstName: "Rahul",
      lastName: "Verma",
      phone: "+91 98111 22334"
    }
  });

  const demoPatient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      uhid: "UHID-00001",
      firstName: "Rahul",
      lastName: "Verma",
      dob: new Date("1992-05-14"),
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      phone: "+91 98111 22334",
      email: "patient@hospital.com",
      address: "B-402, Green Valley Apartments, New Delhi",
      emergencyContact: "Sunita Verma (Mother)",
      emergencyPhone: "+91 98111 22335",
      allergies: "Penicillin, Sulfa drugs",
      medicalHistory: "Mild hypertension, Asthma diagnosed in 2018"
    }
  });

  // Additional 20 Patients
  console.log("Creating 20+ Realistic Patients...");
  const names = [
    ["Aarav", "Gupta", "MALE", "B_POSITIVE", "Type 2 Diabetes"],
    ["Sanya", "Kapoor", "FEMALE", "A_POSITIVE", "Migraine"],
    ["Rohan", "Iyer", "MALE", "AB_POSITIVE", "Hyperlipidemia"],
    ["Kavita", "Deshmukh", "FEMALE", "O_NEGATIVE", "Osteoarthritis"],
    ["Manish", "Tiwari", "MALE", "O_POSITIVE", "GERD"],
    ["Pooja", "Chopra", "FEMALE", "B_POSITIVE", "Hypothyroidism"],
    ["Deepak", "Joshi", "MALE", "A_NEGATIVE", "Post-angioplasty"],
    ["Sunita", "Bose", "FEMALE", "O_POSITIVE", "Allergic rhinitis"],
    ["Karan", "Malhotra", "MALE", "AB_NEGATIVE", "ACL reconstruction"],
    ["Neha", "Saxena", "FEMALE", "B_NEGATIVE", "PCOS"],
    ["Arjun", "Nair", "MALE", "O_POSITIVE", "None"],
    ["Meera", "Nambiar", "FEMALE", "A_POSITIVE", "CKD Stage 2"],
    ["Sameer", "Khan", "MALE", "B_POSITIVE", "Hypertension"],
    ["Ritu", "Aggarwal", "FEMALE", "O_POSITIVE", "Sciatica"],
    ["Gaurav", "Chatterjee", "MALE", "AB_POSITIVE", "Fatty liver"],
    ["Anjali", "Rao", "FEMALE", "B_POSITIVE", "Iron deficiency"],
    ["Mohit", "Bansal", "MALE", "A_POSITIVE", "Sinusitis"],
    ["Swati", "Mishra", "FEMALE", "O_NEGATIVE", "None"],
    ["Dev", "Rathore", "MALE", "B_POSITIVE", "CAD"],
    ["Priya", "Menon", "FEMALE", "A_POSITIVE", "Asthma"]
  ];

  const allPatients = [demoPatient];
  for (let i = 0; i < names.length; i++) {
    const [fn, ln, g, bg, mh] = names[i];
    const p = await prisma.patient.create({
      data: {
        uhid: "UHID-" + String(i + 2).padStart(5, "0"),
        firstName: fn,
        lastName: ln,
        dob: new Date(1975 + (i * 2), (i % 12), 10 + (i % 15)),
        gender: g,
        bloodGroup: bg,
        phone: "+91 98222 " + String(11000 + i),
        email: fn.toLowerCase() + "." + ln.toLowerCase() + "@example.com",
        address: (100 + i) + ", Sector " + (10 + (i % 20)) + ", NCR",
        medicalHistory: mh
      }
    });
    allPatients.push(p);
  }

  // 5. Medicines & Batches
  console.log("Creating Medicines & Batches...");
  const meds = [
    { name: "Paracetamol 650mg", gen: "Acetaminophen", cat: "ANALGESIC", form: "TABLET", str: "650mg", price: 3.5, qty: 1200 },
    { name: "Amoxicillin 500mg", gen: "Amoxicillin Trihydrate", cat: "ANTIBIOTIC", form: "CAPSULE", str: "500mg", price: 12.0, qty: 450 },
    { name: "Azithromycin 500mg", gen: "Azithromycin", cat: "ANTIBIOTIC", form: "TABLET", str: "500mg", price: 25.0, qty: 300 },
    { name: "Telmisartan 40mg", gen: "Telmisartan", cat: "ANTIHYPERTENSIVE", form: "TABLET", str: "40mg", price: 9.0, qty: 800 },
    { name: "Metformin 500mg", gen: "Metformin HCl", cat: "ANTIDIABETIC", form: "TABLET", str: "500mg", price: 4.5, qty: 950 },
    { name: "Pantoprazole 40mg", gen: "Pantoprazole Sodium", cat: "ANTACID", form: "TABLET", str: "40mg", price: 8.5, qty: 600 },
    { name: "Atorvastatin 20mg", gen: "Atorvastatin Calcium", cat: "LIPID_LOWERING", form: "TABLET", str: "20mg", price: 14.0, qty: 400 },
    { name: "Ceftriaxone 1g Inj", gen: "Ceftriaxone Sodium", cat: "ANTIBIOTIC", form: "INJECTION", str: "1g", price: 120.0, qty: 150 },
    { name: "Ondansetron 4mg", gen: "Ondansetron", cat: "ANTIEMETIC", form: "TABLET", str: "4mg", price: 6.0, qty: 350 },
    { name: "Salbutamol Inhaler", gen: "Salbutamol Sulfate", cat: "RESPIRATORY", form: "INHALER", str: "100mcg", price: 180.0, qty: 80 }
  ];

  const createdMeds: any[] = [];
  for (const m of meds) {
    const med = await prisma.medicine.create({
      data: {
        name: m.name,
        genericName: m.gen,
        category: m.cat,
        form: m.form,
        strength: m.str,
        unitPrice: m.price,
        stockQuantity: m.qty,
        reorderLevel: 50,
        batches: {
          create: [
            {
              batchNumber: "BAT-" + Math.floor(10000 + Math.random() * 90000),
              expiryDate: new Date("2027-06-30"),
              quantity: Math.floor(m.qty * 0.7),
              purchasePrice: m.price * 0.6,
              sellingPrice: m.price
            }
          ]
        }
      }
    });
    createdMeds.push(med);
  }

  // 6. Diagnostic Lab Tests
  console.log("Creating Diagnostic Lab Tests...");
  const labTests = [
    { name: "Complete Blood Count (CBC)", code: "LAB-CBC", cat: "HEMATOLOGY", nr: "Hb 13.5-17.5 g/dL, WBC 4k-11k", unit: "various", price: 350 },
    { name: "Lipid Profile Panel", code: "LAB-LIPID", cat: "BIOCHEMISTRY", nr: "Cholesterol < 200, HDL > 40, LDL < 100", unit: "mg/dL", price: 750 },
    { name: "Glycated Hemoglobin (HbA1c)", code: "LAB-HBA1C", cat: "BIOCHEMISTRY", nr: "4.0 - 5.6 %", unit: "%", price: 500 },
    { name: "Liver Function Test (LFT)", code: "LAB-LFT", cat: "BIOCHEMISTRY", nr: "SGOT 15-40, SGPT 15-40, Bilirubin 0.2-1.2", unit: "U/L", price: 800 },
    { name: "Kidney Function Test (KFT)", code: "LAB-KFT", cat: "BIOCHEMISTRY", nr: "Creatinine 0.7-1.3, Urea 15-40", unit: "mg/dL", price: 650 },
    { name: "Chest X-Ray PA View", code: "RAD-CXR", cat: "RADIOLOGY", nr: "Clear lung fields", unit: "N/A", price: 600 }
  ];

  const createdLabTests: any[] = [];
  for (const lt of labTests) {
    const test = await prisma.labTest.create({
      data: {
        name: lt.name,
        code: lt.code,
        category: lt.cat,
        normalRange: lt.nr,
        unit: lt.unit,
        price: lt.price
      }
    });
    createdLabTests.push(test);
  }

  // 7. Inventory Items & Oxygen
  console.log("Creating Consumables & Oxygen Cylinders...");
  const inv = [
    { name: "Disposable Syringes 5ml", code: "INV-SYR-5", cat: "CONSUMABLE", unit: "PCS", qty: 2500, min: 200 },
    { name: "IV Cannula 20G", code: "INV-CAN-20", cat: "CONSUMABLE", unit: "BOX", qty: 120, min: 20 },
    { name: "Sterile Surgical Gloves (M)", code: "INV-GLV-M", cat: "SURGICAL", unit: "BOX", qty: 85, min: 15 },
    { name: "Basmati Rice", code: "FOOD-RICE", cat: "FOOD_SUPPLY", unit: "KG", qty: 350, min: 50 },
    { name: "Toor Dal", code: "FOOD-DAL", cat: "FOOD_SUPPLY", unit: "KG", qty: 180, min: 30 }
  ];

  for (const item of inv) {
    await prisma.inventoryItem.create({
      data: {
        name: item.name,
        code: item.code,
        category: item.cat,
        unit: item.unit,
        currentStock: item.qty,
        minStockLevel: item.min,
        location: "Central Warehouse"
      }
    });
  }

  for (let i = 1; i <= 6; i++) {
    await prisma.oxygenCylinder.create({
      data: {
        cylinderCode: "OXY-CYL-10" + i,
        type: i <= 2 ? "JUMBO" : "TYPE_D",
        capacityLiters: i <= 2 ? 6800 : 1500,
        currentPressureBar: i === 5 ? 15.0 : 145.0,
        status: i === 1 ? "IN_USE" : i === 5 ? "EMPTY" : "AVAILABLE",
        currentLocation: i === 1 ? "ICU-01" : "CENTRAL_STORE",
        wardId: i === 1 ? icuWard.id : null
      }
    });
  }

  // 8. Appointments & Clinical Encounter for Rahul Verma
  console.log("Creating Clinical Workflows, Appointments, Prescriptions & Bills...");

  const appt1 = await prisma.appointment.create({
    data: {
      tokenNumber: 1,
      patientId: demoPatient.id,
      doctorId: doctor1.id,
      departmentId: cardiology.id,
      appointmentDate: new Date(),
      timeSlot: "10:00 AM",
      status: "COMPLETED",
      type: "OPD",
      reason: "Cardiology follow up for hypertension"
    }
  });

  const enc1 = await prisma.encounter.create({
    data: {
      appointmentId: appt1.id,
      patientId: demoPatient.id,
      doctorId: doctor1.id,
      symptoms: "Mild palpitations on exertion, normal sleep.",
      notes: "Heart sounds regular S1 S2 heard. Blood pressure stable.",
      vitalsSummary: "BP 130/84, Pulse 78, SpO2 98%",
      status: "COMPLETED"
    }
  });

  await prisma.diagnosis.create({
    data: {
      encounterId: enc1.id,
      patientId: demoPatient.id,
      doctorId: doctor1.id,
      icdCode: "I10",
      diagnosisName: "Essential Hypertension",
      type: "FINAL",
      notes: "Stage 1 primary hypertension"
    }
  });

  const rx1 = await prisma.prescription.create({
    data: {
      encounterId: enc1.id,
      patientId: demoPatient.id,
      doctorId: doctor1.id,
      instructions: "Take Telmisartan after breakfast. Low sodium diet.",
      status: "DISPENSED",
      items: {
        create: [
          {
            medicineId: createdMeds[3].id,
            medicineName: "Telmisartan 40mg",
            dosage: "40mg",
            frequency: "1-0-0",
            durationDays: 30,
            quantity: 30,
            route: "ORAL",
            isDispensed: true
          },
          {
            medicineId: createdMeds[6].id,
            medicineName: "Atorvastatin 20mg",
            dosage: "20mg",
            frequency: "0-0-1",
            durationDays: 30,
            quantity: 30,
            route: "ORAL",
            isDispensed: true
          }
        ]
      }
    }
  });

  const opdCharge = await prisma.charge.create({
    data: {
      patientId: demoPatient.id,
      sourceModule: "OPD",
      sourceId: enc1.id,
      serviceName: "OPD Consultation - Dr. Rajesh Sharma (Cardiology)",
      quantity: 1,
      unitPrice: 800,
      totalAmount: 800,
      status: "INVOICED"
    }
  });

  const dsp1 = await prisma.pharmacyDispensing.create({
    data: {
      dispensingNumber: "DSP-00001",
      prescriptionId: rx1.id,
      patientId: demoPatient.id,
      totalAmount: 690,
      status: "COMPLETED",
      items: {
        create: [
          { medicineId: createdMeds[3].id, quantity: 30, unitPrice: 9.0, totalPrice: 270.0 },
          { medicineId: createdMeds[6].id, quantity: 30, unitPrice: 14.0, totalPrice: 420.0 }
        ]
      }
    }
  });

  const pharmCharge = await prisma.charge.create({
    data: {
      patientId: demoPatient.id,
      sourceModule: "PHARMACY",
      sourceId: dsp1.id,
      serviceName: "Pharmacy Dispense - Ref DSP-00001",
      quantity: 1,
      unitPrice: 690,
      totalAmount: 690,
      status: "INVOICED"
    }
  });

  // Lab Order & Results
  const labOrder1 = await prisma.labOrder.create({
    data: {
      orderNumber: "LAB-00001",
      patientId: demoPatient.id,
      doctorId: doctor1.id,
      status: "COMPLETED",
      clinicalNotes: "Annual lipid screening",
      items: {
        create: [
          { labTestId: createdLabTests[0].id, testName: "Complete Blood Count (CBC)", price: 350 },
          { labTestId: createdLabTests[1].id, testName: "Lipid Profile Panel", price: 750 }
        ]
      }
    }
  });

  await prisma.labResult.create({
    data: {
      labOrderId: labOrder1.id,
      labTestId: createdLabTests[0].id,
      resultValue: "Hb: 14.2 g/dL, WBC: 7,200 /uL, Platelets: 240,000 /uL",
      normalRange: "Hb 13.5-17.5 g/dL",
      unit: "g/dL",
      isAbnormal: false,
      remarks: "Within normal physiological range.",
      verifiedBy: "Dr. Sneha Reddy"
    }
  });

  const labCharge = await prisma.charge.create({
    data: {
      patientId: demoPatient.id,
      sourceModule: "LAB",
      sourceId: labOrder1.id,
      serviceName: "Diagnostic Panel (CBC + Lipid Profile)",
      quantity: 2,
      unitPrice: 1100,
      totalAmount: 1100,
      status: "INVOICED"
    }
  });

  // Invoice for Rahul Verma
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-00001",
      patientId: demoPatient.id,
      subtotal: 2590,
      discountAmount: 259,
      discountPercent: 10,
      taxAmount: 0,
      finalAmount: 2331,
      paidAmount: 2331,
      balanceAmount: 0,
      status: "PAID",
      finalizedBy: "finance@hospital.com",
      finalizedAt: new Date(),
      notes: "OPD Consultation, prescribed medicines & diagnostic tests.",
      items: {
        create: [
          { chargeId: opdCharge.id, description: opdCharge.serviceName, quantity: 1, unitPrice: 800, amount: 800 },
          { chargeId: pharmCharge.id, description: pharmCharge.serviceName, quantity: 1, unitPrice: 690, amount: 690 },
          { chargeId: labCharge.id, description: labCharge.serviceName, quantity: 1, unitPrice: 1100, amount: 1100 }
        ]
      }
    }
  });

  await prisma.discount.create({
    data: {
      invoiceId: invoice1.id,
      discountType: "PERCENTAGE",
      value: 10,
      discountAmount: 259,
      reason: "Privilege Cardholder 10% Discount",
      approvedBy: "finance@hospital.com"
    }
  });

  await prisma.payment.create({
    data: {
      receiptNumber: "RCP-00001",
      invoiceId: invoice1.id,
      patientId: demoPatient.id,
      amount: 2331,
      paymentMethod: "UPI",
      transactionRef: "UPI-TXN-998822110",
      recordedBy: "finance@hospital.com",
      notes: "Payment received in full."
    }
  });

  // 9. Admitted Inpatient (Aarav Gupta) + Vitals + Mess Diet
  console.log("Creating IPD Admission, Nursing Vitals & Diet Plan...");
  const admittedPatient = allPatients[1];
  const icuBed = createdBeds[0];

  const adm1 = await prisma.admission.create({
    data: {
      admissionNumber: "ADM-00001",
      patientId: admittedPatient.id,
      doctorId: doctor1.id,
      wardId: icuWard.id,
      bedId: icuBed.id,
      admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reason: "Acute severe chest discomfort and monitored ECG changes.",
      status: "ACTIVE"
    }
  });

  await prisma.bedAssignment.create({
    data: {
      admissionId: adm1.id,
      bedId: icuBed.id,
      assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.vital.create({
    data: {
      patientId: admittedPatient.id,
      nurseId: nurse1.id,
      bloodPressure: "126/80",
      temperature: 98.4,
      pulseRate: 72,
      spo2: 99,
      respiratoryRate: 16,
      weight: 76.0,
      notes: "Patient resting comfortably in Bed ICU-B01."
    }
  });

  await prisma.nursingNote.create({
    data: {
      patientId: admittedPatient.id,
      nurseId: nurse1.id,
      noteType: "PROGRESS",
      content: "Morning round completed. IV infusion at 75ml/hr. Vitals stable."
    }
  });

  const diet1 = await prisma.dietPlan.create({
    data: {
      patientId: admittedPatient.id,
      admissionId: adm1.id,
      doctorId: doctor1.id,
      dietType: "LOW_SODIUM",
      breakfast: "Oatmeal with skimmed milk + boiled egg white",
      lunch: "Steamed brown rice, yellow dal (low salt), boiled vegetables",
      dinner: "2 Multigrain rotis, bottle gourd curry, vegetable soup",
      specialInstructions: "Strict low sodium (<2g/day), diabetic friendly.",
      status: "ACTIVE"
    }
  });

  await prisma.mealFulfillment.create({
    data: {
      dietPlanId: diet1.id,
      patientId: admittedPatient.id,
      bedNumber: icuBed.bedNumber,
      mealType: "LUNCH",
      status: "DELIVERED",
      preparedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deliveredBy: "mess@hospital.com",
      notes: "Delivered on time."
    }
  });

  await prisma.mealFulfillment.create({
    data: {
      dietPlanId: diet1.id,
      patientId: admittedPatient.id,
      bedNumber: icuBed.bedNumber,
      mealType: "DINNER",
      status: "PENDING",
      notes: "Warm with low salt instructions."
    }
  });

  // 10. HRMS Attendances & Payroll
  console.log("Creating HRMS Attendances & Payroll...");
  const employees = await prisma.employee.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const emp of employees) {
    await prisma.attendance.create({
      data: {
        employeeId: emp.id,
        date: today,
        checkIn: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: "PRESENT"
      }
    });

    const basic = emp.salary || 50000;
    await prisma.payrollRecord.create({
      data: {
        employeeId: emp.id,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        basicSalary: basic,
        allowances: basic * 0.2,
        deductions: basic * 0.1,
        netSalary: basic * 1.1,
        paymentStatus: "PAID",
        paymentDate: new Date()
      }
    });
  }

  await prisma.leaveRequest.create({
    data: {
      employeeId: nurseEmp1.id,
      leaveType: "CASUAL",
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalDays: 3,
      reason: "Family function in hometown.",
      status: "APPROVED",
      approvedBy: "hrms@hospital.com",
      remarks: "Approved. Ward shift swap confirmed."
    }
  });

  // 11. Audit Logs
  console.log("Creating Audit Logs...");
  const logs = [
    { action: "LOGIN", entity: "USER", details: "Admin logged into system control center" },
    { action: "CREATE", entity: "APPOINTMENT", details: "Appointment scheduled for Rahul Verma (Token #1)" },
    { action: "CREATE", entity: "ENCOUNTER", details: "OPD Consultation completed by Dr. Rajesh Sharma" },
    { action: "DISPENSE", entity: "PHARMACY", details: "Dispensed prescription Ref DSP-00001" },
    { action: "ADMIT", entity: "PATIENT", details: "Aarav Gupta admitted to ICU Bed ICU-B01" },
    { action: "FINALIZE", entity: "INVOICE", details: "Invoice INV-00001 finalized with 10% discount" },
    { action: "RECORD_PAYMENT", entity: "PAYMENT", details: "Payment of ₹2,331 recorded via UPI" }
  ];

  for (const l of logs) {
    await prisma.auditLog.create({
      data: {
        userEmail: "admin@hospital.com",
        userRole: "ADMIN",
        action: l.action,
        entity: l.entity,
        ipAddress: "127.0.0.1",
        details: l.details
      }
    });
  }

  console.log("✅ Hospital Management & Operations Database Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync('server/src/seed.ts', content, 'utf8');
console.log('Successfully wrote server/src/seed.ts');
