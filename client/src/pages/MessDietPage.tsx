import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { Table } from "../components/common/Table";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { StaffLeaveView } from "../components/common/StaffLeaveView";
import {
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PlaneTakeoff,
  Plus,
  Bed,
  Stethoscope,
  FileText,
  AlertTriangle,
  Sparkles,
  Users
} from "lucide-react";

const DIET_PRESETS: Record<string, { breakfast: string; lunch: string; dinner: string; instructions: string }> = {
  NORMAL: {
    breakfast: "Idli / Dosa with sambar, boiled egg, milk, banana",
    lunch: "Steamed rice, 2 chapatis, mixed dal, seasonal vegetable curry, curd",
    dinner: "2 Chapatis, dal tadka, mixed vegetable sabzi, light vegetable soup",
    instructions: "Standard balanced nutritional meal.",
  },
  DIABETIC: {
    breakfast: "Oatmeal porridge, boiled egg whites, unsweetened skimmed milk, apple slices",
    lunch: "Steamed brown rice (1 cup), yellow dal (low GI), stir-fried spinach/vegetables, cucumber salad",
    dinner: "2 Multigrain rotis, bottle gourd curry, vegetable clear soup",
    instructions: "Strict low glycemic index (<150g carbs/day), no added sugar, monitor postprandial glucose.",
  },
  LOW_SODIUM: {
    breakfast: "Steamed oats idli, fresh papaya, low-fat milk (no added salt)",
    lunch: "Steamed brown rice, yellow dal (strict low salt), boiled beans & carrots, curd",
    dinner: "2 Multigrain rotis, lauki curry, unsalted vegetable soup",
    instructions: "Strict low sodium (<2g NaCl/day), cardiac/hypertension care, no salted butter/pickles.",
  },
  HIGH_PROTEIN: {
    breakfast: "3 Boiled egg whites, sprout salad, paneer/tofu cubes, milk",
    lunch: "Brown rice, grilled chicken breast / paneer curry, double dal, green salad",
    dinner: "2 Whole wheat rotis, paneer bhurji / steamed fish, vegetable soup",
    instructions: "High protein (>1.5g/kg/day) for post-surgery recovery and wound tissue repair.",
  },
  RENAL: {
    breakfast: "White bread toast with unsalted butter, apple sauce, low potassium fruit",
    lunch: "White rice, leached boiled vegetables (low potassium & phosphorus), limited dal",
    dinner: "2 Refined flour rotis, bottle gourd curry, clear vegetable broth",
    instructions: "Strict renal diet: Restricted potassium, phosphorus, and sodium with monitored fluid allowance.",
  },
  SOFT_DIET: {
    breakfast: "Soft suji upma / daliya porridge, mashed banana, warm milk",
    lunch: "Moong dal khichdi with ghee, mashed potatoes, plain curd",
    dinner: "Soft khichdi / rice porridge, blended vegetable soup",
    instructions: "Easily digestible, non-spicy soft consistency for post-operative / GI recovery.",
  },
  LIQUID_DIET: {
    breakfast: "Clear vegetable broth, strained apple juice, fresh tender coconut water",
    lunch: "Thin strained dal soup, strained barley water, clear broth",
    dinner: "Clear vegetable soup, warm herbal tea, strained fruit juice",
    instructions: "Clear/full fluids only. Transition diet before solid food reintroduction.",
  },
  NPO: {
    breakfast: "NIL PER OS (Strict Fasting - Procedure / Surgery Prep)",
    lunch: "NIL PER OS (Maintain IV Normal Saline / RL Infusion as per order)",
    dinner: "NIL PER OS (No oral liquids or solid food intake allowed)",
    instructions: "Complete NPO (Nil By Mouth) status for scheduled operative intervention. Keep IV line patent.",
  },
};

export const MessDietPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isClinicalStaff = ["DOCTOR", "NURSE", "ADMIN"].includes(user?.role || "");
  const isMessOnly = user?.role === "MESS";

  const [admissions, setAdmissions] = useState<any[]>([]);
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-route & Tab state
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/leave")) return "leave";
    if (isMessOnly) return "kitchen";
    if (path.includes("/kitchen")) return "kitchen";
    if (path.includes("/history")) return "history";
    return "prescribe";
  };

  const activeTab = getActiveTab();

  // Allot Diet Plan Modal
  const [allotModalOpen, setAllotModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [allotForm, setAllotForm] = useState({
    patientId: "",
    admissionId: "",
    dietType: "LOW_SODIUM",
    breakfast: DIET_PRESETS.LOW_SODIUM.breakfast,
    lunch: DIET_PRESETS.LOW_SODIUM.lunch,
    dinner: DIET_PRESETS.LOW_SODIUM.dinner,
    specialInstructions: DIET_PRESETS.LOW_SODIUM.instructions,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDietData = async () => {
    try {
      setLoading(true);
      const [admRes, planRes, fulRes] = await Promise.all([
        isClinicalStaff ? api.get("/diet/admitted-patients") : Promise.resolve({ data: { success: false, admissions: [] } }),
        isClinicalStaff ? api.get("/diet/plans") : Promise.resolve({ data: { success: false, dietPlans: [] } }),
        api.get("/diet/fulfillments"),
      ]);

      if (admRes.data.success) {
        setAdmissions(admRes.data.admissions);
        if (admRes.data.admissions.length > 0 && !allotForm.patientId) {
          const first = admRes.data.admissions[0];
          setAllotForm((prev) => ({
            ...prev,
            patientId: first.patientId,
            admissionId: first.id,
          }));
        }
      }
      if (planRes.data.success) setDietPlans(planRes.data.dietPlans);
      if (fulRes.data.success) setFulfillments(fulRes.data.fulfillments);
    } catch (err) {
      console.error("Error fetching diet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDietData();
  }, [user?.role]);

  const handleDietTypeChange = (type: string) => {
    const preset = DIET_PRESETS[type] || DIET_PRESETS.NORMAL;
    setAllotForm({
      ...allotForm,
      dietType: type,
      breakfast: preset.breakfast,
      lunch: preset.lunch,
      dinner: preset.dinner,
      specialInstructions: preset.instructions,
    });
  };

  const openAllotModal = (adm?: any) => {
    if (adm) {
      setSelectedAdmission(adm);
      const existingPlan = adm.dietPlans?.[0];
      const dietType = existingPlan?.dietType || "NORMAL";
      const preset = DIET_PRESETS[dietType] || DIET_PRESETS.NORMAL;

      setAllotForm({
        patientId: adm.patientId,
        admissionId: adm.id,
        dietType,
        breakfast: existingPlan?.breakfast || preset.breakfast,
        lunch: existingPlan?.lunch || preset.lunch,
        dinner: existingPlan?.dinner || preset.dinner,
        specialInstructions: existingPlan?.specialInstructions || preset.instructions,
      });
    }
    setAllotModalOpen(true);
  };

  const handleSaveDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allotForm.patientId) {
      alert("Please select an admitted patient.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/diet/plan", allotForm);
      if (res.data.success) {
        setAllotModalOpen(false);
        alert(`Diet plan (${allotForm.dietType}) prescribed & dispatched to Hospital Kitchen queue!`);
        fetchDietData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to prescribe diet plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "PREPARED" | "DELIVERED") => {
    try {
      const res = await api.patch(`/diet/fulfillments/${id}/status`, { status });
      if (res.data.success) {
        fetchDietData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) return <LoadingSpinner label="Loading Inpatient Clinical Nutrition & Dietary System..." />;

  const pendingFulfillments = fulfillments.filter((f) => f.status === "PENDING");
  const preparedFulfillments = fulfillments.filter((f) => f.status === "PREPARED");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-orange-950 rounded-2xl p-6 text-white shadow-md border border-teal-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-orange-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {isMessOnly ? "Hospital Kitchen & Dietary Services" : "Inpatient Clinical Diet & Nutrition Studio"}
            </h2>
            <p className="text-xs text-orange-200 mt-0.5">
              {isMessOnly
                ? "Inpatient Meal Preparation • Delivery Logistics • Strict Patient Privacy"
                : `Dr. ${user?.firstName} ${user?.lastName} • Clinical Diet Prescriptions & Inpatient Menu Allocation`}
            </p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isClinicalStaff && (
            <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <button
                onClick={() => navigate("/diet")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "prescribe" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Allot Patient Diets ({admissions.length})</span>
              </button>
              <button
                onClick={() => navigate("/diet/history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "history" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Active Diet Plans ({dietPlans.length})</span>
              </button>
              <button
                onClick={() => navigate("/diet/kitchen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "kitchen" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen Queue ({fulfillments.length})</span>
              </button>
              <button
                onClick={() => navigate("/diet/leave")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "leave" ? "bg-teal-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>Staff Leave</span>
              </button>
            </div>
          )}

          {isMessOnly && (
            <div className="flex gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <button
                onClick={() => navigate("/mess")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "kitchen" ? "bg-orange-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen Queue ({fulfillments.length})</span>
              </button>
              <button
                onClick={() => navigate("/mess/leave")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "leave" ? "bg-orange-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>Staff Leave</span>
              </button>
            </div>
          )}

          {isClinicalStaff && (
            <Button
              onClick={() => openAllotModal()}
              icon={<Plus className="w-4 h-4" />}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold shadow-md"
            >
              + Prescribe Diet Plan
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DOCTOR & NURSE: INPATIENT DIET ALLOTMENT STUDIO */}
      {/* ========================================================= */}
      {isClinicalStaff && activeTab === "prescribe" && (
        <div className="space-y-6">
          {/* Quick Guidance Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Inpatient Clinical Nutrition Protocol</h4>
                <p className="text-xs text-slate-500">
                  Select any admitted patient to assign or update specialized clinical meal plans (Diabetic, Low Sodium, High Protein, Renal, NPO).
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-lg border border-teal-200">
              {admissions.length} Inpatients Admitted
            </span>
          </div>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-teal-600" />
                <span>Admitted Patients & Active Diet Allocations</span>
              </div>
            }
            subtitle="Clinical diet requirements and meal menus assigned to each inpatient bed"
          >
            <Table
              columns={[
                {
                  header: "Bed Location",
                  accessor: (r: any) => (
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">{r.bed?.bedNumber}</span>
                      <div className="text-xs text-slate-500">{r.bed?.ward?.name} ({r.bed?.type})</div>
                    </div>
                  ),
                },
                {
                  header: "Admitted Patient",
                  accessor: (r: any) => (
                    <div>
                      <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {r.patient?.uhid} • {r.patient?.gender} • Blood: <strong>{r.patient?.bloodGroup || "O+"}</strong>
                      </div>
                      {r.patient?.allergies && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                          ⚠️ Allergy: {r.patient.allergies}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Current Diet Plan",
                  accessor: (r: any) => {
                    const plan = r.dietPlans?.[0];
                    const typeColors: any = {
                      NORMAL: "neutral",
                      DIABETIC: "warning",
                      LOW_SODIUM: "primary",
                      HIGH_PROTEIN: "success",
                      RENAL: "info",
                      SOFT_DIET: "neutral",
                      LIQUID_DIET: "warning",
                      NPO: "danger",
                    };
                    return plan ? (
                      <div>
                        <Badge variant={typeColors[plan.dietType] || "neutral"} dot>
                          {plan.dietType} DIET
                        </Badge>
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs truncate">
                          {plan.specialInstructions || "Standard nutritional intake"}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="warning">NO DIET ASSIGNED</Badge>
                    );
                  },
                },
                {
                  header: "Prescribed Meal Menus",
                  accessor: (r: any) => {
                    const plan = r.dietPlans?.[0];
                    return plan ? (
                      <div className="space-y-1 text-xs max-w-sm">
                        <div>
                          <strong className="text-orange-700">Breakfast:</strong> <span className="text-slate-700">{plan.breakfast}</span>
                        </div>
                        <div>
                          <strong className="text-emerald-700">Lunch:</strong> <span className="text-slate-700">{plan.lunch}</span>
                        </div>
                        <div>
                          <strong className="text-indigo-700">Dinner:</strong> <span className="text-slate-700">{plan.dinner}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Pending doctor allocation</span>
                    );
                  },
                },
                {
                  header: "Doctor Action",
                  accessor: (r: any) => (
                    <Button
                      size="sm"
                      onClick={() => openAllotModal(r)}
                      icon={<UtensilsCrossed className="w-3.5 h-3.5" />}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {r.dietPlans?.length > 0 ? "Edit Diet Plan" : "Allot Diet Plan"}
                    </Button>
                  ),
                },
              ]}
              data={admissions}
              keyExtractor={(r: any) => r.id}
              emptyMessage="No active inpatients in wards currently."
            />
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DOCTOR & NURSE: ACTIVE DIET PLANS HISTORY */}
      {/* ========================================================= */}
      {isClinicalStaff && activeTab === "history" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>Inpatient Diet Prescriptions Archive</span>
            </div>
          }
          subtitle="Signed clinical nutrition orders and kitchen dispatch status"
        >
          <Table
            columns={[
              {
                header: "Date Prescribed",
                accessor: (r: any) => new Date(r.prescribedDate || r.createdAt).toLocaleDateString(),
              },
              {
                header: "Patient & Bed",
                accessor: (r: any) => (
                  <div>
                    <span className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</span>
                    <div className="text-xs text-slate-500 font-mono">
                      {r.patient?.uhid} • Bed: <strong>{r.admission?.bed?.bedNumber || "N/A"}</strong>
                    </div>
                  </div>
                ),
              },
              {
                header: "Diet Category",
                accessor: (r: any) => <Badge variant="primary">{r.dietType}</Badge>,
              },
              {
                header: "Prescribed Menus",
                accessor: (r: any) => (
                  <div className="text-xs space-y-0.5 text-slate-700">
                    <p><strong>B:</strong> {r.breakfast}</p>
                    <p><strong>L:</strong> {r.lunch}</p>
                    <p><strong>D:</strong> {r.dinner}</p>
                  </div>
                ),
              },
              {
                header: "Special Instructions",
                accessor: (r: any) => <span className="text-xs text-slate-600 italic">{r.specialInstructions || "None"}</span>,
              },
              {
                header: "Status",
                accessor: (r: any) => <Badge variant={r.status === "ACTIVE" ? "success" : "neutral"}>{r.status}</Badge>,
              },
            ]}
            data={dietPlans}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No diet plans on record."
          />
        </Card>
      )}

      {/* ========================================================= */}
      {/* 3. MESS (KITCHEN STAFF) & ADMIN: MEAL FULFILLMENT QUEUE */}
      {/* ========================================================= */}
      {activeTab === "kitchen" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-orange-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Patient Clinical Diagnosis & Prescriptions Redacted for Medical Privacy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Pending: <strong className="text-amber-300">{pendingFulfillments.length}</strong>
              </span>
              <span className="text-slate-400">
                Prepared: <strong className="text-cyan-300">{preparedFulfillments.length}</strong>
              </span>
            </div>
          </div>

          <Card
            title={
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-600" />
                <span>Today's Inpatient Meal Preparation & Delivery Queue</span>
              </div>
            }
            subtitle="Mess kitchen staff prepares and delivers meals as prescribed by attending doctors"
          >
            <Table
              columns={[
                {
                  header: "Bed Location",
                  accessor: (r: any) => <span className="font-mono font-bold text-slate-900 text-sm">{r.bedNumber}</span>,
                },
                {
                  header: "Patient Ref",
                  accessor: (r: any) => <span className="font-mono text-xs text-slate-500">{r.patientId?.slice(0, 8)}...</span>,
                },
                {
                  header: "Meal & Diet Type",
                  accessor: (r: any) => (
                    <div>
                      <Badge variant="primary">{r.mealType}</Badge>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">{r.dietType} DIET</div>
                    </div>
                  ),
                },
                {
                  header: "Prescribed Food Items",
                  accessor: (r: any) => <span className="text-xs font-semibold text-slate-800">{r.mealItems || "Standard Nutrition Meal"}</span>,
                },
                {
                  header: "Special Kitchen Instructions",
                  accessor: (r: any) => (
                    <span className="text-xs italic text-slate-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      {r.specialInstructions || "None"}
                    </span>
                  ),
                },
                {
                  header: "Delivery Status",
                  accessor: (r: any) => {
                    const map: any = { DELIVERED: "success", PREPARED: "info", PENDING: "warning" };
                    return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                  },
                },
                {
                  header: "Kitchen Action",
                  accessor: (r: any) => (
                    <div className="flex items-center gap-2">
                      {r.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(r.id, "PREPARED")}
                          icon={<ChefHat className="w-3.5 h-3.5" />}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Mark Prepared
                        </Button>
                      )}
                      {r.status === "PREPARED" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(r.id, "DELIVERED")}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Mark Delivered
                        </Button>
                      )}
                      {r.status === "DELIVERED" && (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Served to Bed
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
              data={fulfillments}
              keyExtractor={(r: any) => r.id}
              emptyMessage="No active meal fulfillments in queue."
            />
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. STAFF LEAVE TAB */}
      {/* ========================================================= */}
      {activeTab === "leave" && (
        <StaffLeaveView
          roleTitle={isMessOnly ? "Dietary Chef / Kitchen Manager" : `Dr. ${user?.firstName} ${user?.lastName}`}
          departmentName={isMessOnly ? "Hospital Kitchen & Catering" : "Inpatient Clinical Nutrition & Medicine"}
        />
      )}

      {/* ========================================================= */}
      {/* ALLOT / PRESCRIBE DIET MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={allotModalOpen}
        onClose={() => setAllotModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <span>Prescribe Inpatient Diet Plan & Menu Options</span>
          </div>
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveDietPlan} className="space-y-4 text-xs">
          {/* Patient / Bed Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Select Admitted Inpatient & Bed</label>
            <select
              value={allotForm.admissionId}
              onChange={(e) => {
                const adm = admissions.find((a) => a.id === e.target.value);
                if (adm) {
                  setAllotForm({
                    ...allotForm,
                    admissionId: adm.id,
                    patientId: adm.patientId,
                  });
                }
              }}
              className="w-full rounded-lg border border-slate-300 text-xs px-3.5 py-2.5 text-slate-800 font-medium"
            >
              {admissions.map((a) => (
                <option key={a.id} value={a.id}>
                  Bed #{a.bed?.bedNumber} ({a.bed?.ward?.name}) - {a.patient?.firstName} {a.patient?.lastName} ({a.patient?.uhid})
                </option>
              ))}
            </select>
          </div>

          {/* Clinical Diet Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Prescribed Diet Type</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: "NORMAL", label: "Normal (Standard)" },
                { type: "DIABETIC", label: "Diabetic (Low GI)" },
                { type: "LOW_SODIUM", label: "Low Sodium (Cardiac)" },
                { type: "HIGH_PROTEIN", label: "High Protein" },
                { type: "RENAL", label: "Renal Diet" },
                { type: "SOFT_DIET", label: "Soft Diet" },
                { type: "LIQUID_DIET", label: "Liquid Diet" },
                { type: "NPO", label: "NPO (Nil Per Os)" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleDietTypeChange(item.type)}
                  className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                    allotForm.dietType === item.type
                      ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Menu Specifications */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-orange-600" /> Meal Menus for Hospital Kitchen
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Breakfast Menu (08:00 AM)</label>
              <input
                type="text"
                required
                value={allotForm.breakfast}
                onChange={(e) => setAllotForm({ ...allotForm, breakfast: e.target.value })}
                className="w-full border rounded-lg p-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lunch Menu (12:30 PM)</label>
              <input
                type="text"
                required
                value={allotForm.lunch}
                onChange={(e) => setAllotForm({ ...allotForm, lunch: e.target.value })}
                className="w-full border rounded-lg p-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dinner Menu (07:30 PM)</label>
              <input
                type="text"
                required
                value={allotForm.dinner}
                onChange={(e) => setAllotForm({ ...allotForm, dinner: e.target.value })}
                className="w-full border rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Special Clinical Instructions */}
          <Input
            label="Special Clinical Instructions & Restrictions"
            placeholder="e.g. Strict low sodium <2g, diabetic friendly, warm fluids only..."
            value={allotForm.specialInstructions}
            onChange={(e) => setAllotForm({ ...allotForm, specialInstructions: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAllotModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
              Dispatch Diet Order to Kitchen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
