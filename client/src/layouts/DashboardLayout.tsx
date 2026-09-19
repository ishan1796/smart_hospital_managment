import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import {
  Activity,
  Users,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  Bed,
  Layers,
  UtensilsCrossed,
  ShieldAlert,
  Bot,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  HeartPulse,
  UserCheck,
  Building2,
  Stethoscope,
  Wind,
  PlaneTakeoff
} from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { Button } from "../components/common/Button";
import { api } from "../services/api";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Patient Portal
  { name: "My Health Dashboard", path: "/patient", icon: <HeartPulse className="w-5 h-5" />, roles: ["PATIENT"] },
  { name: "My Appointments", path: "/patient/appointments", icon: <Calendar className="w-5 h-5" />, roles: ["PATIENT"] },
  { name: "My Prescriptions", path: "/patient/prescriptions", icon: <Pill className="w-5 h-5" />, roles: ["PATIENT"] },
  { name: "Diagnostic Reports", path: "/patient/reports", icon: <FileText className="w-5 h-5" />, roles: ["PATIENT"] },
  { name: "Bills & Payments", path: "/patient/bills", icon: <CreditCard className="w-5 h-5" />, roles: ["PATIENT"] },
  { name: "AI Health Assistant", path: "/ai-chat", icon: <Bot className="w-5 h-5 text-teal-400 animate-pulse" />, roles: ["PATIENT"] },

  // Doctor Portal
  { name: "OPD Consultation Queue", path: "/doctor", icon: <Stethoscope className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Patients Directory", path: "/doctor/patients", icon: <Users className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Clinical Encounters", path: "/doctor/encounters", icon: <FileText className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Prescription Builder", path: "/doctor/prescriptions", icon: <Pill className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Diagnostic Orders", path: "/doctor/lab-orders", icon: <FlaskConical className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Inpatient Diet Prescriptions", path: "/diet", icon: <UtensilsCrossed className="w-5 h-5" />, roles: ["DOCTOR"] },
  { name: "Staff Leave Requests", path: "/doctor/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["DOCTOR"] },

  // Nurse Station
  { name: "Nurse Station & Wards", path: "/nurse", icon: <Activity className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Vitals Recorder", path: "/nurse/vitals", icon: <HeartPulse className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Medication Admin Log", path: "/nurse/medications", icon: <Pill className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Nursing Notes & Handover", path: "/nurse/notes", icon: <FileText className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Inpatient Diet Prescriptions", path: "/diet", icon: <UtensilsCrossed className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Oxygen Cylinder Monitor", path: "/inventory/oxygen", icon: <Wind className="w-5 h-5" />, roles: ["NURSE"] },
  { name: "Staff Leave Requests", path: "/nurse/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["NURSE"] },

  // Pharmacy
  { name: "Dispensing Queue", path: "/pharmacy", icon: <Pill className="w-5 h-5" />, roles: ["PHARMACY"] },
  { name: "Medicines & Batches", path: "/pharmacy/medicines", icon: <Layers className="w-5 h-5" />, roles: ["PHARMACY"] },
  { name: "Staff Leave Requests", path: "/pharmacy/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["PHARMACY"] },

  // Laboratory
  { name: "Lab Orders & Tests", path: "/lab", icon: <FlaskConical className="w-5 h-5" />, roles: ["LAB"] },
  { name: "Test Results Entry", path: "/lab/results", icon: <FileText className="w-5 h-5" />, roles: ["LAB"] },
  { name: "Staff Leave Requests", path: "/lab/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["LAB"] },

  // IPD & Beds
  { name: "Ward & Bed Management", path: "/ipd", icon: <Bed className="w-5 h-5" />, roles: ["ADMIN", "DOCTOR", "NURSE"] },

  // Finance
  { name: "Billing & Invoicing Hub", path: "/finance", icon: <CreditCard className="w-5 h-5" />, roles: ["FINANCE", "ADMIN"] },
  { name: "Staff Leave Requests", path: "/finance/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["FINANCE"] },

  // Inventory
  { name: "Consumables & Supplies", path: "/inventory", icon: <Layers className="w-5 h-5" />, roles: ["ADMIN", "PHARMACY", "LAB", "MESS"] },
  { name: "Oxygen Management", path: "/inventory/oxygen", icon: <Wind className="w-5 h-5" />, roles: ["ADMIN", "NURSE"] },

  // HRMS
  { name: "HRMS & Staff Roster", path: "/hrms", icon: <UserCheck className="w-5 h-5" />, roles: ["HRMS", "ADMIN"] },

  // Mess & Dietary Kitchen
  { name: "Kitchen Fulfillment Queue", path: "/mess", icon: <UtensilsCrossed className="w-5 h-5" />, roles: ["MESS"] },
  { name: "Inpatient Diet & Kitchen Hub", path: "/diet", icon: <UtensilsCrossed className="w-5 h-5" />, roles: ["ADMIN"] },
  { name: "Staff Leave Requests", path: "/mess/leave", icon: <PlaneTakeoff className="w-5 h-5 text-pink-400" />, roles: ["MESS"] },

  // Admin Control Center
  { name: "Executive Dashboard", path: "/admin", icon: <Building2 className="w-5 h-5" />, roles: ["ADMIN"] },
  { name: "User & Role Access", path: "/admin/users", icon: <Users className="w-5 h-5" />, roles: ["ADMIN"] },
  { name: "System Audit Logs", path: "/admin/audit-logs", icon: <ShieldAlert className="w-5 h-5" />, roles: ["ADMIN"] },
  { name: "Admin AI Copilot", path: "/ai-chat", icon: <Bot className="w-5 h-5 text-indigo-400" />, roles: ["ADMIN"] },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, loginAsRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // AI Chat State inside layout
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "assistant"; text: string; toolUsed?: string }>>([
    {
      sender: "assistant",
      text:
        user?.role === "PATIENT"
          ? `Hello ${user.firstName}! I am your AegisCare Personal AI Assistant. Ask me about your appointments, active prescriptions, lab reports, or hospital visiting timings.`
          : `Welcome ${user?.firstName || "Admin"}! I am your Hospital AI Copilot. Ask me questions like "What is today's revenue?", "How many beds are occupied?", or "Which items are low in stock?".`,
    },
  ]);

  const handleSendAiMessage = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    const userText = aiPrompt.trim();
    setAiPrompt("");
    setAiMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setAiLoading(true);

    try {
      const res = await api.post("/ai/chat", { prompt: userText });
      if (res.data.success) {
        setAiMessages((prev) => [
          ...prev,
          { sender: "assistant", text: res.data.reply, toolUsed: res.data.toolUsed },
        ]);
      }
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I experienced an error retrieving that hospital operational data. Please try again.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const currentRole = user?.role || "PATIENT";
  const permittedNav = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  const roleColors: Record<UserRole, string> = {
    ADMIN: "bg-purple-600 text-white",
    DOCTOR: "bg-blue-600 text-white",
    NURSE: "bg-teal-600 text-white",
    PATIENT: "bg-emerald-600 text-white",
    PHARMACY: "bg-amber-600 text-white",
    LAB: "bg-cyan-600 text-white",
    FINANCE: "bg-indigo-600 text-white",
    HRMS: "bg-pink-600 text-white",
    MESS: "bg-orange-600 text-white",
  };

  const handleQuickRoleSwitch = async (r: UserRole) => {
    setRoleSwitcherOpen(false);
    await loginAsRole(r);
    // Route to appropriate initial dashboard
    const defaultRoutes: Record<UserRole, string> = {
      ADMIN: "/admin",
      DOCTOR: "/doctor",
      NURSE: "/nurse",
      PATIENT: "/patient",
      PHARMACY: "/pharmacy",
      LAB: "/lab",
      FINANCE: "/finance",
      HRMS: "/hrms",
      MESS: "/mess",
    };
    navigate(defaultRoutes[r]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Hospital Branding */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                AegisCare <span className="text-[10px] uppercase font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">Ops</span>
              </h1>
              <p className="text-[11px] text-slate-400">Hospital Management Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card in Sidebar */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-700 text-teal-400 font-bold flex items-center justify-center text-sm border border-slate-600">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[currentRole]}`}>
                  {currentRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Module Navigation</p>
          {permittedNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* AI Assistant Quick Launcher */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => setAiModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-900/60 to-slate-800 border border-teal-500/30 text-teal-200 text-xs font-semibold hover:border-teal-400 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-400 group-hover:animate-bounce" />
              <span>{user?.role === "PATIENT" ? "Patient AI Assistant" : "Admin AI Copilot"}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AegisCare Medical OS</span>
              <h2 className="text-sm font-bold text-slate-800">{user?.role} Operational Workspace</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Role Switcher Dropdown for Demo Presentation */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 transition-all shadow-2xs"
              >
                <span className="text-slate-400">Switch Role:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] ${roleColors[currentRole]}`}>{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Demo Role Switcher
                  </div>
                  {(["ADMIN", "DOCTOR", "NURSE", "PATIENT", "PHARMACY", "LAB", "FINANCE", "HRMS", "MESS"] as UserRole[]).map(
                    (r) => (
                      <button
                        key={r}
                        onClick={() => handleQuickRoleSwitch(r)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentRole === r ? "text-teal-700 font-bold bg-teal-50/50" : "text-slate-700"
                        }`}
                      >
                        <span>{r}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded ${roleColors[r]}`}>{r}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant Button in Topbar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiModalOpen(true)}
              icon={<Bot className="w-4 h-4 text-teal-600" />}
              className="border-teal-300 text-teal-700 bg-teal-50/40"
            >
              <span className="hidden sm:inline">AI Copilot</span>
            </Button>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">{children}</main>
      </div>

      {/* AI Assistant Interactive Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-teal-800">
            <Bot className="w-5 h-5 text-teal-600" />
            <span>{user?.role === "PATIENT" ? "Patient AI Health Assistant" : "Admin Operational AI Copilot"}</span>
          </div>
        }
        maxWidth="2xl"
        footer={
          <div className="w-full flex items-center gap-2">
            <input
              type="text"
              placeholder={
                user?.role === "PATIENT"
                  ? "Ask about appointments, prescriptions, bills or visiting hours..."
                  : "Ask about bed occupancy, revenue by department, low stock..."
              }
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
              className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Button size="sm" loading={aiLoading} onClick={handleSendAiMessage}>
              Send Query
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {aiMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-2xs ${
                  msg.sender === "user"
                    ? "bg-teal-600 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                }`}
              >
                {msg.text}
              </div>
              {msg.toolUsed && (
                <span className="text-[10px] text-teal-600 font-mono mt-1 px-2 py-0.5 bg-teal-50 rounded border border-teal-200">
                  ⚡ Authorized Tool: {msg.toolUsed}()
                </span>
              )}
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <Sparkles className="w-4 h-4 text-teal-500 animate-spin" />
              <span>Querying verified database telemetry...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
