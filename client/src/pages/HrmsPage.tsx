import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { Table } from "../components/common/Table";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  UserCheck,
  CalendarCheck,
  PlaneTakeoff,
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building2,
  Stethoscope,
  Activity,
  Search
} from "lucide-react";
import { AiExecutiveSummaryBanner } from "../components/common/AiExecutiveSummaryBanner";

export const HrmsPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"staff" | "add-employee" | "leaves" | "attendance" | "payroll">("staff");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Add Employee Modal
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    role: "DOCTOR",
    firstName: "",
    lastName: "",
    email: "",
    password: "password123",
    phone: "",
    departmentId: "",
    designation: "Consultant Physician",
    salary: 120000,
    shift: "MORNING",
    specialization: "General Medicine",
    licenseNumber: "",
    consultationFee: 600,
  });
  const [empSubmitting, setEmpSubmitting] = useState(false);

  // Leave Modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    reason: "Personal / family event",
  });
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Payroll Generation
  const [payrollLoading, setPayrollLoading] = useState(false);

  const fetchHrmsData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, leaveRes, payRes, attRes] = await Promise.all([
        api.get("/hrms/employees"),
        api.get("/hrms/departments"),
        api.get("/hrms/leave"),
        api.get("/hrms/payroll"),
        api.get("/hrms/attendance"),
      ]);

      if (empRes.data.success) setEmployees(empRes.data.employees);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.departments);
        if (deptRes.data.departments.length > 0 && !empForm.departmentId) {
          setEmpForm((prev) => ({ ...prev, departmentId: deptRes.data.departments[0].id }));
        }
      }
      if (leaveRes.data.success) setLeaves(leaveRes.data.leaveRequests);
      if (payRes.data.success) setPayroll(payRes.data.payrollRecords);
      if (attRes.data.success) setAttendanceList(attRes.data.attendance);
    } catch (err) {
      console.error("Error fetching HRMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrmsData();
  }, []);

  const handleRoleChange = (role: string) => {
    let designation = "Hospital Staff";
    let salary = 40000;
    let specialization = "";
    if (role === "DOCTOR") {
      designation = "Senior Consultant Physician";
      salary = 125000;
      specialization = "Cardiology";
    } else if (role === "NURSE") {
      designation = "Inpatient Ward Sister";
      salary = 48000;
    } else if (role === "PHARMACY") {
      designation = "Clinical Pharmacist";
      salary = 42000;
    } else if (role === "LAB") {
      designation = "Senior Lab Biochemist";
      salary = 45000;
    } else if (role === "FINANCE") {
      designation = "Senior Billing Executive";
      salary = 50000;
    } else if (role === "MESS") {
      designation = "Hospital Head Chef";
      salary = 35000;
    } else if (role === "HRMS") {
      designation = "HR Operations Specialist";
      salary = 55000;
    }

    setEmpForm({
      ...empForm,
      role,
      designation,
      salary,
      specialization,
      licenseNumber: role === "DOCTOR" ? `MCI-${Date.now().toString().slice(-6)}` : role === "NURSE" ? `INC-${Date.now().toString().slice(-6)}` : "",
    });
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.firstName || !empForm.lastName || !empForm.email) {
      alert("Please fill in all required employee fields.");
      return;
    }
    setEmpSubmitting(true);
    try {
      const res = await api.post("/hrms/employees", empForm);
      if (res.data.success) {
        setAddEmpModalOpen(false);
        alert(`Successfully registered new ${empForm.role} employee: ${empForm.firstName} ${empForm.lastName}!`);
        // Reset form
        setEmpForm({
          role: "DOCTOR",
          firstName: "",
          lastName: "",
          email: "",
          password: "password123",
          phone: "",
          departmentId: departments[0]?.id || "",
          designation: "Senior Consultant Physician",
          salary: 125000,
          shift: "MORNING",
          specialization: "Cardiology",
          licenseNumber: `MCI-${Date.now().toString().slice(-6)}`,
          consultationFee: 600,
        });
        fetchHrmsData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create employee.");
    } finally {
      setEmpSubmitting(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveLoading(true);
    try {
      const res = await api.post("/hrms/leave", leaveForm);
      if (res.data.success) {
        setLeaveModalOpen(false);
        alert("Leave request submitted!");
        fetchHrmsData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit leave");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleUpdateLeave = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await api.patch(`/hrms/leave/${id}/status`, {
        status,
        remarks: status === "APPROVED" ? "Approved by HR Department" : "Declined due to duty roster constraints",
      });
      if (res.data.success) {
        alert(`Leave request ${status.toLowerCase()}!`);
        fetchHrmsData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleGeneratePayroll = async () => {
    setPayrollLoading(true);
    try {
      const today = new Date();
      const res = await api.post("/hrms/payroll/generate", {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      });
      if (res.data.success) {
        alert(`Generated monthly payroll for ${res.data.payrollRecords.length} employees!`);
        fetchHrmsData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      setPayrollLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading HRMS Staff Records & Operations..." />;

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.user?.firstName?.toLowerCase().includes(q) ||
      e.user?.lastName?.toLowerCase().includes(q) ||
      e.user?.email?.toLowerCase().includes(q) ||
      e.employeeCode?.toLowerCase().includes(q) ||
      e.designation?.toLowerCase().includes(q) ||
      e.department?.name?.toLowerCase().includes(q) ||
      e.user?.role?.toLowerCase().includes(q)
    );
  });

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-pink-950 via-slate-900 to-purple-950 rounded-2xl p-6 text-white shadow-md border border-pink-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-pink-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hospital Human Resources Management (HRMS)</h2>
            <p className="text-xs text-pink-200 mt-0.5">
              Staff Onboarding • Attendance Roster • Leave Queue Approvals • Monthly Payroll Engine
            </p>
          </div>
        </div>

        {/* Action / Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "staff" ? "bg-pink-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roster ({employees.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "leaves" ? "bg-pink-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Leave Requests {pendingLeaves.length > 0 && `(${pendingLeaves.length} Pending)`}</span>
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "attendance" ? "bg-pink-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance Log</span>
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "payroll" ? "bg-pink-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payroll Disbursals</span>
          </button>
        </div>
      </div>

      {/* Gemini AI Payroll Liability & Staffing Executive Briefing */}
      <AiExecutiveSummaryBanner role="HRMS" />

      {/* ========================================================= */}
      {/* 1. STAFF ROSTER TAB */}
      {/* ========================================================= */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-pink-600" />
                  <span>Hospital Staff Directory</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search staff, role, dept..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAddEmpModalOpen(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
                  >
                    + Add New Employee
                  </Button>
                </div>
              </div>
            }
            subtitle="Manage doctors, nurses, pharmacists, lab technicians, finance executives, and kitchen staff"
          >
            <Table
              columns={[
                {
                  header: "Employee Details",
                  accessor: (r: any) => (
                    <div>
                      <div className="font-bold text-slate-800">{r.user?.firstName} {r.user?.lastName}</div>
                      <span className="text-xs font-mono text-pink-700 font-semibold">{r.employeeCode}</span>
                    </div>
                  ),
                },
                {
                  header: "Role / Designation",
                  accessor: (r: any) => {
                    const roleColors: any = {
                      DOCTOR: "primary",
                      NURSE: "info",
                      PHARMACY: "warning",
                      LAB: "info",
                      FINANCE: "neutral",
                      HRMS: "danger",
                      MESS: "warning",
                      ADMIN: "primary",
                    };
                    return (
                      <div>
                        <Badge variant={roleColors[r.user?.role] || "neutral"}>{r.user?.role}</Badge>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">{r.designation}</div>
                      </div>
                    );
                  },
                },
                {
                  header: "Department / Shift",
                  accessor: (r: any) => (
                    <div>
                      <div className="font-medium text-slate-800">{r.department?.name || "General"}</div>
                      <span className="text-[11px] text-slate-500 font-mono">Shift: {r.shift || "MORNING"}</span>
                    </div>
                  ),
                },
                {
                  header: "Contact Details",
                  accessor: (r: any) => (
                    <div>
                      <div className="text-xs text-slate-800">{r.user?.email}</div>
                      <div className="text-xs text-slate-500 font-mono">{r.user?.phone || "N/A"}</div>
                    </div>
                  ),
                },
                {
                  header: "Base Salary",
                  accessor: (r: any) => <span className="font-mono font-bold text-slate-800">₹{r.salary?.toLocaleString()}</span>,
                },
                {
                  header: "Status",
                  accessor: (r: any) => (
                    <Badge variant={r.employmentStatus === "ACTIVE" ? "success" : "warning"} dot>
                      {r.employmentStatus || "ACTIVE"}
                    </Badge>
                  ),
                },
              ]}
              data={filteredEmployees}
              keyExtractor={(r: any) => r.id}
              emptyMessage="No employees found in directory."
            />
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LEAVE REQUESTS APPROVAL QUEUE TAB */}
      {/* ========================================================= */}
      {activeTab === "leaves" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-pink-600" />
                <span>Hospital Staff Leave Approval Queue</span>
              </div>
              <Button size="sm" onClick={() => setLeaveModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Submit Leave Application
              </Button>
            </div>
          }
          subtitle="Real-time leave applications submitted by Doctors, Nurses, Pharmacists, and Hospital Operations Staff"
        >
          <Table
            columns={[
              {
                header: "Applicant Employee",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">
                      {r.employee?.user?.firstName} {r.employee?.user?.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-pink-700">{r.employee?.user?.role}</span> • {r.employee?.department?.name} ({r.employee?.employeeCode})
                    </div>
                  </div>
                ),
              },
              {
                header: "Leave Type",
                accessor: (r: any) => {
                  const map: any = { CASUAL: "primary", SICK: "warning", ANNUAL: "info", MATERNITY: "neutral" };
                  return <Badge variant={map[r.leaveType] || "neutral"}>{r.leaveType}</Badge>;
                },
              },
              {
                header: "Duration & Days",
                accessor: (r: any) => (
                  <div>
                    <span className="font-medium text-slate-800 text-xs">
                      {new Date(r.startDate).toLocaleDateString()} &rarr; {new Date(r.endDate).toLocaleDateString()}
                    </span>
                    <div className="text-xs font-mono font-bold text-teal-700">{r.totalDays} Day(s)</div>
                  </div>
                ),
              },
              {
                header: "Reason for Absence",
                accessor: (r: any) => <span className="text-xs text-slate-700 max-w-xs block">{r.reason}</span>,
              },
              {
                header: "Status",
                accessor: (r: any) => {
                  const map: any = { APPROVED: "success", PENDING: "warning", REJECTED: "danger" };
                  return <Badge variant={map[r.status] || "neutral"} dot>{r.status}</Badge>;
                },
              },
              {
                header: "HR Action / Decision",
                accessor: (r: any) =>
                  r.status === "PENDING" ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="success"
                        className="py-1 px-2.5 text-xs font-bold"
                        onClick={() => handleUpdateLeave(r.id, "APPROVED")}
                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="py-1 px-2.5 text-xs font-bold"
                        onClick={() => handleUpdateLeave(r.id, "REJECTED")}
                        icon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 block">{r.approvedBy}</span>
                      {r.remarks && <span className="text-[11px] text-slate-400 italic">"{r.remarks}"</span>}
                    </div>
                  ),
              },
            ]}
            data={leaves}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No leave applications submitted."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 3. ATTENDANCE LOG TAB */}
      {/* ========================================================= */}
      {activeTab === "attendance" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-pink-600" />
              <span>Staff Duty Attendance & Check-In Telemetry</span>
            </div>
          }
          subtitle="Real-time shift attendance records and time-clock tracking"
        >
          <Table
            columns={[
              {
                header: "Staff Member",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">
                      {r.employee?.user?.firstName} {r.employee?.user?.lastName}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{r.employee?.department?.name}</span>
                  </div>
                ),
              },
              {
                header: "Date",
                accessor: (r: any) => new Date(r.date).toLocaleDateString(),
              },
              {
                header: "Check-In Time",
                accessor: (r: any) => (
                  <span className="font-mono text-xs text-slate-800">
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "08:30 AM"}
                  </span>
                ),
              },
              {
                header: "Check-Out Time",
                accessor: (r: any) => (
                  <span className="font-mono text-xs text-slate-500">
                    {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "On Active Duty"}
                  </span>
                ),
              },
              {
                header: "Attendance Status",
                accessor: (r: any) => (
                  <Badge variant={r.status === "PRESENT" ? "success" : r.status === "LATE" ? "warning" : "danger"}>
                    {r.status || "PRESENT"}
                  </Badge>
                ),
              },
            ]}
            data={attendanceList}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No attendance records found for today."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 4. PAYROLL DISBURSALS TAB */}
      {/* ========================================================= */}
      {activeTab === "payroll" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-pink-600" />
                <span>Monthly Staff Payroll Disbursals</span>
              </div>
              <Button
                size="sm"
                onClick={handleGeneratePayroll}
                loading={payrollLoading}
                icon={<Clock className="w-3.5 h-3.5" />}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
              >
                Generate Current Month Payroll
              </Button>
            </div>
          }
          subtitle="Automated salary calculation with basic pay, allowances, statutory deductions, and net payouts"
        >
          <Table
            columns={[
              {
                header: "Employee",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.employee?.user?.firstName} {r.employee?.user?.lastName}</div>
                    <span className="text-xs font-mono text-slate-500">{r.employee?.department?.name}</span>
                  </div>
                ),
              },
              { header: "Period", accessor: (r: any) => `${r.month}/${r.year}` },
              { header: "Basic Pay", accessor: (r: any) => `₹${r.basicSalary.toLocaleString()}` },
              { header: "Allowances", accessor: (r: any) => `+₹${r.allowances.toLocaleString()}` },
              { header: "Deductions", accessor: (r: any) => `-₹${r.deductions.toLocaleString()}` },
              {
                header: "Net Disbursal",
                accessor: (r: any) => <strong className="font-mono text-emerald-700 font-bold">₹{r.netSalary.toLocaleString()}</strong>,
              },
              {
                header: "Payment Status",
                accessor: (r: any) => <Badge variant="success">{r.paymentStatus}</Badge>,
              },
            ]}
            data={payroll}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No payroll records generated yet."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* ADD EMPLOYEE MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={addEmpModalOpen}
        onClose={() => setAddEmpModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-pink-900">
            <UserCheck className="w-5 h-5 text-pink-600" />
            <span>Onboard New Hospital Employee</span>
          </div>
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          {/* Employee Type / Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Staff Role / Category</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Doctor / Specialist", role: "DOCTOR" },
                { label: "Staff Nurse", role: "NURSE" },
                { label: "Pharmacist", role: "PHARMACY" },
                { label: "Lab Technician", role: "LAB" },
                { label: "Finance Officer", role: "FINANCE" },
                { label: "Kitchen / Mess", role: "MESS" },
                { label: "HR Specialist", role: "HRMS" },
                { label: "Administrator", role: "ADMIN" },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleChange(item.role)}
                  className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                    empForm.role === item.role
                      ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">1. Personal & Login Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={empForm.firstName}
                onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                required
                value={empForm.lastName}
                onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Official Email Address"
                  type="email"
                  required
                  placeholder="e.g. john.doe@aegiscare.com"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                />
              </div>
              <Input
                label="Login Password"
                type="password"
                required
                value={empForm.password}
                onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
              />
            </div>
            <Input
              label="Contact Phone"
              placeholder="e.g. +91 98765 43210"
              value={empForm.phone}
              onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
            />
          </div>

          {/* Department & Designation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">2. Department & Employment Info</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Department</label>
                <select
                  value={empForm.departmentId}
                  onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Designation / Position"
                required
                value={empForm.designation}
                onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Base Salary (₹ / month)"
                type="number"
                required
                value={empForm.salary}
                onChange={(e) => setEmpForm({ ...empForm, salary: parseFloat(e.target.value) || 0 })}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Duty</label>
                <select
                  value={empForm.shift}
                  onChange={(e) => setEmpForm({ ...empForm, shift: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 text-slate-800"
                >
                  <option value="MORNING">Morning Shift (08:00 AM - 04:00 PM)</option>
                  <option value="EVENING">Evening Shift (04:00 PM - 12:00 AM)</option>
                  <option value="NIGHT">Night Duty (12:00 AM - 08:00 AM)</option>
                  <option value="GENERAL">General Office Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Doctor-specific fields */}
          {empForm.role === "DOCTOR" && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
              <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Doctor Clinical Credentials
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Medical Specialization"
                  required
                  placeholder="e.g. Cardiology"
                  value={empForm.specialization}
                  onChange={(e) => setEmpForm({ ...empForm, specialization: e.target.value })}
                />
                <Input
                  label="Medical Council License #"
                  required
                  placeholder="e.g. MCI-902188"
                  value={empForm.licenseNumber}
                  onChange={(e) => setEmpForm({ ...empForm, licenseNumber: e.target.value })}
                />
                <Input
                  label="OPD Consultation Fee (₹)"
                  type="number"
                  required
                  value={empForm.consultationFee}
                  onChange={(e) => setEmpForm({ ...empForm, consultationFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          {/* Nurse-specific fields */}
          {empForm.role === "NURSE" && (
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
              <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" /> Nursing Registration
              </h4>
              <Input
                label="Nursing Council License #"
                required
                placeholder="e.g. INC-543210"
                value={empForm.licenseNumber}
                onChange={(e) => setEmpForm({ ...empForm, licenseNumber: e.target.value })}
              />
            </div>
          )}

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAddEmpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={empSubmitting} className="bg-pink-600 hover:bg-pink-500 text-white font-bold">
              Register Employee Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Submit Leave Application"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Category</label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="SICK">Sick / Medical Leave (ML)</option>
              <option value="ANNUAL">Earned / Annual Leave (EL)</option>
              <option value="MATERNITY">Maternity / Paternity Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              />
            </div>
          </div>

          <Input
            label="Reason for Absence"
            required
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={leaveLoading}>
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
