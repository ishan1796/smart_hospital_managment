import request from "supertest";
import app from "../index";
import { prisma } from "../config/db";

describe("Hospital Management & Operations System - Backend API Tests", () => {
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let patientToken: string;
  let patientUserId: string;
  let patientProfileId: string;
  let pharmacyToken: string;
  let financeToken: string;
  let messToken: string;

  beforeAll(async () => {
    // 1. Authenticate ADMIN
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hospital.com", password: "password123" });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate DOCTOR
    const docRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "doctor@hospital.com", password: "password123" });
    expect(docRes.status).toBe(200);
    doctorToken = docRes.body.token;

    // 3. Authenticate NURSE
    const nurseRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "nurse@hospital.com", password: "password123" });
    expect(nurseRes.status).toBe(200);
    nurseToken = nurseRes.body.token;

    // 4. Authenticate PATIENT
    const patRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "patient@hospital.com", password: "password123" });
    expect(patRes.status).toBe(200);
    patientToken = patRes.body.token;
    patientUserId = patRes.body.user.userId;
    patientProfileId = patRes.body.user.patientId;

    // 5. Authenticate PHARMACY
    const pharmRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "pharmacy@hospital.com", password: "password123" });
    expect(pharmRes.status).toBe(200);
    pharmacyToken = pharmRes.body.token;

    // 6. Authenticate FINANCE
    const finRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "finance@hospital.com", password: "password123" });
    expect(finRes.status).toBe(200);
    financeToken = finRes.body.token;

    // 7. Authenticate MESS
    const messRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "mess@hospital.com", password: "password123" });
    expect(messRes.status).toBe(200);
    messToken = messRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("1. Authentication & Get Current User Profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
  });

  test("2. Unauthorized Request Blocking without JWT", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(401);
  });

  test("3. Patient Data Isolation - Patient cannot access other patient's record", async () => {
    // Find another patient ID
    const otherPatient = await prisma.patient.findFirst({
      where: { id: { not: patientProfileId } },
    });
    expect(otherPatient).toBeDefined();

    const res = await request(app)
      .get(`/api/patients/${otherPatient!.id}`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  test("4. Doctor can access assigned/permitted patient record", async () => {
    const res = await request(app)
      .get(`/api/patients/${patientProfileId}`)
      .set("Authorization", `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.patient.uhid).toBe("UHID-00001");
  });

  test("5. Doctor Consultation & OPD Encounter Creation generates Charge", async () => {
    const doc = await prisma.doctor.findFirst();
    const res = await request(app)
      .post("/api/clinical/encounters")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: patientProfileId,
        doctorId: doc!.id,
        symptoms: "Mild fever, productive cough for 2 days",
        notes: "Chest clear, throat mildly congested.",
        diagnoses: [
          { diagnosisName: "Acute Upper Respiratory Tract Infection", icdCode: "J06.9", type: "FINAL" },
        ],
        prescriptions: {
          instructions: "Hydration and rest",
          items: [
            { medicineName: "Paracetamol 650mg", dosage: "650mg", frequency: "1-0-1", durationDays: 3, quantity: 6 },
          ],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.encounter.status).toBe("COMPLETED");

    // Verify Charge was generated in database
    const charge = await prisma.charge.findFirst({
      where: { sourceId: res.body.encounter.id, sourceModule: "OPD" },
    });
    expect(charge).toBeDefined();
    expect(charge!.totalAmount).toBeGreaterThan(0);
  });

  test("6. Pharmacy Atomic Dispensing & Stock Deduction", async () => {
    // Find an undispensed prescription
    const medicine = await prisma.medicine.findFirst({ where: { stockQuantity: { gt: 10 } } });
    const initialStock = medicine!.stockQuantity;

    const patient = await prisma.patient.findFirst();
    const doc = await prisma.doctor.findFirst();

    const rx = await prisma.prescription.create({
      data: {
        patientId: patient!.id,
        doctorId: doc!.id,
        status: "PENDING",
        items: {
          create: [
            {
              medicineId: medicine!.id,
              medicineName: medicine!.name,
              dosage: "500mg",
              frequency: "1-0-1",
              durationDays: 2,
              quantity: 4,
            },
          ],
        },
      },
    });

    const res = await request(app)
      .post("/api/pharmacy/dispense")
      .set("Authorization", `Bearer ${pharmacyToken}`)
      .send({
        prescriptionId: rx.id,
        items: [{ medicineId: medicine!.id, quantity: 4 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.dispensing.status).toBe("COMPLETED");

    // Verify stock decreased
    const updatedMed = await prisma.medicine.findUnique({ where: { id: medicine!.id } });
    expect(updatedMed!.stockQuantity).toBe(initialStock - 4);

    // Verify Pharmacy Charge created
    const charge = await prisma.charge.findFirst({
      where: { sourceId: res.body.dispensing.id, sourceModule: "PHARMACY" },
    });
    expect(charge).toBeDefined();
  });

  test("7. IPD Admission & Bed Double-Booking Prevention", async () => {
    const availableBed = await prisma.bed.findFirst({ where: { status: "AVAILABLE" } });
    const doctor = await prisma.doctor.findFirst();
    const unadmittedPatient1 = await prisma.patient.findFirst({
      where: { admissions: { none: { status: "ACTIVE" } } },
    });
    const unadmittedPatient2 = await prisma.patient.findFirst({
      where: {
        id: { not: unadmittedPatient1!.id },
        admissions: { none: { status: "ACTIVE" } },
      },
    });

    // 1st admission should succeed
    const res1 = await request(app)
      .post("/api/ipd/admit")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: unadmittedPatient1!.id,
        doctorId: doctor!.id,
        wardId: availableBed!.wardId,
        bedId: availableBed!.id,
        reason: "Observation for fever and dehydration",
      });
    expect(res1.status).toBe(201);

    // 2nd admission for same bed should FAIL
    const res2 = await request(app)
      .post("/api/ipd/admit")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: unadmittedPatient2!.id,
        doctorId: doctor!.id,
        wardId: availableBed!.wardId,
        bedId: availableBed!.id,
        reason: "Observation",
      });
    expect(res2.status).toBe(400);
  });

  test("8. Nurse Recording Patient Vitals", async () => {
    const patient = await prisma.patient.findFirst();
    const res = await request(app)
      .post("/api/nursing/vitals")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        patientId: patient!.id,
        bloodPressure: "120/80",
        temperature: 98.6,
        pulseRate: 72,
        spo2: 99,
        respiratoryRate: 18,
        weight: 68.5,
        notes: "Routine morning vitals check",
      });

    expect(res.status).toBe(201);
    expect(res.body.vitals.bloodPressure).toBe("120/80");
  });

  test("9. Discount Permissions - Only Finance/Admin Allowed", async () => {
    // Create an invoice first
    const patient = await prisma.patient.findFirst();
    const charge = await prisma.charge.create({
      data: {
        patientId: patient!.id,
        sourceModule: "OPD",
        serviceName: "Specialist Consultation",
        quantity: 1,
        unitPrice: 1000,
        totalAmount: 1000,
        status: "PENDING",
      },
    });

    const invRes = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", `Bearer ${financeToken}`)
      .send({
        patientId: patient!.id,
        chargeIds: [charge.id],
      });
    expect(invRes.status).toBe(201);
    const invoiceId = invRes.body.invoice.id;

    // Doctor attempting to apply discount should be FORBIDDEN (403)
    const docDiscountRes = await request(app)
      .post("/api/finance/invoices/discount")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        invoiceId,
        discountType: "PERCENTAGE",
        value: 15,
        reason: "Doctor courtesy",
      });
    expect(docDiscountRes.status).toBe(403);

    // Finance applying discount should SUCCEED
    const finDiscountRes = await request(app)
      .post("/api/finance/invoices/discount")
      .set("Authorization", `Bearer ${financeToken}`)
      .send({
        invoiceId,
        discountType: "PERCENTAGE",
        value: 10,
        reason: "Authorized senior citizen concession",
      });
    expect(finDiscountRes.status).toBe(200);
    expect(finDiscountRes.body.invoice.discountAmount).toBe(100);
    expect(finDiscountRes.body.invoice.finalAmount).toBe(900);
  });

  test("10. Payment Recording & Receipt Generation", async () => {
    const invoice = await prisma.invoice.findFirst({ where: { status: "FINALIZED" } });
    expect(invoice).toBeDefined();

    const res = await request(app)
      .post("/api/finance/payments")
      .set("Authorization", `Bearer ${financeToken}`)
      .send({
        invoiceId: invoice!.id,
        amount: invoice!.balanceAmount,
        paymentMethod: "CASH",
        notes: "Full settlement at billing counter",
      });

    expect(res.status).toBe(201);
    expect(res.body.payment.receiptNumber).toMatch(/^RCP-\d+/);
  });

  test("11. Mess Fulfillment Isolation - Mess cannot access clinical diagnoses", async () => {
    const res = await request(app)
      .get("/api/diet/fulfillments")
      .set("Authorization", `Bearer ${messToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.fulfillments)).toBe(true);

    if (res.body.fulfillments.length > 0) {
      const item = res.body.fulfillments[0];
      // Should have bedNumber, mealType, mealItems
      expect(item.bedNumber).toBeDefined();
      expect(item.mealType).toBeDefined();
      // Should NOT expose diagnosis or prescription details
      expect((item as any).diagnosis).toBeUndefined();
      expect((item as any).prescriptions).toBeUndefined();
    }
  });

  test("12. Admin Metrics & Live Analytics API", async () => {
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis.totalPatients).toBeGreaterThan(0);
    expect(res.body.kpis.totalBeds).toBeGreaterThan(0);
    expect(res.body.charts.appointmentTrends).toBeDefined();
  });

  test("13. AI Patient Assistant & Admin Copilot via Guarded Backend Tools", async () => {
    // Patient Chat
    const patientAiRes = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ prompt: "What are my upcoming appointments?" });
    expect(patientAiRes.status).toBe(200);
    expect(patientAiRes.body.reply).toBeDefined();
    expect(patientAiRes.body.toolUsed).toBe("getMyAppointments");

    // Admin Copilot Chat
    const adminAiRes = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ prompt: "How many beds are currently occupied in the hospital?" });
    expect(adminAiRes.status).toBe(200);
    expect(adminAiRes.body.reply).toBeDefined();
  });
});
