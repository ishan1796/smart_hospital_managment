import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Bot, Sparkles, Send, ShieldCheck, HeartPulse } from "lucide-react";

export const AiChatPage: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "assistant"; text: string; toolUsed?: string }>>([
    {
      sender: "assistant",
      text:
        user?.role === "PATIENT"
          ? `Hello ${user.firstName}! I am your AegisCare Patient AI Health Assistant. I can assist you with:\n• Checking your upcoming appointments & tokens\n• Reviewing your active prescriptions & drug instructions\n• Inquiring on lab reports and diagnostic results\n• Reviewing outstanding hospital bills & receipts\n• General hospital timings and visiting schedules`
          : `Welcome ${user?.firstName || "Executive"}! I am the AegisCare Admin Operational AI Copilot. I can assist you with:\n• Real-time Bed Occupancy & Inpatient Census\n• Departmental Revenue & Collections Telemetry\n• Low Stock Critical Pharmaceuticals & Supplies\n• Staff on Approved Leave & Duty Roster Checks`,
    },
  ]);

  const quickPrompts =
    user?.role === "PATIENT"
      ? [
          "What are my upcoming appointments?",
          "Show my active prescriptions",
          "Check my latest diagnostic reports",
          "What is my current outstanding bill balance?",
          "What are the hospital visiting hours?",
        ]
      : [
          "What is today's revenue breakdown by department?",
          "How many beds are currently occupied in the hospital?",
          "Which medicines are running low in stock?",
          "Who among the staff is currently on approved leave?",
          "Give me an executive operational overview",
        ];

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
          { sender: "assistant", text: res.data.reply, toolUsed: res.data.toolUsed },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "An error occurred executing the authorized tool query. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 text-white border border-teal-700/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
            <Bot className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {user?.role === "PATIENT" ? "Patient AI Health Assistant" : "Admin AI Operations Copilot"}
            </h2>
            <p className="text-xs text-teal-200">
              Guarded Natural Language Execution • Authorized Backend Tool Calling
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-teal-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Direct SQL Access • Role-Gated Scoping</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">Quick Queries:</span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 shrink-0 transition-all font-medium shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Card */}
      <Card className="flex flex-col h-[520px]" bodyClassName="p-0 flex flex-col h-full">
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-2xs ${
                  m.sender === "user"
                    ? "bg-teal-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 rounded-bl-none border border-slate-200/80"
                }`}
              >
                {m.text}
              </div>
              {m.toolUsed && (
                <span className="text-[10px] text-teal-700 font-mono mt-1 px-2.5 py-0.5 bg-teal-50 rounded-full border border-teal-200 font-semibold">
                  ⚡ Executed Authorized Tool: {m.toolUsed}()
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-slate-200 w-fit">
              <Sparkles className="w-4 h-4 text-teal-500 animate-spin" />
              <span>Analyzing hospital telemetry and synthesizing authorized reply...</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder={
              user?.role === "PATIENT"
                ? "Ask about your appointments, active prescriptions, lab results..."
                : "Ask about bed occupancy, department revenue, low stock..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <Button onClick={() => handleSend()} loading={loading} icon={<Send className="w-4 h-4" />}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};
