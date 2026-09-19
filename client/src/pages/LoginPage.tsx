import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import {
  HeartPulse,
  Shield,
  Stethoscope,
  Activity,
  User,
  Pill,
  FlaskConical,
  CreditCard,
  UserCheck,
  UtensilsCrossed,
  ArrowRight,
  Lock,
  Mail,
  UserPlus
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";

interface RoleCard {
  role: UserRole;
  title: string;
  email: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  description: string;
}

const ROLES: RoleCard[] = [
  {
    role: "ADMIN",
    title: "Hospital Administrator",
    email: "admin@hospital.com",
    icon: <Shield className="w-6 h-6 text-purple-600" />,
    bgGradient: "hover:bg-purple-50/70 group-hover:border-purple-300",
    borderColor: "border-purple-200",
    description: "System config, audit logs, executive metrics, staff management & AI Copilot",
  },
  {
    role: "DOCTOR",
    title: "Senior Doctor / OPD",
    email: "doctor@hospital.com",
    icon: <Stethoscope className="w-6 h-6 text-blue-600" />,
    bgGradient: "hover:bg-blue-50/70 group-hover:border-blue-300",
    borderColor: "border-blue-200",
    description: "Conduct OPD consultations, write diagnoses, prescribe medicines & lab tests",
  },
  {
    role: "NURSE",
    title: "Ward Nurse / Inpatient",
    email: "nurse@hospital.com",
    icon: <Activity className="w-6 h-6 text-teal-600" />,
    bgGradient: "hover:bg-teal-50/70 group-hover:border-teal-300",
    borderColor: "border-teal-200",
    description: "Record patient vitals, nursing progress notes & medication administration",
  },
  {
    role: "PATIENT",
    title: "Patient Portal",
    email: "patient@hospital.com",
    icon: <User className="w-6 h-6 text-emerald-600" />,
    bgGradient: "hover:bg-emerald-50/70 group-hover:border-emerald-300",
    borderColor: "border-emerald-200",
    description: "Book appointments, view prescriptions, test reports, bills & AI Health Assistant",
  },
  {
    role: "PHARMACY",
    title: "Pharmacy Dispensing",
    email: "pharmacy@hospital.com",
    icon: <Pill className="w-6 h-6 text-amber-600" />,
    bgGradient: "hover:bg-amber-50/70 group-hover:border-amber-300",
    borderColor: "border-amber-200",
    description: "Dispense prescriptions, atomic batch stock decrement & auto charge creation",
  },
  {
    role: "LAB",
    title: "Laboratory Diagnostics",
    email: "lab@hospital.com",
    icon: <FlaskConical className="w-6 h-6 text-cyan-600" />,
    bgGradient: "hover:bg-cyan-50/70 group-hover:border-cyan-300",
    borderColor: "border-cyan-200",
    description: "Manage test orders, collect samples, enter lab results & generate test reports",
  },
  {
    role: "FINANCE",
    title: "Finance & Billing Head",
    email: "finance@hospital.com",
    icon: <CreditCard className="w-6 h-6 text-indigo-600" />,
    bgGradient: "hover:bg-indigo-50/70 group-hover:border-indigo-300",
    borderColor: "border-indigo-200",
    description: "Consolidate charges into invoices, apply discounts, and record payments",
  },
  {
    role: "HRMS",
    title: "HRMS & Staff Roster",
    email: "hrms@hospital.com",
    icon: <UserCheck className="w-6 h-6 text-pink-600" />,
    bgGradient: "hover:bg-pink-50/70 group-hover:border-pink-300",
    borderColor: "border-pink-200",
    description: "Manage hospital workforce, attendance logging, leave approvals & payroll",
  },
  {
    role: "MESS",
    title: "Mess & Dietary Services",
    email: "mess@hospital.com",
    icon: <UtensilsCrossed className="w-6 h-6 text-orange-600" />,
    bgGradient: "hover:bg-orange-50/70 group-hover:border-orange-300",
    borderColor: "border-orange-200",
    description: "Deliver scheduled patient meals with strict clinical diagnosis isolation",
  },
];

export const LoginPage: React.FC = () => {
  const { login, loginAsRole, registerPatient } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"roles" | "custom">("roles");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [regData, setRegData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "password123",
    phone: "+91 ",
    dob: "1995-05-15",
    gender: "MALE",
    bloodGroup: "O_POSITIVE",
    address: "",
  });
  const [regLoading, setRegLoading] = useState(false);

  const getRouteForRole = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "/admin";
      case "DOCTOR": return "/doctor";
      case "NURSE": return "/nurse";
      case "PATIENT": return "/patient";
      case "PHARMACY": return "/pharmacy";
      case "LAB": return "/lab";
      case "FINANCE": return "/finance";
      case "HRMS": return "/hrms";
      case "MESS": return "/mess";
      default: return "/admin";
    }
  };

  const handleRoleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await loginAsRole(role);
      navigate(getRouteForRole(role));
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      await registerPatient(regData);
      setRegisterModalOpen(false);
      navigate("/patient");
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              AegisCare <span className="text-xs bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-500/30">Hospital OS</span>
            </h1>
            <p className="text-[11px] text-slate-400">Integrated Role-Based Hospital Operations Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRegisterModalOpen(true)}
            icon={<UserPlus className="w-4 h-4 text-teal-400" />}
            className="border-teal-500/50 text-teal-300 hover:bg-teal-950/40"
          >
            Patient Sign Up
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            Live Demo Mode • Instant Role Authentication
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Select Role to Access Workspace
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Experience role-tailored dashboards, enforced backend authorization, clinical-to-financial workflows, and AI Copilot.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex justify-center mb-8">
          <div className="p-1 bg-slate-800 rounded-xl border border-slate-700 inline-flex shadow-inner">
            <button
              onClick={() => setActiveTab("roles")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "roles"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              1-Click Role Login ({ROLES.length} Roles)
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "custom"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Custom Email & Password
            </button>
          </div>
        </div>

        {/* 1-Click Role Grid */}
        {activeTab === "roles" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((card) => (
              <div
                key={card.role}
                onClick={() => handleRoleQuickLogin(card.role)}
                className={`group cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-5 border border-slate-700/80 hover:border-teal-500/60 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-teal-950/40 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 group-hover:scale-105 transition-transform">
                      {card.icon}
                    </div>
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                      {card.role}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                    {card.email}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                    Login <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Login Form */}
        {activeTab === "custom" && (
          <div className="max-w-md mx-auto w-full bg-slate-800/90 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Account Authentication</h3>
            <p className="text-xs text-slate-400 mb-6">Enter your registered email and password to access the system.</p>

            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default demo password: <code className="text-teal-300">password123</code></p>
              </div>

              <Button type="submit" loading={loading} className="w-full py-2.5 mt-2 bg-teal-600 hover:bg-teal-500">
                Authenticate & Enter
              </Button>
            </form>
          </div>
        )}
      </main>

      {/* Patient Registration Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Patient Self-Registration Portal"
        maxWidth="lg"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={regData.firstName}
              onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
              placeholder="e.g. Ramesh"
            />
            <Input
              label="Last Name"
              required
              value={regData.lastName}
              onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
              placeholder="e.g. Sharma"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              required
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              placeholder="patient@example.com"
            />
            <Input
              label="Mobile Phone"
              required
              value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Birth</label>
              <input
                type="date"
                required
                value={regData.dob}
                onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
              <select
                value={regData.gender}
                onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 text-slate-800"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
              <select
                value={regData.bloodGroup}
                onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 text-slate-800"
              >
                <option value="O_POSITIVE">O+</option>
                <option value="A_POSITIVE">A+</option>
                <option value="B_POSITIVE">B+</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="O_NEGATIVE">O-</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_NEGATIVE">AB-</option>
              </select>
            </div>
          </div>

          <Input
            label="Residential Address"
            value={regData.address}
            onChange={(e) => setRegData({ ...regData, address: e.target.value })}
            placeholder="Flat 102, Blossom Heights, Sector 15"
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={regLoading}>
              Create Patient Account & Login
            </Button>
          </div>
        </form>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        AegisCare Hospital Management & Operations Suite • Node.js/Express • PostgreSQL/Prisma • React + TypeScript
      </footer>
    </div>
  );
};
