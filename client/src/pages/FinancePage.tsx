import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  CreditCard,
  Percent,
  CheckCircle,
  Plus,
  Receipt,
  FileCheck,
  DollarSign,
  PlaneTakeoff
} from "lucide-react";
import { AiExecutiveSummaryBanner } from "../components/common/AiExecutiveSummaryBanner";

export const FinancePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [charges, setCharges] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-route detector
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes("/finance/invoices")) return "invoices";
    if (path.includes("/finance/leave")) return "leave";
    return "charges";
  };

  const activeView = getActiveView();

  // Selection for Invoice Creation
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [createInvoiceLoading, setCreateInvoiceLoading] = useState(false);

  // Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [discountForm, setDiscountForm] = useState({
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
    value: 10,
    reason: "Senior Citizen Privilege Care Waiver",
  });
  const [discountLoading, setDiscountLoading] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "UPI",
    transactionRef: "UPI-TXN-" + Date.now().toString().slice(-6),
    notes: "Direct settlement at billing counter",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [chgRes, invRes] = await Promise.all([
        api.get("/finance/charges"),
        api.get("/finance/invoices"),
      ]);

      if (chgRes.data.success) setCharges(chgRes.data.charges);
      if (invRes.data.success) setInvoices(invRes.data.invoices);
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleCreateInvoice = async () => {
    if (selectedChargeIds.length === 0 || !selectedPatientId) {
      alert("Please select charges belonging to a patient.");
      return;
    }
    setCreateInvoiceLoading(true);
    try {
      const res = await api.post("/finance/invoices", {
        patientId: selectedPatientId,
        chargeIds: selectedChargeIds,
        notes: "Consolidated departmental invoice",
      });

      if (res.data.success) {
        alert(`Invoice #${res.data.invoice.invoiceNumber} created! Subtotal: ₹${res.data.invoice.subtotal}`);
        setSelectedChargeIds([]);
        fetchFinanceData();
        navigate("/finance/invoices");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setCreateInvoiceLoading(false);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setDiscountLoading(true);
    try {
      const res = await api.post("/finance/invoices/discount", {
        invoiceId: selectedInvoice.id,
        discountType: discountForm.discountType,
        value: parseFloat(String(discountForm.value)),
        reason: discountForm.reason,
      });

      if (res.data.success) {
        setDiscountModalOpen(false);
        alert(`Discount applied! New Final Amount: ₹${res.data.invoice.finalAmount}`);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to apply discount");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentLoading(true);
    try {
      const res = await api.post("/finance/payments", {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(String(paymentForm.amount)),
        paymentMethod: paymentForm.paymentMethod,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
      });

      if (res.data.success) {
        setPaymentModalOpen(false);
        alert(`Payment recorded successfully! Receipt #${res.data.payment.receiptNumber}`);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Billing & Invoicing Station..." />;

  const pendingChargesTotal = charges.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md border border-indigo-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hospital Finance, Billing & Cashier</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Departmental Charge Consolidation • Authorized Discounts • Multi-Mode Payment Receipts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => navigate("/finance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "charges" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pending Charges ({charges.length})</span>
          </button>
          <button
            onClick={() => navigate("/finance/invoices")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "invoices" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices & Receipts ({invoices.length})</span>
          </button>
          <button
            onClick={() => navigate("/finance/leave")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === "leave" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>Leave Requests</span>
          </button>
        </div>
      </div>

      {/* Gemini AI Revenue Realization & Audit Briefing */}
      <AiExecutiveSummaryBanner role="FINANCE" />

      {activeView === "charges" && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span>Pending Departmental Charges</span>
                <span className="text-xs text-slate-500 font-mono">(Unbilled: ₹{pendingChargesTotal.toLocaleString()})</span>
              </div>
              {selectedChargeIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleCreateInvoice}
                  loading={createInvoiceLoading}
                  icon={<FileCheck className="w-3.5 h-3.5" />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Generate Invoice ({selectedChargeIds.length} items)
                </Button>
              )}
            </div>
          }
          subtitle="Select charges for a patient to generate a consolidated official invoice"
        >
          <Table
            columns={[
              {
                header: "Select",
                accessor: (r: any) => (
                  <input
                    type="checkbox"
                    checked={selectedChargeIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChargeIds([...selectedChargeIds, r.id]);
                        setSelectedPatientId(r.patientId);
                      } else {
                        setSelectedChargeIds(selectedChargeIds.filter((id) => id !== r.id));
                      }
                    }}
                    className="rounded text-indigo-600"
                  />
                ),
              },
              {
                header: "Date",
                accessor: (r: any) => new Date(r.createdAt).toLocaleDateString(),
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Source Module",
                accessor: (r: any) => <Badge variant="primary">{r.sourceModule}</Badge>,
              },
              {
                header: "Service / Item Description",
                accessor: "serviceName",
                className: "font-medium text-slate-800",
              },
              {
                header: "Total Amount",
                accessor: (r: any) => (
                  <span className="font-mono font-bold text-slate-900">₹{r.totalAmount.toLocaleString()}</span>
                ),
              },
            ]}
            data={charges}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No pending departmental charges."
          />
        </Card>
      )}

      {activeView === "invoices" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Patient Invoices & Settlement Records</span>
            </div>
          }
          subtitle="Apply authorized discounts, finalize invoices, and record payments"
        >
          <Table
            columns={[
              {
                header: "Invoice #",
                accessor: (r: any) => <span className="font-mono font-bold text-indigo-700">{r.invoiceNumber}</span>,
              },
              {
                header: "Patient",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{r.patient?.firstName} {r.patient?.lastName}</div>
                    <div className="text-xs text-slate-500 font-mono">{r.patient?.uhid}</div>
                  </div>
                ),
              },
              {
                header: "Subtotal",
                accessor: (r: any) => <span className="font-mono">₹{r.subtotal.toLocaleString()}</span>,
              },
              {
                header: "Discount",
                accessor: (r: any) => (
                  <span className="text-emerald-700 font-mono font-semibold">
                    -₹{r.discountAmount.toLocaleString()} ({r.discountPercent}%)
                  </span>
                ),
              },
              {
                header: "Final Total",
                accessor: (r: any) => <span className="font-mono font-bold text-slate-900">₹{r.finalAmount.toLocaleString()}</span>,
              },
              {
                header: "Balance",
                accessor: (r: any) => (
                  <span className={r.balanceAmount > 0 ? "font-bold text-rose-600 font-mono" : "text-emerald-600 font-mono font-bold"}>
                    ₹{r.balanceAmount.toLocaleString()}
                  </span>
                ),
              },
              {
                header: "Status",
                accessor: (r: any) => {
                  const map: any = { PAID: "success", PARTIALLY_PAID: "warning", DRAFT: "neutral", FINALIZED: "primary" };
                  return <Badge variant={map[r.status] || "neutral"}>{r.status}</Badge>;
                },
              },
              {
                header: "Actions",
                accessor: (r: any) => (
                  <div className="flex items-center gap-2">
                    {r.status !== "PAID" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(r);
                            setDiscountModalOpen(true);
                          }}
                          icon={<Percent className="w-3 h-3" />}
                        >
                          Discount
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(r);
                            setPaymentForm({ ...paymentForm, amount: r.balanceAmount });
                            setPaymentModalOpen(true);
                          }}
                          icon={<CreditCard className="w-3 h-3" />}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Pay
                        </Button>
                      </>
                    )}
                    {r.status === "PAID" && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Settled
                      </span>
                    )}
                  </div>
                ),
              },
            ]}
            data={invoices}
            keyExtractor={(r: any) => r.id}
            emptyMessage="No invoices generated."
          />
        </Card>
      )}

      {activeView === "leave" && (
        <StaffLeaveView roleTitle="Finance Executive / Billing Clerk" departmentName="Hospital Billing & Accounts" />
      )}

      {/* Discount Modal */}
      <Modal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        title={`Apply Billing Discount: ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleApplyDiscount} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border text-xs">
            Subtotal: <strong>₹{selectedInvoice?.subtotal}</strong> • Current Balance: <strong>₹{selectedInvoice?.balanceAmount}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Discount Type</label>
              <select
                value={discountForm.discountType}
                onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <Input
              label={discountForm.discountType === "PERCENTAGE" ? "Percentage (%)" : "Flat Value (₹)"}
              type="number"
              required
              value={discountForm.value}
              onChange={(e) => setDiscountForm({ ...discountForm, value: parseFloat(e.target.value) })}
            />
          </div>

          <Input
            label="Authorization Reason / Waiver Justification"
            required
            value={discountForm.reason}
            onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
          />

          <p className="text-xs text-slate-500 italic">
            * Only Finance and Admin roles possess permission to apply discounts. Original charges remain intact.
          </p>

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={discountLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Apply & Finalize Discount
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment for Invoice ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900">
            Total Payable: <strong>₹{selectedInvoice?.finalAmount}</strong> • Balance Due: <strong>₹{selectedInvoice?.balanceAmount}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Payment Amount (₹)"
              type="number"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
              >
                <option value="UPI">UPI / QR Payment</option>
                <option value="CASH">Cash Counter</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="INSURANCE">TPA / Insurance Claim</option>
              </select>
            </div>
          </div>

          <Input
            label="Transaction Reference / Cheque #"
            value={paymentForm.transactionRef}
            onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={paymentLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Record Payment & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
