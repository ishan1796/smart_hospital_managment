import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Table } from "./Table";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  Calendar,
  PlaneTakeoff,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";

interface StaffLeaveViewProps {
  roleTitle?: string;
  departmentName?: string;
}

export const StaffLeaveView: React.FC<StaffLeaveViewProps> = ({
  roleTitle = "Staff Member",
  departmentName = "Hospital Operations",
}) => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leaveType: "CASUAL",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/hrms/leave");
      if (res.data.success) {
        setLeaves(res.data.leaveRequests);
      }
    } catch (err) {
      console.error("Error fetching staff leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const calculateDays = () => {
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      alert("Please provide a reason for the leave application.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/hrms/leave", form);
      if (res.data.success) {
        setModalOpen(false);
        setForm({
          leaveType: "CASUAL",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          reason: "",
        });
        alert("Leave application submitted successfully! It has been dispatched to HRMS for review.");
        fetchLeaves();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit leave application.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");
  const totalApprovedDays = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);

  if (loading) return <LoadingSpinner label="Loading leave balances and records..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
            <PlaneTakeoff className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Staff Leave Management Portal</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {roleTitle} • {departmentName} • Submit Applications & Track HRMS Approval
            </p>
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Entitlement & Balance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Casual Leave (CL)</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">12</span>
            <span className="text-xs text-slate-500">days allocated / yr</span>
          </div>
          <p className="text-[11px] text-teal-600 mt-1 font-medium">Available balance active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Medical / Sick (ML)</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">8</span>
            <span className="text-xs text-slate-500">days allocated / yr</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">Requires cert for &gt;2 days</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Earned / Annual (EL)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">15</span>
            <span className="text-xs text-slate-500">days cumulative</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Planned vacation leave</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{pendingLeaves.length}</span>
            <span className="text-xs text-slate-500">in HR queue</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{totalApprovedDays} days approved YTD</p>
        </div>
      </div>

      {/* Leave Applications History */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>My Leave Applications & Approval History</span>
          </div>
        }
        subtitle="Live synchronization with Hospital HRMS Department"
      >
        <Table
          columns={[
            {
              header: "Leave Type",
              accessor: (r: any) => {
                const colors: any = {
                  CASUAL: "primary",
                  SICK: "warning",
                  ANNUAL: "info",
                  MATERNITY: "neutral",
                };
                return <Badge variant={colors[r.leaveType] || "neutral"}>{r.leaveType} LEAVE</Badge>;
              },
            },
            {
              header: "Duration & Days",
              accessor: (r: any) => (
                <div>
                  <div className="font-semibold text-slate-800">
                    {new Date(r.startDate).toLocaleDateString()} &rarr; {new Date(r.endDate).toLocaleDateString()}
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-700">{r.totalDays} Day(s)</span>
                </div>
              ),
            },
            {
              header: "Reason for Absence",
              accessor: (r: any) => <span className="text-xs text-slate-700 max-w-xs block">{r.reason}</span>,
            },
            {
              header: "HR Approval Status",
              accessor: (r: any) => {
                const map: any = {
                  APPROVED: "success",
                  PENDING: "warning",
                  REJECTED: "danger",
                };
                return <Badge variant={map[r.status] || "neutral"} dot>{r.status}</Badge>;
              },
            },
            {
              header: "HR Remarks / Approver",
              accessor: (r: any) => (
                <div className="text-xs text-slate-500">
                  {r.approvedBy ? (
                    <div>
                      <span className="font-semibold text-slate-700">{r.approvedBy}</span>
                      {r.remarks && <p className="text-[11px] text-slate-400 italic">"{r.remarks}"</p>}
                    </div>
                  ) : (
                    <span className="italic text-slate-400">Awaiting HR review</span>
                  )}
                </div>
              ),
            },
          ]}
          data={leaves}
          keyExtractor={(r: any) => r.id}
          emptyMessage="You have not submitted any leave applications yet."
        />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Staff Leave"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Category</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              <option value="CASUAL">Casual Leave (CL) - Personal / Family</option>
              <option value="SICK">Medical / Sick Leave (ML) - Health issue</option>
              <option value="ANNUAL">Earned / Annual Leave (EL) - Vacation</option>
              <option value="MATERNITY">Maternity / Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center text-slate-700">
            <span>Calculated Leave Duration:</span>
            <span className="font-bold text-teal-700 font-mono text-sm">{calculateDays()} Days</span>
          </div>

          <Input
            label="Reason for Absence & Clinical Handover Notes"
            required
            placeholder="e.g. Attending medical conference / Family event / Health rest..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit to HRMS
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
