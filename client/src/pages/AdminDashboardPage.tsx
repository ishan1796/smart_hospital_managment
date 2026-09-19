import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Table } from "../components/common/Table";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  Building2,
  Users,
  Calendar,
  Bed,
  FlaskConical,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Bot
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/audit-logs")) return "audit";
    return "overview";
  };

  const activeTab = getActiveTab();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metRes, usrRes, logRes] = await Promise.all([
        api.get("/admin/metrics"),
        api.get("/admin/users"),
        api.get("/admin/audit-logs"),
      ]);

      if (metRes.data.success) setMetrics(metRes.data);
      if (usrRes.data.success) setUsers(usrRes.data.users);
      if (logRes.data.success) setAuditLogs(logRes.data.auditLogs);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUser = async (userId: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err: any) {
      alert("Failed to toggle user status");
    }
  };

  if (loading) return <LoadingSpinner label="Loading Executive Control Center..." />;

  const k = metrics?.kpis || {};
  const c = metrics?.charts || {};

  const statCards = [
    { title: "Total Patients", value: k.totalPatients, icon: <Users className="w-5 h-5 text-teal-600" />, sub: "Registered records" },
    { title: "Today's Consultations", value: k.todayAppointments, icon: <Calendar className="w-5 h-5 text-blue-600" />, sub: "OPD token bookings" },
    { title: "Active Inpatients", value: k.activeAdmissions, icon: <Bed className="w-5 h-5 text-indigo-600" />, sub: "Ward admissions" },
    { title: "Bed Occupancy", value: `${k.bedOccupancyRate}%`, icon: <Building2 className="w-5 h-5 text-purple-600" />, sub: `${k.occupiedBeds} / ${k.totalBeds} beds` },
    { title: "Pending Lab Orders", value: k.pendingLabOrders, icon: <FlaskConical className="w-5 h-5 text-cyan-600" />, sub: "In processing" },
    { title: "Low Stock Critical Items", value: k.lowStockItems, icon: <AlertTriangle className="w-5 h-5 text-rose-600" />, sub: "Reorder required" },
    { title: "Today's Revenue", value: `₹${(k.todayRevenue || 0).toLocaleString()}`, icon: <CreditCard className="w-5 h-5 text-emerald-600" />, sub: `Total: ₹${(k.totalRevenue || 0).toLocaleString()}` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-purple-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AegisCare Executive Operations & Analytics</h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Live Hospital Telemetry • Role-Based Governance • Department Revenue Stream
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "overview" ? "bg-purple-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics & KPIs</span>
          </button>
          <button
            onClick={() => navigate("/admin/users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "users" ? "bg-purple-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Access ({users.length})</span>
          </button>
          <button
            onClick={() => navigate("/admin/audit-logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "audit" ? "bg-purple-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statCards.map((s, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">{s.title}</span>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{s.icon}</div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Department */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  <span>Revenue Breakdown by Department</span>
                </div>
              }
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={c.revenueByModule || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val.toLocaleString()}`, "Revenue"]}
                      contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 7-Day Appointment Distribution */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>7-Day Appointment Velocity</span>
                </div>
              }
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={c.appointmentTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [val, "Appointments"]}
                      contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="appointments" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>System Role-Based Accounts Directory</span>
            </div>
          }
          subtitle="Enforce permissions, manage active statuses, and configure access"
        >
          <Table
            columns={[
              {
                header: "Full Name",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.firstName} {r.lastName}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </div>
                ),
              },
              {
                header: "System Role",
                accessor: (r: any) => <Badge variant="primary">{r.role}</Badge>,
              },
              {
                header: "Associated Profile",
                accessor: (r: any) =>
                  r.employee
                    ? `${r.employee.employeeCode} (${r.employee.department?.name || "Staff"})`
                    : r.patient
                    ? r.patient.uhid
                    : "Root System Admin",
              },
              {
                header: "Status",
                accessor: (r: any) => (
                  <Badge variant={r.isActive ? "success" : "danger"}>
                    {r.isActive ? "ACTIVE" : "DISABLED"}
                  </Badge>
                ),
              },
              {
                header: "Action",
                accessor: (r: any) => (
                  <Button
                    size="sm"
                    variant={r.isActive ? "secondary" : "success"}
                    className="py-1 px-2 text-xs"
                    onClick={() => handleToggleUser(r.id)}
                  >
                    {r.isActive ? "Disable" : "Enable"}
                  </Button>
                ),
              },
            ]}
            data={users}
            keyExtractor={(r: any) => r.id}
          />
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Immutable System Audit Trail</span>
            </div>
          }
          subtitle="Real-time security log of logins, clinical edits, dispensing, and billing events"
        >
          <Table
            columns={[
              {
                header: "Timestamp",
                accessor: (r: any) => new Date(r.createdAt).toLocaleString(),
              },
              {
                header: "User / Role",
                accessor: (r: any) => (
                  <div>
                    <div className="font-semibold text-slate-800">{r.userEmail || "System"}</div>
                    <Badge variant="neutral" size="sm">{r.userRole || "GUEST"}</Badge>
                  </div>
                ),
              },
              {
                header: "Action",
                accessor: (r: any) => <span className="font-mono font-bold text-xs text-purple-700">{r.action}</span>,
              },
              {
                header: "Entity Affected",
                accessor: (r: any) => <Badge variant="info">{r.entity}</Badge>,
              },
              {
                header: "Details / Payload Summary",
                accessor: (r: any) => <span className="text-xs text-slate-600">{r.details || "None"}</span>,
              },
              {
                header: "IP Address",
                accessor: (r: any) => <span className="font-mono text-xs text-slate-400">{r.ipAddress}</span>,
              },
            ]}
            data={auditLogs}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No audit logs recorded."
          />
        </Card>
      )}
    </div>
  );
};
