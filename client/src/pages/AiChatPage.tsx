import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import {
  Bot,
  Sparkles,
  Send,
  ShieldCheck,
  Zap,
  Building2,
  DollarSign,
  Stethoscope,
  Users,
  Activity,
  User
} from "lucide-react";

export const AiChatPage: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case "ADMIN":
        return `Welcome ${user.firstName}! I am the AegisCare Executive Hospital AI Copilot powered by Google Gemini 3.6 Flash.\n\nI have direct telemetry into:\n• Hospital-wide Income and Department Revenue Streams (OPD, IPD, Pharmacy, Lab)\n• Bed Occupancy, Ward Capacity, and Inpatient Census\n• Critical Inventory & Stock Reorder Alerts\n• Shift Rostering and Staff on Leave`;
      case "HRMS":
        return `Welcome ${user.firstName}! I am your HRMS & Payroll Intelligence Advisor powered by Gemini 3.6 Flash.\n\nI can assist you with:\n• Calculating total monthly salary liability to be paid across departments\n• Department-wise payroll distribution and salary structures\n• Reviewing pending leave applications requiring approval\n• Tracking staff on approved leave today`;
      case "DOCTOR":
        return `Welcome Dr. ${user.lastName || user.firstName}! I am your Senior Clinical Intelligence Assistant powered by Gemini 3.6 Flash.\n\nI can assist you with:\n• Admitted inpatient census, bed numbers, and attending cases\n• High-risk patient flags (Allergies, Low-Sodium / Diabetic diet plans)\n• Pending urgent and routine diagnostic lab investigations\n• Today's OPD consultation queue and token schedule`;
      case "FINANCE":
        return `Welcome ${user.firstName}! I am the Hospital Financial Controller AI powered by Gemini 3.6 Flash.\n\nI can assist you with:\n• Revenue realization audit and total collections vs billed amounts\n• Outstanding patient receivables and aging balances\n• Payment method breakdown (UPI, Card, Cash, Insurance)\n• Departmental billing contributions (OPD, IPD, Pharmacy, Lab)`;
      case "PATIENT":
        return `Hello ${user.firstName}! I am your AegisCare Patient Health Assistant powered by Gemini 3.6 Flash.\n\nI can help you with:\n• Checking your scheduled doctor appointments & token numbers\n• Reviewing your active prescriptions & medication dosages\n• Checking diagnostic lab report results\n• Reviewing your hospital bills & payment receipts`;
      default:
        return `Welcome ${user?.firstName || "User"}! I am AegisCare AI Assistant. How can I assist your workflow today?`;
    }
  };

  const [messages, setMessages] = useState<Array<{ sender: "user" | "assistant"; text: string; toolUsed?: string }>>([
    {
      sender: "assistant",
      text: getWelcomeMessage(),
      toolUsed: "Gemini 3.6 Flash",
    },
  ]);

  const getQuickPrompts = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          "Give me an executive summary of total hospital income & operations",
          "What is today's revenue breakdown by department?",
          "How many beds are currently occupied in the hospital?",
          "Which medicines and supplies are running low in stock?",
          "Who among the staff is currently on approved leave?",
        ];
      case "HRMS":
        return [
          "How much total salary is to be paid this month?",
          "What is the department-wise monthly salary breakdown?",
          "Which staff members have pending leave requests?",
          "Who is on approved leave today?",
          "Give me an executive payroll & workforce summary",
        ];
      case "DOCTOR":
        return [
          "Summarize all active inpatients and their bed assignments",
          "Are there any admitted patients with allergy warnings or special diet plans?",
          "Which laboratory diagnostic orders are currently pending?",
          "What does my OPD consultation schedule look like today?",
          "Give me a clinical overview of high-risk cases",
        ];
      case "FINANCE":
        return [
          "Generate a complete financial audit and revenue summary",
          "What is our total billed amount vs collected revenue?",
          "How much total patient receivable is currently outstanding?",
          "Show revenue breakdown by payment mode (Cash, UPI, Card, Insurance)",
          "Which department is generating the highest income?",
        ];
      case "PATIENT":
        return [
          "What are my upcoming appointments?",
          "Show my active prescriptions and medicine dosages",
          "Check my latest diagnostic lab reports",
          "What is my current outstanding hospital bill balance?",
          "What are the hospital visiting hours and OPD timings?",
        ];
      default:
        return [
          "Give me an operational summary",
          "Check hospital capacity",
          "Show system health status",
        ];
    }
  };

  const quickPrompts = getQuickPrompts();

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || prompt).trim();
    if (!textToSend || loading) return;
    setPrompt("");
    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { prompt: textToSend });
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", text: res.data.reply, toolUsed: res.data.toolUsed || "Gemini 3.6 Flash" },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "An error occurred querying Gemini AI. Please try again.",
          toolUsed: "Error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExecutiveBriefing = async () => {
    if (generatingSummary || loading) return;
    setGeneratingSummary(true);
    const role = user?.role || "ADMIN";
    const promptText = `Generate a comprehensive ${role} Executive Briefing with real-time hospital metrics and actionable takeaways.`;
    setMessages((prev) => [...prev, { sender: "user", text: promptText }]);

    try {
      const res = await api.get(`/ai/executive-summary?role=${role}`);
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: res.data.summary,
            toolUsed: "Gemini 3.6 Flash (Executive Telemetry)",
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Could not generate executive summary. Please check your connectivity and try again.",
        },
      ]);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case "ADMIN":
        return { name: "Admin Operations AI", icon: <Building2 className="w-4 h-4 text-purple-300" />, color: "bg-purple-900/60 border-purple-700/50" };
      case "HRMS":
        return { name: "HRMS & Payroll AI", icon: <Users className="w-4 h-4 text-pink-300" />, color: "bg-pink-900/60 border-pink-700/50" };
      case "DOCTOR":
        return { name: "Clinical Care AI", icon: <Stethoscope className="w-4 h-4 text-teal-300" />, color: "bg-teal-900/60 border-teal-700/50" };
      case "FINANCE":
        return { name: "Financial Controller AI", icon: <DollarSign className="w-4 h-4 text-emerald-300" />, color: "bg-emerald-900/60 border-emerald-700/50" };
      case "PATIENT":
        return { name: "Patient Care AI", icon: <User className="w-4 h-4 text-blue-300" />, color: "bg-blue-900/60 border-blue-700/50" };
      default:
        return { name: "AegisCare AI", icon: <Bot className="w-4 h-4 text-slate-300" />, color: "bg-slate-900/60 border-slate-700/50" };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">{roleBadge.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                Google Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Role-Scoped Contextual Intelligence • Real-time AegisCare Database Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleGenerateExecutiveBriefing}
            loading={generatingSummary}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-xs px-3.5 py-2 font-semibold shadow-sm"
            icon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            ⚡ 1-Click Executive Briefing
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-teal-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RBAC Protected</span>
          </div>
        </div>
      </div>

      {/* Suggested Role-Specific Quick Prompts */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
          <span>Recommended Role Prompts:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/50 shrink-0 transition-all font-medium shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Card */}
      <Card className="flex flex-col h-[540px]" bodyClassName="p-0 flex flex-col h-full">
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[88%] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-2xs ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 rounded-bl-none border border-slate-200/90"
                }`}
              >
                {m.text}
              </div>
              {m.toolUsed && (
                <span className="text-[10px] text-indigo-700 font-mono mt-1 px-2.5 py-0.5 bg-indigo-50 rounded-full border border-indigo-200 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Source: {m.toolUsed}
                </span>
              )}
            </div>
          ))}

          {(loading || generatingSummary) && (
            <div className="flex items-center gap-2 text-xs text-slate-600 italic p-3.5 bg-white rounded-xl border border-slate-200 w-fit shadow-2xs">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
              <span>Synthesizing live hospital telemetry via Gemini 3.6 Flash...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder={
              user?.role === "ADMIN"
                ? "Ask about hospital income, bed occupancy, department revenue, low stock..."
                : user?.role === "HRMS"
                ? "Ask about total salary liability, department salaries, pending leaves..."
                : user?.role === "DOCTOR"
                ? "Ask about admitted patients, high-risk flags, lab orders, OPD queue..."
                : user?.role === "FINANCE"
                ? "Ask about total revenue, pending bills, collection rate, payment methods..."
                : "Ask about your appointments, active prescriptions, lab reports, bills..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <Button
            onClick={() => handleSend()}
            loading={loading || generatingSummary}
            icon={<Send className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-0"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};
