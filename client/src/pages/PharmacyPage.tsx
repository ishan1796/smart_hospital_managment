import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Table } from "../components/common/Table";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { StaffLeaveView } from "../components/common/StaffLeaveView";
import {
  Pill,
  CheckCircle,
  Clock,
  Layers,
  Search,
  ShoppingCart,
  PlaneTakeoff
} from "lucide-react";

export const PharmacyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispense Modal
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [dispenseLoading, setDispenseLoading] = useState(false);

  // Detect active view from URL
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes("/pharmacy/medicines")) return "inventory";
    if (path.includes("/pharmacy/leave")) return "leave";
    return "queue";
  };

  const activeView = getActiveView();

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const [rxRes, medRes] = await Promise.all([
        api.get("/pharmacy/prescriptions"),
        api.get("/pharmacy/medicines"),
      ]);

      if (rxRes.data.success) setPrescriptions(rxRes.data.prescriptions);
      if (medRes.data.success) setMedicines(medRes.data.medicines);
    } catch (err) {
      console.error("Error fetching pharmacy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const openDispenseDialog = (rx: any) => {
    setSelectedRx(rx);
    setDispenseModalOpen(true);
  };

  const handleDispense = async () => {
    if (!selectedRx) return;
    setDispenseLoading(true);
    try {
      const itemsPayload = selectedRx.items.map((item: any) => ({
        medicineId: item.medicineId || medicines.find((m) => m.name === item.medicineName)?.id || item.id,
        quantity: item.quantity,
      }));

      const res = await api.post("/pharmacy/dispense", {
        prescriptionId: selectedRx.id,
        items: itemsPayload,
        notes: "Dispensed via Pharmacy Station",
      });

      if (res.data.success) {
        setDispenseModalOpen(false);
        alert(`Medicines dispensed successfully! Total: ₹${res.data.dispensing.totalAmount} (Auto-charge sent to Finance).`);
        fetchPharmacyData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to dispense medicines");
    } finally {
      setDispenseLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Pharmacy Station..." />;

  const pendingRx = prescriptions.filter((rx) => rx.status !== "DISPENSED");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-2xl p-6 text-white shadow-md border border-amber-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Pill className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pharmacy & Dispensing Station</h2>
            <p className="text-xs text-amber-200 mt-0.5">
              Prescription Fulfillment • Real-time Batch Stock Deductions • Auto Billing Link
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/pharmacy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "queue" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Prescription Queue ({pendingRx.length})</span>
          </button>
          <button
            onClick={() => navigate("/pharmacy/medicines")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "inventory" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Medicine Inventory ({medicines.length})</span>
          </button>
          <button
            onClick={() => navigate("/pharmacy/leave")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "leave" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Staff Leave</span>
          </button>
        </div>
      </div>

      {activeView === "queue" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Pending Prescriptions for Dispensing</span>
            </div>
          }
          subtitle="Atomic inventory deduction and charge creation"
        >
          <Table
            columns={[
              {
                header: "Date",
                accessor: (r: any) => new Date(r.date).toLocaleDateString(),
              },
              {
                header: "Patient Details",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.patient?.uhid} • {r.patient?.phone}</div>
                  </div>
                ),
              },
              {
                header: "Prescribing Doctor",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-700">
                    Dr. {r.doctor?.employee?.user?.firstName} {r.doctor?.employee?.user?.lastName} ({r.doctor?.department?.name})
                  </span>
                ),
              },
              {
                header: "Prescribed Drugs",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {(r.items || []).map((item: any) => (
                      <span key={item.id} className="inline-block mr-1 text-[11px] px-2 py-0.5 bg-slate-100 rounded border font-medium">
                        {item.medicineName} ({item.quantity} qty)
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: (r: any) => (
                  <Badge variant={r.status === "DISPENSED" ? "success" : "warning"}>{r.status}</Badge>
                ),
              },
              {
                header: "Action",
                accessor: (r: any) =>
                  r.status !== "DISPENSED" ? (
                    <Button
                      size="sm"
                      onClick={() => openDispenseDialog(r)}
                      icon={<ShoppingCart className="w-3.5 h-3.5" />}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Dispense
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Dispensed
                    </span>
                  ),
              },
            ]}
            data={prescriptions}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No pending prescriptions in queue."
          />
        </Card>
      )}

      {activeView === "inventory" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Pharmaceutical Drug Stock Directory</span>
            </div>
          }
          subtitle="Real-time quantities and pricing"
        >
          <Table
            columns={[
              {
                header: "Medicine Name & Strength",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">Generic: {r.genericName}</div>
                  </div>
                ),
              },
              { header: "Category", accessor: (r: any) => <Badge variant="neutral">{r.category}</Badge> },
              { header: "Form", accessor: "form" },
              {
                header: "Unit Price",
                accessor: (r: any) => <span className="font-mono font-semibold">₹{r.unitPrice.toFixed(2)}</span>,
              },
              {
                header: "Current Stock",
                accessor: (r: any) => (
                  <Badge variant={r.stockQuantity <= r.reorderLevel ? "danger" : "success"}>
                    {r.stockQuantity} units
                  </Badge>
                ),
              },
              {
                header: "Batches",
                accessor: (r: any) => (
                  <span className="text-xs text-slate-600 font-mono">
                    {r.batches?.map((b: any) => `${b.batchNumber} (${b.quantity})`).join(", ") || "Active"}
                  </span>
                ),
              },
            ]}
            data={medicines}
            keyExtractor={(r: any) => r.id}
          />
        </Card>
      )}

      {activeView === "leave" && (
        <StaffLeaveView roleTitle="Pharmacist / Dispenser" departmentName="Pharmacy & Drug Store" />
      )}

      {/* Dispense Confirmation Modal */}
      <Modal
        isOpen={dispenseModalOpen}
        onClose={() => setDispenseModalOpen(false)}
        title="Fulfill & Dispense Prescription"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Patient:</strong> {selectedRx?.patient?.firstName} {selectedRx?.patient?.lastName} ({selectedRx?.patient?.uhid})
          </div>

          <div className="border rounded-xl overflow-hidden divide-y divide-slate-100">
            {(selectedRx?.items || []).map((item: any) => (
              <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{item.medicineName}</div>
                  <div className="text-slate-500">Dosage: {item.dosage} • {item.frequency} for {item.durationDays} days</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 font-mono text-sm">{item.quantity} units</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 italic">
            * Dispensing will atomically deduct batch quantities, log a transaction, and generate an itemized Charge for the billing department.
          </p>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDispenseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDispense}
              loading={dispenseLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirm Dispensing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
