import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { Table } from "../components/common/Table";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { StaffLeaveView } from "../components/common/StaffLeaveView";
import {
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  CheckCircle,
  History,
  Users,
  Search,
  Plus,
  PlaneTakeoff,
  Eye,
  AlertCircle
} from "lucide-react";
import { AiExecutiveSummaryBanner } from "../components/common/AiExecutiveSummaryBanner";

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [prescriptionsList, setPrescriptionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [patientSearch, setPatientSearch] = useState("");

  // Modals
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<any>(null);

  const [encounterDetailModal, setEncounterDetailModal] = useState<any>(null);
  const [rxDetailModal, setRxDetailModal] = useState<any>(null);

  // Direct Prescription Modal
  const [directRxModalOpen, setDirectRxModalOpen] = useState(false);
  const [directRxForm, setDirectRxForm] = useState({
    patientId: "",
    instructions: "Take with meals.",
    items: [
      { medicineName: "Paracetamol 650mg", dosage: "650mg", frequency: "1-0-1", durationDays: 5, quantity: 10 },
    ],
  });
  const [directRxLoading, setDirectRxLoading] = useState(false);

  // Consultation Form
  const [consultForm, setConsultForm] = useState({
    symptoms: "",
    notes: "",
    vitalsSummary: "BP: 120/80, Pulse: 72, SpO2: 99%",
    diagnosisName: "Essential Hypertension",
    icdCode: "I10",
    prescriptions: [
      { medicineName: "Telmisartan 40mg", dosage: "40mg", frequency: "1-0-0", durationDays: 30, quantity: 30 },
    ],
    selectedLabTests: [] as string[],
  });
  const [consultLoading, setConsultLoading] = useState(false);

  // Detect active view from path
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes("/doctor/patients")) return "patients";
    if (path.includes("/doctor/encounters")) return "encounters";
    if (path.includes("/doctor/prescriptions")) return "prescriptions";
    if (path.includes("/doctor/lab-orders")) return "lab-orders";
    if (path.includes("/doctor/leave")) return "leave";
    return "queue";
  };

  const activeView = getActiveView();

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [apptRes, patRes, encRes, medRes, labTestRes, labOrderRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/patients"),
        api.get("/clinical/encounters"),
        api.get("/pharmacy/medicines"),
        api.get("/lab/tests"),
        api.get("/lab/orders"),
      ]);

      if (apptRes.data.success) setAppointments(apptRes.data.appointments);
      if (patRes.data.success) {
        setPatients(patRes.data.patients);
        if (patRes.data.patients.length > 0 && !directRxForm.patientId) {
          setDirectRxForm((prev) => ({ ...prev, patientId: patRes.data.patients[0].id }));
        }
      }
      if (encRes.data.success) {
        setEncounters(encRes.data.encounters);
        // Extract all prescriptions from encounters
        const allRx: any[] = [];
        encRes.data.encounters.forEach((enc: any) => {
          if (enc.prescriptions && enc.prescriptions.length > 0) {
            enc.prescriptions.forEach((rx: any) => {
              allRx.push({
                ...rx,
                patient: enc.patient,
                doctor: enc.doctor,
                encounterDate: enc.encounterDate,
              });
            });
          }
        });
        setPrescriptionsList(allRx);
      }
      if (medRes.data.success) setMedicines(medRes.data.medicines);
      if (labTestRes.data.success) setLabTests(labTestRes.data.tests);
      if (labOrderRes.data.success) setLabOrders(labOrderRes.data.orders);
    } catch (err) {
      console.error("Error fetching doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const openConsultation = (appt: any) => {
    setSelectedAppt(appt);
    setConsultForm({
      symptoms: appt.reason || "General weakness and routine review",
      notes: "Systemic examination normal. Advised lifestyle changes and regular monitoring.",
      vitalsSummary: "BP: 120/80 mmHg, Pulse: 74 bpm, SpO2: 99%",
      diagnosisName: "Acute Upper Respiratory Infection",
      icdCode: "J06.9",
      prescriptions: [
        { medicineName: "Paracetamol 650mg", dosage: "650mg", frequency: "1-0-1", durationDays: 5, quantity: 10 },
      ],
      selectedLabTests: [],
    });
    setConsultModalOpen(true);
  };

  const viewHistory = async (patient: any) => {
    setSelectedPatientForHistory(patient);
    try {
      const pId = patient.id || patient;
      const res = await api.get(`/clinical/history/${pId}`);
      if (res.data.success) {
        setPatientHistory(res.data.history);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      alert("Failed to load patient EHR history");
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setConsultLoading(true);

    try {
      const labOrdersPayload = consultForm.selectedLabTests.map((tId) => {
        const t = labTests.find((x) => x.id === tId);
        return { labTestId: t.id, testName: t.name, price: t.price };
      });

      const res = await api.post("/clinical/encounters", {
        appointmentId: selectedAppt.id,
        patientId: selectedAppt.patientId,
        doctorId: selectedAppt.doctorId || user?.doctorId,
        symptoms: consultForm.symptoms,
        notes: consultForm.notes,
        vitalsSummary: consultForm.vitalsSummary,
        diagnoses: [
          { diagnosisName: consultForm.diagnosisName, icdCode: consultForm.icdCode, type: "FINAL" },
        ],
        prescriptions: {
          instructions: "Take medicines strictly as prescribed after meals.",
          items: consultForm.prescriptions,
        },
        labOrders: labOrdersPayload,
      });

      if (res.data.success) {
        setConsultModalOpen(false);
        alert("Consultation encounter completed and signed successfully!");
        fetchDoctorData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit consultation");
    } finally {
      setConsultLoading(false);
    }
  };

  const handleCreateDirectRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directRxForm.patientId) return;
    setDirectRxLoading(true);
    try {
      const res = await api.post("/clinical/encounters", {
        patientId: directRxForm.patientId,
        doctorId: user?.doctorId,
        symptoms: "Direct Prescription Refill / Clinical Follow-up",
        notes: "Direct prescription issued by attending physician.",
        vitalsSummary: "BP: 120/80 mmHg, SpO2: 98%",
        diagnoses: [
          { diagnosisName: "Follow-up Medication Refill", icdCode: "Z76.0", type: "PROVISIONAL" },
        ],
        prescriptions: {
          instructions: directRxForm.instructions,
          items: directRxForm.items,
        },
      });

      if (res.data.success) {
        setDirectRxModalOpen(false);
        alert("Prescription issued and sent to Hospital Pharmacy!");
        fetchDoctorData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create prescription");
    } finally {
      setDirectRxLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Doctor Consultation Suite..." />;

  const todayAppts = appointments.filter((a) => a.status !== "COMPLETED");

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.uhid?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-blue-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Dr. {user?.firstName} {user?.lastName}</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Consultant Physician • OPD Room #102 • AegisCare Clinical Suite
            </p>
          </div>
        </div>

        {/* Sub-module Navigation Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/doctor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "queue" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>OPD Queue ({todayAppts.length})</span>
          </button>
          <button
            onClick={() => navigate("/doctor/patients")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "patients" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Patients ({patients.length})</span>
          </button>
          <button
            onClick={() => navigate("/doctor/encounters")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "encounters" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Encounters ({encounters.length})</span>
          </button>
          <button
            onClick={() => navigate("/doctor/prescriptions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "prescriptions" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Rx Registry</span>
          </button>
          <button
            onClick={() => navigate("/doctor/lab-orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "lab-orders" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Lab Orders ({labOrders.length})</span>
          </button>
          <button
            onClick={() => navigate("/doctor/leave")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "leave" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Leave Requests</span>
          </button>
        </div>
      </div>

      {/* Gemini AI Clinical Intelligence Briefing */}
      <AiExecutiveSummaryBanner role="DOCTOR" />

      {/* ========================================================= */}
      {/* 1. OPD CONSULTATION QUEUE VIEW */}
      {/* ========================================================= */}
      {activeView === "queue" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Waiting for Consultation</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{todayAppts.length} Patients</p>
              <span className="text-[11px] text-slate-400">Scheduled for today</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Consultations Completed</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {appointments.filter((a) => a.status === "COMPLETED").length} Done
              </p>
              <span className="text-[11px] text-slate-400">Total signed encounters</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Registered Patients</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{patients.length} EHR Profiles</p>
              <span className="text-[11px] text-slate-400">In hospital directory</span>
            </div>
          </div>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Today's OPD Consultation Queue</span>
              </div>
            }
            subtitle="Real-time patient queue with instant consultation and diagnostic ordering"
          >
            <Table
              columns={[
                {
                  header: "Token #",
                  accessor: (r: any) => (
                    <span className="font-mono font-bold text-blue-700 text-base">#{r.tokenNumber}</span>
                  ),
                },
                {
                  header: "Patient Details",
                  accessor: (r: any) => (
                    <div>
                      <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                      <div className="text-xs text-slate-500 font-mono">{r.patient?.uhid} • {r.patient?.gender}</div>
                    </div>
                  ),
                },
                {
                  header: "Time Slot",
                  accessor: "timeSlot",
                },
                {
                  header: "Chief Complaint",
                  accessor: (r: any) => <span className="text-xs text-slate-700">{r.reason || "General Consult"}</span>,
                },
                {
                  header: "Status",
                  accessor: (r: any) => {
                    const map: any = {
                      COMPLETED: "success",
                      SCHEDULED: "primary",
                      IN_CONSULTATION: "warning",
                    };
                    return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                  },
                },
                {
                  header: "Actions",
                  accessor: (r: any) => (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewHistory(r.patient)}
                        icon={<History className="w-3.5 h-3.5" />}
                      >
                        History
                      </Button>
                      {r.status !== "COMPLETED" ? (
                        <Button
                          size="sm"
                          onClick={() => openConsultation(r)}
                          icon={<Stethoscope className="w-3.5 h-3.5" />}
                        >
                          Consult
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Encounter Done
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
              data={appointments}
              keyExtractor={(r: any) => r.id}
              emptyMessage="No OPD appointments in queue."
            />
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PATIENTS DIRECTORY VIEW */}
      {/* ========================================================= */}
      {activeView === "patients" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Hospital Patient Directory & EHR Records</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, UHID, phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          }
          subtitle="Explore patient medical history, allergies, diagnostic reports, and historical encounters"
        >
          <Table
            columns={[
              {
                header: "UHID",
                accessor: (r: any) => <span className="font-mono font-bold text-blue-700 text-xs">{r.uhid}</span>,
              },
              {
                header: "Patient Name",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.firstName} {r.lastName}</span>
                    <div className="text-xs text-slate-500 font-mono">DOB: {new Date(r.dob).toLocaleDateString()}</div>
                  </div>
                ),
              },
              {
                header: "Demographics",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-700">
                    {r.gender} • Blood Group: <strong>{r.bloodGroup || "O+"}</strong>
                  </span>
                ),
              },
              {
                header: "Contact",
                accessor: (r: any) => (
                  <div>
                    <div className="text-xs text-slate-800">{r.phone}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.email}</div>
                  </div>
                ),
              },
              {
                header: "Allergies / Alerts",
                accessor: (r: any) =>
                  r.allergies ? (
                    <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚠️ {r.allergies}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">None Recorded</span>
                  ),
              },
              {
                header: "Actions",
                accessor: (r: any) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewHistory(r)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View EHR Profile
                  </Button>
                ),
              },
            ]}
            data={filteredPatients}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No patients match the search criteria."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 3. CLINICAL ENCOUNTERS ARCHIVE VIEW */}
      {/* ========================================================= */}
      {activeView === "encounters" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Signed Clinical Encounters & Consultations Log</span>
            </div>
          }
          subtitle="Complete archive of clinical consultations, ICD-10 diagnoses, and clinical findings"
        >
          <Table
            columns={[
              {
                header: "Encounter Date",
                accessor: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800">{new Date(r.encounterDate).toLocaleDateString()}</span>
                    <div className="text-xs text-slate-400">{new Date(r.encounterDate).toLocaleTimeString()}</div>
                  </div>
                ),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-blue-600">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Chief Symptoms",
                accessor: (r: any) => <span className="text-xs text-slate-700 max-w-xs block truncate">{r.symptoms}</span>,
              },
              {
                header: "Diagnoses (ICD-10)",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {r.diagnoses?.map((d: any) => (
                      <span
                        key={d.id}
                        className="inline-block text-[11px] font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 mr-1"
                      >
                        {d.diagnosisName} ({d.icdCode})
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: "Vitals Summary",
                accessor: (r: any) => <span className="text-xs font-mono text-slate-600">{r.vitalsSummary || "N/A"}</span>,
              },
              {
                header: "Actions",
                accessor: (r: any) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEncounterDetailModal(r)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Details
                  </Button>
                ),
              },
            ]}
            data={encounters}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No clinical encounters recorded yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 4. PRESCRIPTION REGISTRY VIEW */}
      {/* ========================================================= */}
      {activeView === "prescriptions" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <span>Doctor Prescription Builder & Issued Drugs Log</span>
              </div>
              <Button size="sm" onClick={() => setDirectRxModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                + Issue New Prescription
              </Button>
            </div>
          }
          subtitle="Issued pharmacological prescriptions, dosage schedules, and dispensing fulfillment status"
        >
          <Table
            columns={[
              {
                header: "Prescription Date",
                accessor: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800">{new Date(r.date || r.encounterDate).toLocaleDateString()}</span>
                  </div>
                ),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-blue-600">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Prescribed Drugs & Regimen",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {r.items?.map((item: any, idx: number) => (
                      <div key={idx} className="text-xs bg-slate-50 p-1.5 rounded border border-slate-200">
                        <strong className="text-slate-800">{item.medicineName}</strong>
                        <span className="text-slate-500 ml-1.5">
                          ({item.dosage} • {item.frequency} • {item.durationDays} days • Qty: {item.quantity})
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                header: "Instructions",
                accessor: (r: any) => <span className="text-xs italic text-slate-600">{r.instructions || "After meals"}</span>,
              },
              {
                header: "Pharmacy Status",
                accessor: (r: any) => {
                  const map: any = { DISPENSED: "success", PENDING: "warning", CANCELLED: "danger" };
                  return <Badge variant={map[r.status] || "neutral"} dot>{r.status || "PENDING"}</Badge>;
                },
              },
              {
                header: "View",
                accessor: (r: any) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRxDetailModal(r)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Rx
                  </Button>
                ),
              },
            ]}
            data={prescriptionsList}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No prescriptions issued yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 5. DIAGNOSTIC ORDERS VIEW */}
      {/* ========================================================= */}
      {activeView === "lab-orders" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              <span>Diagnostic Orders & Pathology Tests Tracker</span>
            </div>
          }
          subtitle="Real-time test progression from order creation to sample collection, analysis, and report generation"
        >
          <Table
            columns={[
              {
                header: "Order #",
                accessor: (r: any) => <span className="font-mono font-bold text-blue-700 text-xs">{r.orderNumber}</span>,
              },
              {
                header: "Patient Details",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-slate-500">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Ordered Tests",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {r.items?.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-block text-xs bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200 mr-1"
                      >
                        {item.testName} (₹{item.price})
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: "Clinical Notes",
                accessor: (r: any) => <span className="text-xs text-slate-600">{r.clinicalNotes || "Routine investigation"}</span>,
              },
              {
                header: "Status",
                accessor: (r: any) => {
                  const map: any = {
                    COMPLETED: "success",
                    PROCESSING: "warning",
                    SAMPLE_COLLECTED: "info",
                    ORDERED: "neutral",
                  };
                  return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                },
              },
              {
                header: "Order Date",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-500">{new Date(r.orderDate).toLocaleDateString()}</span>
                ),
              },
            ]}
            data={labOrders}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No diagnostic lab orders created yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 6. STAFF LEAVE REQUESTS VIEW */}
      {/* ========================================================= */}
      {activeView === "leave" && (
        <StaffLeaveView roleTitle={`Dr. ${user?.firstName} ${user?.lastName}`} departmentName="Clinical Consultation & OPD" />
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Consultation Studio Modal */}
      <Modal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-blue-900">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <span>
              Consultation Studio: {selectedAppt?.patient?.firstName} {selectedAppt?.patient?.lastName} ({selectedAppt?.patient?.uhid})
            </span>
          </div>
        }
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveConsultation} className="space-y-5">
          {/* Vitals Summary Banner */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Recorded Vitals:</span>
            <input
              type="text"
              value={consultForm.vitalsSummary}
              onChange={(e) => setConsultForm({ ...consultForm, vitalsSummary: e.target.value })}
              className="bg-white border rounded px-3 py-1 text-slate-800 font-mono text-xs w-2/3"
            />
          </div>

          {/* Symptoms & Clinical Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Symptoms & Complaints</label>
              <textarea
                rows={2}
                required
                value={consultForm.symptoms}
                onChange={(e) => setConsultForm({ ...consultForm, symptoms: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-xs p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Clinical Examination & Notes</label>
              <textarea
                rows={2}
                value={consultForm.notes}
                onChange={(e) => setConsultForm({ ...consultForm, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-xs p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Diagnosis (ICD-10)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Diagnosis Name"
                  required
                  value={consultForm.diagnosisName}
                  onChange={(e) => setConsultForm({ ...consultForm, diagnosisName: e.target.value })}
                />
              </div>
              <Input
                label="ICD-10 Code"
                value={consultForm.icdCode}
                onChange={(e) => setConsultForm({ ...consultForm, icdCode: e.target.value })}
              />
            </div>
          </div>

          {/* Prescription Builder */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-amber-600" /> Prescription Drugs
              </h4>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  setConsultForm({
                    ...consultForm,
                    prescriptions: [
                      ...consultForm.prescriptions,
                      { medicineName: medicines[0]?.name || "Pantoprazole 40mg", dosage: "40mg", frequency: "1-0-0", durationDays: 7, quantity: 7 },
                    ],
                  })
                }
              >
                + Add Drug
              </Button>
            </div>

            <div className="space-y-2">
              {consultForm.prescriptions.map((rx, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-amber-200/80 items-center text-xs">
                  <div className="col-span-4">
                    <select
                      value={rx.medicineName}
                      onChange={(e) => {
                        const updated = [...consultForm.prescriptions];
                        updated[idx].medicineName = e.target.value;
                        setConsultForm({ ...consultForm, prescriptions: updated });
                      }}
                      className="w-full border rounded p-1.5 text-xs text-slate-800"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={rx.dosage}
                      onChange={(e) => {
                        const updated = [...consultForm.prescriptions];
                        updated[idx].dosage = e.target.value;
                        setConsultForm({ ...consultForm, prescriptions: updated });
                      }}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Freq (1-0-1)"
                      value={rx.frequency}
                      onChange={(e) => {
                        const updated = [...consultForm.prescriptions];
                        updated[idx].frequency = e.target.value;
                        setConsultForm({ ...consultForm, prescriptions: updated });
                      }}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Days"
                      value={rx.durationDays}
                      onChange={(e) => {
                        const updated = [...consultForm.prescriptions];
                        updated[idx].durationDays = parseInt(e.target.value, 10);
                        updated[idx].quantity = parseInt(e.target.value, 10) * 2;
                        setConsultForm({ ...consultForm, prescriptions: updated });
                      }}
                      className="w-full border rounded p-1.5 text-xs"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = consultForm.prescriptions.filter((_, i) => i !== idx);
                        setConsultForm({ ...consultForm, prescriptions: updated });
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Lab Order Checklist */}
          <div className="p-4 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-2">
            <h4 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-cyan-600" /> Order Diagnostic Lab Tests (Optional)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {labTests.map((t) => {
                const isSelected = consultForm.selectedLabTests.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected ? "bg-cyan-100/70 border-cyan-400 font-semibold" : "bg-white border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConsultForm({
                            ...consultForm,
                            selectedLabTests: [...consultForm.selectedLabTests, t.id],
                          });
                        } else {
                          setConsultForm({
                            ...consultForm,
                            selectedLabTests: consultForm.selectedLabTests.filter((id) => id !== t.id),
                          });
                        }
                      }}
                      className="rounded text-cyan-600"
                    />
                    <span>{t.name} (₹{t.price})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">
              * Automatically signs encounter, attaches ICD-10 diagnosis, dispatches Rx to Pharmacy, and creates OPD billing charge.
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setConsultModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={consultLoading}>
                Complete & Sign Consultation
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Direct Prescription Modal */}
      <Modal
        isOpen={directRxModalOpen}
        onClose={() => setDirectRxModalOpen(false)}
        title="Issue Direct Prescription"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateDirectRx} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Patient</label>
            <select
              value={directRxForm.patientId}
              onChange={(e) => setDirectRxForm({ ...directRxForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Doctor's Regimen Instructions"
            value={directRxForm.instructions}
            onChange={(e) => setDirectRxForm({ ...directRxForm, instructions: e.target.value })}
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Prescription Line Items</label>
            {directRxForm.items.map((rx, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-center text-xs">
                <div className="col-span-5">
                  <select
                    value={rx.medicineName}
                    onChange={(e) => {
                      const updated = [...directRxForm.items];
                      updated[idx].medicineName = e.target.value;
                      setDirectRxForm({ ...directRxForm, items: updated });
                    }}
                    className="w-full border rounded p-1.5 text-xs text-slate-800"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={rx.dosage}
                    onChange={(e) => {
                      const updated = [...directRxForm.items];
                      updated[idx].dosage = e.target.value;
                      setDirectRxForm({ ...directRxForm, items: updated });
                    }}
                    className="w-full border rounded p-1.5 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={rx.frequency}
                    onChange={(e) => {
                      const updated = [...directRxForm.items];
                      updated[idx].frequency = e.target.value;
                      setDirectRxForm({ ...directRxForm, items: updated });
                    }}
                    className="w-full border rounded p-1.5 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Days"
                    value={rx.durationDays}
                    onChange={(e) => {
                      const updated = [...directRxForm.items];
                      updated[idx].durationDays = parseInt(e.target.value, 10);
                      updated[idx].quantity = parseInt(e.target.value, 10) * 2;
                      setDirectRxForm({ ...directRxForm, items: updated });
                    }}
                    className="w-full border rounded p-1.5 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setDirectRxModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={directRxLoading}>
              Dispatch Prescription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Electronic Health Record (EHR): ${selectedPatientForHistory?.firstName || ""} ${selectedPatientForHistory?.lastName || ""} (${selectedPatientForHistory?.uhid || ""})`}
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Patient Overview */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold text-blue-900">Demographics:</span> {selectedPatientForHistory?.gender} • Blood Group: {selectedPatientForHistory?.bloodGroup || "O+"} • Phone: {selectedPatientForHistory?.phone}
            </div>
            {selectedPatientForHistory?.allergies && (
              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                Allergies: {selectedPatientForHistory.allergies}
              </span>
            )}
          </div>

          {/* Encounters Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Past Clinical Encounters</h4>
            {(!patientHistory?.encounters || patientHistory.encounters.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No previous clinical encounters on file.</p>
            ) : (
              patientHistory.encounters.map((enc: any) => (
                <div key={enc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-800 border-b pb-1.5">
                    <span>{new Date(enc.encounterDate).toLocaleDateString()}</span>
                    <span className="text-blue-700">
                      Dr. {enc.doctor?.employee?.user?.firstName} {enc.doctor?.employee?.user?.lastName} ({enc.doctor?.department?.name})
                    </span>
                  </div>
                  <p className="text-slate-700"><strong>Symptoms:</strong> {enc.symptoms}</p>
                  <p className="text-slate-700"><strong>Notes:</strong> {enc.notes}</p>
                  <div className="text-slate-600 font-mono text-[11px]">Vitals: {enc.vitalsSummary || "Standard"}</div>
                  <div className="pt-1 text-teal-700 font-semibold">
                    Diagnoses: {enc.diagnoses?.map((d: any) => `${d.diagnosisName} [${d.icdCode}]`).join(", ")}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Diagnostic Reports */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Diagnostic & Lab Reports</h4>
            {(!patientHistory?.reports || patientHistory.reports.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No diagnostic reports uploaded.</p>
            ) : (
              patientHistory.reports.map((rep: any) => (
                <div key={rep.id} className="p-2.5 bg-cyan-50/50 rounded-lg border border-cyan-200 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-cyan-900">{rep.title}</strong>
                    <span className="text-slate-500 ml-2">({new Date(rep.reportDate).toLocaleDateString()})</span>
                  </div>
                  <Badge variant="info">{rep.type}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Encounter Detail Modal */}
      <Modal
        isOpen={!!encounterDetailModal}
        onClose={() => setEncounterDetailModal(null)}
        title="Clinical Encounter Details"
        maxWidth="lg"
      >
        {encounterDetailModal && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Patient:</span>
              <p className="text-sm font-bold text-slate-800">
                {encounterDetailModal.patient?.firstName} {encounterDetailModal.patient?.lastName} ({encounterDetailModal.patient?.uhid})
              </p>
              <span className="text-[11px] text-slate-400">
                Date: {new Date(encounterDetailModal.encounterDate).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Symptoms / Chief Complaint:</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1">{encounterDetailModal.symptoms}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Clinical Examination & Doctor Notes:</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1">{encounterDetailModal.notes}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Diagnoses:</span>
              <div className="mt-1 space-y-1">
                {encounterDetailModal.diagnoses?.map((d: any) => (
                  <div key={d.id} className="p-2 bg-blue-50 text-blue-900 rounded border border-blue-200">
                    <strong>{d.diagnosisName}</strong> ({d.icdCode}) - {d.type}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rx Detail Modal */}
      <Modal
        isOpen={!!rxDetailModal}
        onClose={() => setRxDetailModal(null)}
        title="Prescription Details"
        maxWidth="md"
      >
        {rxDetailModal && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <span className="text-amber-800 font-semibold">Patient:</span>
              <p className="text-sm font-bold text-slate-900">
                {rxDetailModal.patient?.firstName} {rxDetailModal.patient?.lastName} ({rxDetailModal.patient?.uhid})
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-500">Date: {new Date(rxDetailModal.date || rxDetailModal.encounterDate).toLocaleDateString()}</span>
                <Badge variant={rxDetailModal.status === "DISPENSED" ? "success" : "warning"}>{rxDetailModal.status || "PENDING"}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-700">Prescribed Medicines:</span>
              {rxDetailModal.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800">{item.medicineName}</div>
                  <div className="text-slate-600 mt-0.5">
                    Dosage: {item.dosage} • Frequency: {item.frequency} • Duration: {item.durationDays} Days • Qty: {item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {rxDetailModal.instructions && (
              <div className="p-2 bg-slate-100 rounded text-slate-700 italic">
                Instructions: {rxDetailModal.instructions}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
