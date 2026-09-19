import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  Bed,
  Building,
  UserPlus,
  LogOut,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export const IpdBedManagementPage: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admission Modal
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    doctorId: "",
    reason: "Observation and supportive inpatient therapy",
  });
  const [admitLoading, setAdmitLoading] = useState(false);

  // Discharge Modal
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [dischargeForm, setDischargeForm] = useState({
    finalDiagnosis: "Resolved. Patient clinically stable.",
    conditionAtDischarge: "STABLE",
    dischargeType: "REGULAR",
    instructions: "Continue medications as prescribed. Review in OPD in 1 week.",
  });
  const [dischargeLoading, setDischargeLoading] = useState(false);

  const fetchIpdData = async () => {
    try {
      setLoading(true);
      const [wardRes, patRes, docRes] = await Promise.all([
        api.get("/ipd/wards"),
        api.get("/patients"),
        api.get("/hrms/employees"),
      ]);

      if (wardRes.data.success) setWards(wardRes.data.wards);
      if (patRes.data.success) setPatients(patRes.data.patients);
      if (docRes.data.success) {
        const docs = docRes.data.employees.filter((e: any) => e.user?.role === "DOCTOR");
        setDoctors(docs);
        if (docs.length > 0 && !admitForm.doctorId) {
          setAdmitForm((prev) => ({ ...prev, doctorId: docs[0].user?.doctorId || docs[0].id }));
        }
      }
      if (patRes.data.success && patRes.data.patients.length > 0 && !admitForm.patientId) {
        setAdmitForm((prev) => ({ ...prev, patientId: patRes.data.patients[0].id }));
      }
    } catch (err) {
      console.error("Error fetching IPD data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpdData();
  }, []);

  const openAdmitDialog = (bed: any) => {
    setSelectedBed(bed);
    setAdmitModalOpen(true);
  };

  const openDischargeDialog = (admission: any) => {
    setSelectedAdmission(admission);
    setDischargeModalOpen(true);
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    setAdmitLoading(true);

    try {
      const res = await api.post("/ipd/admit", {
        bedId: selectedBed.id,
        wardId: selectedBed.wardId,
        patientId: admitForm.patientId,
        doctorId: admitForm.doctorId,
        reason: admitForm.reason,
      });

      if (res.data.success) {
        setAdmitModalOpen(false);
        alert(`Patient successfully admitted to Bed ${selectedBed.bedNumber}!`);
        fetchIpdData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to admit patient");
    } finally {
      setAdmitLoading(false);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setDischargeLoading(true);

    try {
      const res = await api.post("/ipd/discharge", {
        admissionId: selectedAdmission.id,
        finalDiagnosis: dischargeForm.finalDiagnosis,
        conditionAtDischarge: dischargeForm.conditionAtDischarge,
        dischargeType: dischargeForm.dischargeType,
        instructions: dischargeForm.instructions,
      });

      if (res.data.success) {
        setDischargeModalOpen(false);
        alert("Patient discharged successfully! Bed released to AVAILABLE & stay charges added to billing.");
        fetchIpdData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to discharge patient");
    } finally {
      setDischargeLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Ward & Bed Matrix..." />;

  let totalBeds = 0;
  let occupiedCount = 0;
  wards.forEach((w) => {
    w.beds?.forEach((b: any) => {
      totalBeds++;
      if (b.status === "OCCUPIED") occupiedCount++;
    });
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-teal-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
            <Bed className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">IPD Wards & Live Bed Occupancy Matrix</h2>
            <p className="text-xs text-teal-200 mt-0.5">
              Visual Bed Allocation • Concurrency Locking • Admission & Discharge Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Bed Capacity</span>
            <p className="text-lg font-extrabold text-teal-300">
              {occupiedCount} / {totalBeds} Occupied ({totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* Ward Cards */}
      <div className="space-y-6">
        {wards.map((ward) => (
          <Card
            key={ward.id}
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  <span className="font-bold">{ward.name}</span>
                  <span className="text-xs text-slate-500">({ward.code} • Floor {ward.floor})</span>
                </div>
                <Badge variant="primary">{ward.type}</Badge>
              </div>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(ward.beds || []).map((bed: any) => {
                const isOccupied = bed.status === "OCCUPIED";
                const activeAdm = bed.admissions?.[0];
                return (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isOccupied
                        ? "bg-rose-50/60 border-rose-200 shadow-xs"
                        : "bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900">{bed.bedNumber}</span>
                        <Badge variant={isOccupied ? "danger" : "success"} size="sm">
                          {bed.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{bed.type} • ₹{bed.dailyRate}/day</p>

                      {isOccupied && activeAdm && (
                        <div className="mt-3 pt-2 border-t border-rose-200/80">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {activeAdm.patient?.firstName} {activeAdm.patient?.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">{activeAdm.patient?.uhid}</p>
                          <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">
                            {activeAdm.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2">
                      {isOccupied ? (
                        <Button
                          size="sm"
                          variant="danger"
                          className="w-full text-xs py-1"
                          onClick={() => openDischargeDialog(activeAdm)}
                          icon={<LogOut className="w-3 h-3" />}
                        >
                          Discharge
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs py-1 text-emerald-700 border-emerald-300 hover:bg-emerald-100/50"
                          onClick={() => openAdmitDialog(bed)}
                          icon={<UserPlus className="w-3 h-3" />}
                        >
                          Admit Patient
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Admit Patient Modal */}
      <Modal
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        title={`Admit Patient to Bed ${selectedBed?.bedNumber}`}
      >
        <form onSubmit={handleAdmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Patient</label>
            <select
              value={admitForm.patientId}
              onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.uhid}) - {p.gender}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attending Specialist</label>
            <select
              value={admitForm.doctorId}
              onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.doctor?.id || d.id}>
                  Dr. {d.user?.firstName} {d.user?.lastName} ({d.department?.name})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Admission Reason / Clinical Indication"
            required
            value={admitForm.reason}
            onChange={(e) => setAdmitForm({ ...admitForm, reason: e.target.value })}
          />

          <p className="text-xs text-slate-500 italic">
            * Admission uses a database transaction: checks bed availability, assigns bed, and locks status to OCCUPIED.
          </p>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={admitLoading}>
              Confirm Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title="Discharge Inpatient"
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <strong>Patient:</strong> {selectedAdmission?.patient?.firstName} {selectedAdmission?.patient?.lastName} ({selectedAdmission?.patient?.uhid})
          </div>

          <Input
            label="Final Clinical Diagnosis"
            required
            value={dischargeForm.finalDiagnosis}
            onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Condition at Discharge</label>
              <select
                value={dischargeForm.conditionAtDischarge}
                onChange={(e) => setDischargeForm({ ...dischargeForm, conditionAtDischarge: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              >
                <option value="STABLE">Stable</option>
                <option value="IMPROVED">Improved</option>
                <option value="CRITICAL">Transferred to Higher Center</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Discharge Type</label>
              <select
                value={dischargeForm.dischargeType}
                onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              >
                <option value="REGULAR">Regular Medical Discharge</option>
                <option value="LAMA">LAMA (Against Advice)</option>
                <option value="TRANSFER">Inter-hospital Transfer</option>
              </select>
            </div>
          </div>

          <Input
            label="Discharge Summary & Post-Care Instructions"
            value={dischargeForm.instructions}
            onChange={(e) => setDischargeForm({ ...dischargeForm, instructions: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setDischargeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={dischargeLoading} variant="danger">
              Complete Discharge & Release Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
