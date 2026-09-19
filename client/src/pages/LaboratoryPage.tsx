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
  FlaskConical,
  CheckCircle,
  FileText,
  Clock,
  QrCode,
  Edit3,
  PlaneTakeoff,
  Search
} from "lucide-react";

export const LaboratoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Result Entry Modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, { value: string; isAbnormal: boolean; remarks: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Detect active view from path
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes("/lab/results")) return "results";
    if (path.includes("/lab/leave")) return "leave";
    return "orders";
  };

  const activeView = getActiveView();

  const fetchLabData = async () => {
    try {
      setLoading(true);
      const [orderRes, testRes] = await Promise.all([
        api.get("/lab/orders"),
        api.get("/lab/tests"),
      ]);

      if (orderRes.data.success) setOrders(orderRes.data.orders);
      if (testRes.data.success) setTests(testRes.data.tests);
    } catch (err) {
      console.error("Error fetching lab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  const handleCollectSample = async (orderId: string) => {
    try {
      const res = await api.post(`/lab/orders/${orderId}/sample`, { sampleType: "BLOOD" });
      if (res.data.success) {
        alert(`Sample collected! Barcode: ${res.data.sample.barcode}`);
        fetchLabData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to collect sample");
    }
  };

  const openResultDialog = (order: any) => {
    setSelectedOrder(order);
    const initialInputs: Record<string, any> = {};
    order.items.forEach((item: any) => {
      initialInputs[item.labTestId] = {
        value: "Normal Range Value (e.g. 14.5 g/dL)",
        isAbnormal: false,
        remarks: "Sample analyzed on automated analyzer. Results verified.",
      };
    });
    setResultInputs(initialInputs);
    setResultModalOpen(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);

    try {
      const resultsPayload = selectedOrder.items.map((item: any) => {
        const input = resultInputs[item.labTestId] || {};
        return {
          labTestId: item.labTestId,
          resultValue: input.value || "Normal",
          isAbnormal: Boolean(input.isAbnormal),
          remarks: input.remarks || "",
        };
      });

      const res = await api.post(`/lab/orders/${selectedOrder.id}/results`, {
        results: resultsPayload,
      });

      if (res.data.success) {
        setResultModalOpen(false);
        alert("Lab test results entered and diagnostic report published! Auto-charge sent to billing.");
        fetchLabData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit results");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Laboratory Orders..." />;

  const pendingSampleOrders = orders.filter((o) => o.status === "ORDERED");
  const processingOrders = orders.filter((o) => o.status === "SAMPLE_COLLECTED" || o.status === "PROCESSING");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-900 rounded-2xl p-6 text-white shadow-md border border-cyan-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <FlaskConical className="w-7 h-7 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Diagnostic Laboratory Operations</h2>
            <p className="text-xs text-cyan-200 mt-0.5">
              Specimen Tracking • Barcode Verification • Diagnostic Pathology Reports
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/lab")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "orders" ? "bg-cyan-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Orders Queue ({orders.length})</span>
          </button>
          <button
            onClick={() => navigate("/lab/results")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "results" ? "bg-cyan-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Results Entry ({processingOrders.length} Ready)</span>
          </button>
          <button
            onClick={() => navigate("/lab/leave")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "leave" ? "bg-cyan-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Staff Leave</span>
          </button>
        </div>
      </div>

      {activeView === "orders" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-600" />
              <span>Diagnostic Orders & Sample Queue</span>
            </div>
          }
          subtitle="Manage pending samples, test processing, and results delivery"
        >
          <Table
            columns={[
              {
                header: "Order #",
                accessor: (r: any) => <span className="font-mono font-bold text-cyan-700">{r.orderNumber}</span>,
              },
              {
                header: "Patient Details",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Tests Ordered",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {(r.items || []).map((i: any) => (
                      <span key={i.id} className="inline-block mr-1 text-[11px] px-2 py-0.5 bg-slate-100 rounded border font-medium">
                        {i.testName} (₹{i.price})
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: (r: any) => {
                  const map: any = {
                    ORDERED: "neutral",
                    SAMPLE_COLLECTED: "warning",
                    PROCESSING: "info",
                    COMPLETED: "success",
                  };
                  return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                },
              },
              {
                header: "Actions",
                accessor: (r: any) => (
                  <div className="flex items-center gap-2">
                    {r.status === "ORDERED" && (
                      <Button
                        size="sm"
                        onClick={() => handleCollectSample(r.id)}
                        icon={<QrCode className="w-3.5 h-3.5" />}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        Collect Sample
                      </Button>
                    )}
                    {r.status === "SAMPLE_COLLECTED" && (
                      <Button
                        size="sm"
                        onClick={() => openResultDialog(r)}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Enter Results
                      </Button>
                    )}
                    {r.status === "COMPLETED" && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified & Published
                      </span>
                    )}
                  </div>
                ),
              },
            ]}
            data={orders}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No diagnostic lab orders."
          />
        </Card>
      )}

      {activeView === "results" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-600" />
              <span>Specimen Results Entry & Diagnostics Station</span>
            </div>
          }
          subtitle="Record analytical readings and publish verified pathology reports"
        >
          <Table
            columns={[
              {
                header: "Order #",
                accessor: (r: any) => <span className="font-mono font-bold text-cyan-700">{r.orderNumber}</span>,
              },
              {
                header: "Patient",
                accessor: (r: any) => `${r.patient?.firstName} ${r.patient?.lastName} (${r.patient?.uhid})`,
              },
              {
                header: "Ordered Tests",
                accessor: (r: any) => (
                  <div className="space-y-1">
                    {r.items?.map((i: any) => (
                      <span key={i.id} className="inline-block mr-1 text-[11px] px-2 py-0.5 bg-cyan-50 text-cyan-900 rounded border">
                        {i.testName}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: (r: any) => <Badge variant={r.status === "COMPLETED" ? "success" : "warning"}>{r.status}</Badge>,
              },
              {
                header: "Result Entry Action",
                accessor: (r: any) =>
                  r.status !== "COMPLETED" ? (
                    <Button
                      size="sm"
                      onClick={() => openResultDialog(r)}
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Enter Test Findings
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Published to Patient EHR
                    </span>
                  ),
              },
            ]}
            data={orders.filter((o) => o.status !== "ORDERED")}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No specimens ready for result entry currently."
          />
        </Card>
      )}

      {activeView === "leave" && (
        <StaffLeaveView roleTitle="Laboratory Technician / Biochemist" departmentName="Pathology & Diagnostics" />
      )}

      {/* Result Entry Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={`Enter Diagnostic Test Results: ${selectedOrder?.orderNumber}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveResults} className="space-y-4">
          <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200 text-xs text-cyan-900">
            <strong>Patient:</strong> {selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName} ({selectedOrder?.patient?.uhid})
          </div>

          <div className="space-y-4">
            {(selectedOrder?.items || []).map((item: any) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-800 uppercase">{item.testName}</h4>
                  <span className="text-[11px] text-slate-500">Ref Range: {item.labTest?.normalRange || "Standard"}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Observed Value / Reading</label>
                    <input
                      type="text"
                      required
                      value={resultInputs[item.labTestId]?.value || ""}
                      onChange={(e) => {
                        setResultInputs({
                          ...resultInputs,
                          [item.labTestId]: { ...resultInputs[item.labTestId], value: e.target.value },
                        });
                      }}
                      className="w-full border rounded-lg p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-rose-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resultInputs[item.labTestId]?.isAbnormal || false}
                        onChange={(e) => {
                          setResultInputs({
                            ...resultInputs,
                            [item.labTestId]: { ...resultInputs[item.labTestId], isAbnormal: e.target.checked },
                          });
                        }}
                        className="rounded text-rose-600"
                      />
                      <span>Flag as Abnormal Value</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Technician remarks / findings..."
                  value={resultInputs[item.labTestId]?.remarks || ""}
                  onChange={(e) => {
                    setResultInputs({
                      ...resultInputs,
                      [item.labTestId]: { ...resultInputs[item.labTestId], remarks: e.target.value },
                    });
                  }}
                  className="w-full border rounded-lg p-2 text-xs text-slate-800"
                />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setResultModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Publish Results & Complete Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
