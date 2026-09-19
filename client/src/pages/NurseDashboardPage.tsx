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
  Activity,
  HeartPulse,
  Pill,
  FileText,
  Plus,
  CheckCircle,
  Wind,
  Bed,
  PlaneTakeoff,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react";

export const NurseDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Data states
  const [beds, setBeds] = useState<any[]>([]);
  const [vitalsList, setVitalsList] = useState<any[]>([]);
  const [medicationsList, setMedicationsList] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Forms
  const [vitalsForm, setVitalsForm] = useState({
    patientId: "",
    bloodPressure: "120/80",
    temperature: 98.6,
    pulseRate: 72,
    spo2: 98,
    respiratoryRate: 18,
    weight: 70,
    notes: "Patient resting comfortably, hemodynamically stable.",
  });

  const [noteForm, setNoteForm] = useState({
    patientId: "",
    noteType: "PROGRESS",
    content: "IV fluids infused as scheduled. Patient ambulating with support.",
  });

  const [medForm, setMedForm] = useState({
    patientId: "",
    medicineName: "Ceftriaxone 1g Inj",
    dosage: "1g IV",
    status: "GIVEN",
    remarks: "Administered via central cannula without adverse reaction.",
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  // Sub-route detector
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes("/nurse/vitals")) return "vitals";
    if (path.includes("/nurse/medications")) return "medications";
    if (path.includes("/nurse/notes")) return "notes";
    if (path.includes("/nurse/leave")) return "leave";
    return "wards";
  };

  const activeView = getActiveView();

  const fetchNurseData = async () => {
    try {
      setLoading(true);
      const [bedRes, vitalsRes, medRes, noteRes] = await Promise.all([
        api.get("/ipd/beds"),
        api.get("/nursing/vitals"),
        api.get("/nursing/medications"),
        api.get("/nursing/notes"),
      ]);

      if (bedRes.data.success) setBeds(bedRes.data.beds);
      if (vitalsRes.data.success) setVitalsList(vitalsRes.data.vitals);
      if (medRes.data.success) setMedicationsList(medRes.data.schedule);
      if (noteRes.data.success) setNotesList(noteRes.data.notes);
    } catch (err) {
      console.error("Error fetching nurse station data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurseData();
  }, []);

  const openVitalsModal = (p: any) => {
    setSelectedPatient(p);
    setVitalsForm((prev) => ({ ...prev, patientId: p.id }));
    setVitalsModalOpen(true);
  };

  const openNoteModal = (p: any) => {
    setSelectedPatient(p);
    setNoteForm((prev) => ({ ...prev, patientId: p.id }));
    setNoteModalOpen(true);
  };

  const openMedModal = (p: any) => {
    setSelectedPatient(p);
    setMedForm((prev) => ({ ...prev, patientId: p.id }));
    setMedModalOpen(true);
  };

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = vitalsForm.patientId || selectedPatient?.id;
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post("/nursing/vitals", {
        patientId,
        bloodPressure: vitalsForm.bloodPressure,
        temperature: parseFloat(String(vitalsForm.temperature)),
        pulseRate: parseInt(String(vitalsForm.pulseRate), 10),
        spo2: parseInt(String(vitalsForm.spo2), 10),
        respiratoryRate: parseInt(String(vitalsForm.respiratoryRate), 10),
        weight: parseFloat(String(vitalsForm.weight)),
        notes: vitalsForm.notes,
      });
      setVitalsModalOpen(false);
      alert("Patient vitals successfully recorded!");
      fetchNurseData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log vitals");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = noteForm.patientId || selectedPatient?.id;
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post("/nursing/notes", {
        patientId,
        noteType: noteForm.noteType,
        content: noteForm.content,
      });
      setNoteModalOpen(false);
      alert("Nursing progress note added!");
      fetchNurseData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add note");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAdministerMed = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = medForm.patientId || selectedPatient?.id;
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post("/nursing/medications", {
        patientId,
        medicineName: medForm.medicineName,
        dosage: medForm.dosage,
        status: medForm.status,
        remarks: medForm.remarks,
      });
      setMedModalOpen(false);
      alert("Medication administration recorded!");
      fetchNurseData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record medication");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Inpatient Nursing Station..." />;

  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED" && b.admissions?.length > 0);
  const inpatients = occupiedBeds.map((b) => b.admissions[0]?.patient).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Nurse Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 rounded-2xl p-6 text-white shadow-md border border-teal-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
            <Activity className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sister {user?.firstName} {user?.lastName}</h2>
            <p className="text-xs text-teal-200 mt-0.5">
              Inpatient Nursing Station • Intensive Care & General Ward Duty • AegisCare CareOS
            </p>
          </div>
        </div>

        {/* Sub-module Navigation Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/nurse")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "wards" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Ward Inpatients ({occupiedBeds.length})</span>
          </button>
          <button
            onClick={() => navigate("/nurse/vitals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "vitals" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Vitals Monitor ({vitalsList.length})</span>
          </button>
          <button
            onClick={() => navigate("/nurse/medications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "medications" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Med Admin Log ({medicationsList.length})</span>
          </button>
          <button
            onClick={() => navigate("/nurse/notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "notes" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nursing Notes ({notesList.length})</span>
          </button>
          <button
            onClick={() => navigate("/nurse/leave")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "leave" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Staff Leave</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. WARD INPATIENTS ROSTER VIEW */}
      {/* ========================================================= */}
      {activeView === "wards" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Active Inpatients</span>
              <p className="text-2xl font-black text-teal-600 mt-1">{occupiedBeds.length} Patients</p>
              <span className="text-[11px] text-slate-400">Under active nursing care</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Ward Beds</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{beds.length} Beds</p>
              <span className="text-[11px] text-slate-400">
                {beds.filter((b) => b.status === "AVAILABLE").length} available for admission
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Vitals Recorded Today</span>
              <p className="text-2xl font-black text-cyan-600 mt-1">{vitalsList.length} Entries</p>
              <span className="text-[11px] text-slate-400">Telemetry logs active</span>
            </div>
          </div>

          <Card
            title={
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <span>Active Inpatient Roster & Nursing Station Duty</span>
              </div>
            }
            subtitle="Record vital signs, nursing notes, and medication administrations for admitted patients"
          >
            <Table
              columns={[
                {
                  header: "Bed / Ward",
                  accessor: (r: any) => (
                    <div>
                      <span className="font-mono font-bold text-slate-900">{r.bedNumber}</span>
                      <div className="text-xs text-slate-500">{r.ward?.name} ({r.type})</div>
                    </div>
                  ),
                },
                {
                  header: "Patient Details",
                  accessor: (r: any) => {
                    const p = r.admissions?.[0]?.patient;
                    return (
                      <div>
                        <div className="font-bold text-slate-800">{p?.firstName} {p?.lastName}</div>
                        <div className="text-xs text-slate-500 font-mono">{p?.uhid} • Phone: {p?.phone}</div>
                      </div>
                    );
                  },
                },
                {
                  header: "Admitted By Doctor",
                  accessor: (r: any) => {
                    const doc = r.admissions?.[0]?.doctor;
                    return (
                      <span className="text-xs text-slate-700">
                        Dr. {doc?.employee?.user?.firstName} {doc?.employee?.user?.lastName} ({doc?.department?.name})
                      </span>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: () => <Badge variant="danger" dot>OCCUPIED</Badge>,
                },
                {
                  header: "Nursing Actions",
                  accessor: (r: any) => {
                    const p = r.admissions?.[0]?.patient;
                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openVitalsModal(p)}
                          icon={<HeartPulse className="w-3.5 h-3.5 text-teal-600" />}
                        >
                          Vitals
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openNoteModal(p)}
                          icon={<FileText className="w-3.5 h-3.5" />}
                        >
                          Note
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openMedModal(p)}
                          icon={<Pill className="w-3.5 h-3.5" />}
                        >
                          Med Admin
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={occupiedBeds}
              keyExtractor={(r: any) => r.id}
              emptyMessage="No active inpatients assigned in this ward currently."
            />
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VITALS MONITOR & TRENDS VIEW */}
      {/* ========================================================= */}
      {activeView === "vitals" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <span>Patient Vitals Telemetry & Clinical Observations</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (inpatients.length > 0) {
                    openVitalsModal(inpatients[0]);
                  } else {
                    alert("No admitted patients available.");
                  }
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                + Record Vitals
              </Button>
            </div>
          }
          subtitle="Continuous inpatient vital telemetry: BP, Temperature, Pulse Rate, SpO2, and Respiratory Rate"
        >
          <Table
            columns={[
              {
                header: "Recorded Date & Time",
                accessor: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800">{new Date(r.recordedAt).toLocaleDateString()}</span>
                    <div className="text-xs text-slate-400">{new Date(r.recordedAt).toLocaleTimeString()}</div>
                  </div>
                ),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-teal-700">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Blood Pressure",
                accessor: (r: any) => <span className="font-mono font-bold text-slate-900">{r.bloodPressure} mmHg</span>,
              },
              {
                header: "Temperature",
                accessor: (r: any) => (
                  <span className={`font-mono text-xs ${r.temperature > 99.5 ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                    {r.temperature}°F
                  </span>
                ),
              },
              {
                header: "Pulse & SpO2",
                accessor: (r: any) => (
                  <div>
                    <span className="font-mono text-xs text-slate-800">{r.pulseRate} bpm</span>
                    <span className={`ml-2 text-xs font-bold ${r.spo2 < 95 ? "text-rose-600" : "text-emerald-700"}`}>
                      SpO2: {r.spo2}%
                    </span>
                  </div>
                ),
              },
              {
                header: "Resp / Weight",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-600 font-mono">
                    {r.respiratoryRate ? `${r.respiratoryRate}/min` : "-"} • {r.weight ? `${r.weight} kg` : "-"}
                  </span>
                ),
              },
              {
                header: "Nurse Notes",
                accessor: (r: any) => <span className="text-xs text-slate-600 max-w-xs block truncate">{r.notes || "Stable"}</span>,
              },
            ]}
            data={vitalsList}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No vitals logged yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 3. MEDICATION ADMINISTRATION LOG VIEW */}
      {/* ========================================================= */}
      {activeView === "medications" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>Medication Administration Record (MAR)</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (inpatients.length > 0) {
                    openMedModal(inpatients[0]);
                  } else {
                    alert("No admitted patients available.");
                  }
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                + Administer Medication
              </Button>
            </div>
          }
          subtitle="Audit log of drugs, IV fluids, and injections administered to admitted patients"
        >
          <Table
            columns={[
              {
                header: "Administered At",
                accessor: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800">{new Date(r.administeredAt).toLocaleDateString()}</span>
                    <div className="text-xs text-slate-400">{new Date(r.administeredAt).toLocaleTimeString()}</div>
                  </div>
                ),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-teal-700">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Medicine & Dosage",
                accessor: (r: any) => (
                  <div>
                    <strong className="text-slate-900">{r.medicineName}</strong>
                    <div className="text-xs text-slate-500">{r.dosage}</div>
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: (r: any) => {
                  const map: any = { GIVEN: "success", MISSED: "danger", REFUSED: "warning" };
                  return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                },
              },
              {
                header: "Sister / Remarks",
                accessor: (r: any) => (
                  <div>
                    <span className="text-xs text-slate-700 block">{r.remarks || "Standard administration"}</span>
                    <span className="text-[11px] text-slate-400">
                      By: {r.nurse?.employee?.user?.firstName || user?.firstName} {r.nurse?.employee?.user?.lastName || user?.lastName}
                    </span>
                  </div>
                ),
              },
            ]}
            data={medicationsList}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No medication administrations recorded yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 4. NURSING PROGRESS & HANDOVER NOTES VIEW */}
      {/* ========================================================= */}
      {activeView === "notes" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span>Nursing Progress Notes & Shift Handover Logs</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (inpatients.length > 0) {
                    openNoteModal(inpatients[0]);
                  } else {
                    alert("No admitted patients available.");
                  }
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Nursing Note
              </Button>
            </div>
          }
          subtitle="Clinical progress tracking, handover observations, and incident documentation"
        >
          <Table
            columns={[
              {
                header: "Date & Time",
                accessor: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800">{new Date(r.recordedAt).toLocaleDateString()}</span>
                    <div className="text-xs text-slate-400">{new Date(r.recordedAt).toLocaleTimeString()}</div>
                  </div>
                ),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs font-mono text-teal-700">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Note Classification",
                accessor: (r: any) => <Badge variant="info">{r.noteType}</Badge>,
              },
              {
                header: "Content / Clinical Observations",
                accessor: (r: any) => <p className="text-xs text-slate-800 max-w-md">{r.content}</p>,
              },
              {
                header: "Recorded By",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-600">
                    Sister {r.nurse?.employee?.user?.firstName || user?.firstName} {r.nurse?.employee?.user?.lastName || user?.lastName}
                  </span>
                ),
              },
            ]}
            data={notesList}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No nursing notes recorded yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 5. STAFF LEAVE VIEW */}
      {/* ========================================================= */}
      {activeView === "leave" && (
        <StaffLeaveView roleTitle={`Sister ${user?.firstName} ${user?.lastName}`} departmentName="Inpatient Ward & Intensive Care Nursing" />
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Record Vitals Modal */}
      <Modal
        isOpen={vitalsModalOpen}
        onClose={() => setVitalsModalOpen(false)}
        title={`Record Vitals: ${selectedPatient?.firstName || "Patient"} ${selectedPatient?.lastName || ""} (${selectedPatient?.uhid || ""})`}
      >
        <form onSubmit={handleRecordVitals} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Inpatient</label>
            <select
              value={vitalsForm.patientId || selectedPatient?.id}
              onChange={(e) => setVitalsForm({ ...vitalsForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {inpatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Blood Pressure (mmHg)"
              required
              placeholder="e.g. 120/80"
              value={vitalsForm.bloodPressure}
              onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
            />
            <Input
              label="Temperature (°F)"
              type="number"
              step="0.1"
              required
              value={vitalsForm.temperature}
              onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Pulse Rate (bpm)"
              type="number"
              required
              value={vitalsForm.pulseRate}
              onChange={(e) => setVitalsForm({ ...vitalsForm, pulseRate: parseInt(e.target.value, 10) })}
            />
            <Input
              label="SpO2 (%)"
              type="number"
              required
              value={vitalsForm.spo2}
              onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: parseInt(e.target.value, 10) })}
            />
            <Input
              label="Resp. Rate (/min)"
              type="number"
              value={vitalsForm.respiratoryRate}
              onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: parseInt(e.target.value, 10) })}
            />
          </div>

          <Input
            label="Clinical Observations / Patient State"
            value={vitalsForm.notes}
            onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setVitalsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Save Vitals Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Nursing Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={`Add Nursing Note: ${selectedPatient?.firstName || "Patient"}`}
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Inpatient</label>
            <select
              value={noteForm.patientId || selectedPatient?.id}
              onChange={(e) => setNoteForm({ ...noteForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {inpatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Note Classification</label>
            <select
              value={noteForm.noteType}
              onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              <option value="PROGRESS">Daily Progress Note</option>
              <option value="SHIFT_HANDOVER">Shift Handover Note</option>
              <option value="GENERAL">General Care Observation</option>
              <option value="INCIDENT">Incident / Reaction Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Note Content</label>
            <textarea
              rows={4}
              required
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm p-3 text-slate-800"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Record Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Medication Admin Modal */}
      <Modal
        isOpen={medModalOpen}
        onClose={() => setMedModalOpen(false)}
        title={`Administer Medication: ${selectedPatient?.firstName || "Patient"}`}
      >
        <form onSubmit={handleAdministerMed} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Inpatient</label>
            <select
              value={medForm.patientId || selectedPatient?.id}
              onChange={(e) => setMedForm({ ...medForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {inpatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Medicine Name"
            required
            value={medForm.medicineName}
            onChange={(e) => setMedForm({ ...medForm, medicineName: e.target.value })}
          />
          <Input
            label="Dosage & Route"
            required
            placeholder="e.g. 1g IV / 500mg Oral"
            value={medForm.dosage}
            onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Administration Status</label>
            <select
              value={medForm.status}
              onChange={(e) => setMedForm({ ...medForm, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              <option value="GIVEN">Given / Administered</option>
              <option value="MISSED">Missed</option>
              <option value="REFUSED">Patient Refused</option>
            </select>
          </div>
          <Input
            label="Remarks / Reaction Observations"
            value={medForm.remarks}
            onChange={(e) => setMedForm({ ...medForm, remarks: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setMedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Record Administration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
