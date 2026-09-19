import React, { useState } from "react";
import { api } from "../../services/api";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Zap } from "lucide-react";
import { Button } from "./Button";

interface AiExecutiveSummaryBannerProps {
  role: "ADMIN" | "HRMS" | "DOCTOR" | "FINANCE" | "NURSE";
}

export const AiExecutiveSummaryBanner: React.FC<AiExecutiveSummaryBannerProps> = ({ role }) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    title: string;
    summary: string;
    metrics: any;
    generatedAt: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    setIsOpen(true);
    try {
      const res = await api.get(`/ai/executive-summary?role=${role}`);
      if (res.data.success) {
        setSummaryData(res.data);
      }
    } catch (err: any) {
      setError("Unable to generate live Gemini AI summary at this moment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Role subtitle & theme mapper
  const getRoleHeader = () => {
    switch (role) {
      case "ADMIN":
        return {
          title: "Executive Hospital Operations & Income Briefing",
          badge: "Hospital Operations & Income",
          color: "from-blue-900 via-indigo-950 to-slate-900",
          border: "border-blue-700/40",
          accent: "text-blue-300",
          desc: "Generate an on-demand executive analysis of hospital income, bed occupancy, and departmental metrics.",
        };
      case "HRMS":
        return {
          title: "HRMS Monthly Payroll Liability & Staffing Briefing",
          badge: "Payroll & Salaries Liability",
          color: "from-purple-900 via-indigo-950 to-slate-900",
          border: "border-purple-700/40",
          accent: "text-purple-300",
          desc: "Generate an on-demand breakdown of monthly salary liabilities to be paid, staffing levels, and pending leaves.",
        };
      case "FINANCE":
        return {
          title: "Financial Controller Revenue & Cashflow Briefing",
          badge: "Revenue Realization & Incomes",
          color: "from-emerald-900 via-teal-950 to-slate-900",
          border: "border-emerald-700/40",
          accent: "text-emerald-300",
          desc: "Generate an on-demand audit of total billed amounts, collected revenue, receivables, and cashflow.",
        };
      case "DOCTOR":
        return {
          title: "Physician Clinical & Inpatient Care Briefing",
          badge: "Clinical Census & High-Risk Alerts",
          color: "from-teal-900 via-cyan-950 to-slate-900",
          border: "border-teal-700/40",
          accent: "text-teal-300",
          desc: "Generate an on-demand clinical summary of admitted patients, allergy warnings, diet plans, and lab orders.",
        };
      default:
        return {
          title: "AI Executive Briefing",
          badge: "Executive Telemetry",
          color: "from-slate-900 to-gray-950",
          border: "border-slate-700",
          accent: "text-slate-300",
          desc: "Generate an on-demand intelligence briefing powered by Gemini 3.6 Flash.",
        };
    }
  };

  const header = getRoleHeader();

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${header.color} border ${header.border} text-white shadow-md overflow-hidden transition-all duration-300 mb-6`}>
      {/* Top Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0">
            <Sparkles className={`w-5 h-5 ${header.accent} ${loading ? "animate-spin" : ""}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold tracking-tight">
                {summaryData?.title || header.title}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {summaryData ? "Live summary synced with AegisCare database telemetry" : header.desc}
            </p>
          </div>
        </div>

        {/* Action Button: Generate / Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!summaryData && !loading ? (
            <Button
              size="sm"
              onClick={fetchSummary}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 border-0 shadow-sm flex items-center gap-1.5"
              icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
            >
              <span>✨ Generate AI Briefing</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchSummary}
              loading={loading}
              className="text-white hover:bg-white/10 border border-white/20 text-xs px-3 py-1.5"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            >
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          )}

          {summaryData && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Body: Only rendered when user clicks generate or expands */}
      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950/40 p-4 sm:p-6 backdrop-blur-xs">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-3 text-white/80">
              <Sparkles className="w-6 h-6 text-teal-400 animate-spin" />
              <div className="text-sm font-medium animate-pulse">
                Querying Google Gemini 3.6 Flash with real-time hospital records...
              </div>
            </div>
          ) : error ? (
            <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/40 p-3 rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="ghost" onClick={fetchSummary} className="text-xs text-white">
                Retry
              </Button>
            </div>
          ) : summaryData ? (
            <div className="space-y-4">
              {/* Quick Pill Metrics */}
              {summaryData.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2">
                  {role === "ADMIN" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Total Revenue</div>
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{(summaryData.metrics.totalRevenueCollected || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Bed Occupancy</div>
                        <div className="text-sm font-bold text-blue-400">{summaryData.metrics.bedOccupancy}</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Active Inpatients</div>
                        <div className="text-sm font-bold text-amber-400">
                          {summaryData.metrics.activeAdmissions} patients
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Registered Patients</div>
                        <div className="text-sm font-bold text-purple-400">
                          {summaryData.metrics.totalRegisteredPatients}
                        </div>
                      </div>
                    </>
                  )}

                  {role === "HRMS" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Monthly Salary Payable</div>
                        <div className="text-sm font-bold text-purple-300">
                          ₹{(summaryData.metrics.totalMonthlySalaryLiability || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Active Staff Count</div>
                        <div className="text-sm font-bold text-teal-300">
                          {summaryData.metrics.totalActiveEmployees} Employees
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Avg Monthly Salary</div>
                        <div className="text-sm font-bold text-blue-300">
                          ₹{(summaryData.metrics.averageMonthlySalary || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Pending Leaves</div>
                        <div className="text-sm font-bold text-amber-400">
                          {summaryData.metrics.pendingLeaveRequestsCount} Requests
                        </div>
                      </div>
                    </>
                  )}

                  {role === "FINANCE" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Total Billed</div>
                        <div className="text-sm font-bold text-blue-300">
                          ₹{(summaryData.metrics.totalBilled || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Revenue Collected</div>
                        <div className="text-sm font-bold text-emerald-400">
                          ₹{(summaryData.metrics.totalCollected || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Collection Rate</div>
                        <div className="text-sm font-bold text-teal-300">
                          {summaryData.metrics.collectionRate}%
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Outstanding Receivables</div>
                        <div className="text-sm font-bold text-rose-300">
                          ₹{(summaryData.metrics.totalOutstandingReceivables || 0).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}

                  {role === "DOCTOR" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Admitted Inpatients</div>
                        <div className="text-sm font-bold text-teal-300">
                          {summaryData.metrics.activeInpatientCount} Patients
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Upcoming OPD Consults</div>
                        <div className="text-sm font-bold text-blue-300">
                          {summaryData.metrics.upcomingAppointmentsCount} Tokens
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Pending Lab Orders</div>
                        <div className="text-sm font-bold text-amber-300">
                          {summaryData.metrics.pendingLabOrdersCount} Orders
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                        <div className="text-[10px] text-white/60 font-semibold uppercase">Clinical Status</div>
                        <div className="text-sm font-bold text-emerald-300">Ward Synced</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Markdown Content */}
              <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans max-h-[380px] overflow-y-auto whitespace-pre-wrap">
                {summaryData.summary}
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                <span>Generated: {new Date(summaryData.generatedAt).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced with Live Hospital Records
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
