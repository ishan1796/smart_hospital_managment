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
  Layers,
  Wind,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Package
} from "lucide-react";

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"items" | "oxygen">("items");

  // Stock Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stockForm, setStockForm] = useState({
    batchNumber: "BAT-" + Math.floor(10000 + Math.random() * 90000),
    quantity: 100,
    unitCost: 15,
    notes: "Regular restock delivery",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Oxygen Update Modal
  const [oxyModalOpen, setOxyModalOpen] = useState(false);
  const [selectedCyl, setSelectedCyl] = useState<any>(null);
  const [oxyForm, setOxyForm] = useState({
    status: "IN_USE",
    pressureBar: 140,
    location: "ICU Ward",
    notes: "Connected to patient manifold",
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [itemRes, oxyRes] = await Promise.all([
        api.get("/inventory/items"),
        api.get("/inventory/oxygen"),
      ]);

      if (itemRes.data.success) setItems(itemRes.data.items);
      if (oxyRes.data.success) setCylinders(oxyRes.data.cylinders);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitLoading(true);
    try {
      const res = await api.post("/inventory/stock/add", {
        inventoryItemId: selectedItem.id,
        batchNumber: stockForm.batchNumber,
        quantity: parseInt(String(stockForm.quantity), 10),
        unitCost: parseFloat(String(stockForm.unitCost)),
        notes: stockForm.notes,
      });
      if (res.data.success) {
        setAddModalOpen(false);
        alert(`Stock added! New stock: ${res.data.item.currentStock}`);
        fetchInventory();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add stock");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateOxygen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCyl) return;
    setSubmitLoading(true);
    try {
      const res = await api.patch(`/inventory/oxygen/${selectedCyl.id}`, {
        status: oxyForm.status,
        pressureBar: parseFloat(String(oxyForm.pressureBar)),
        location: oxyForm.location,
        notes: oxyForm.notes,
      });
      if (res.data.success) {
        setOxyModalOpen(false);
        alert("Oxygen cylinder telemetry updated!");
        fetchInventory();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update oxygen cylinder");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading Inventory & Supplies..." />;

  const lowStockCount = items.filter((i) => i.currentStock <= i.minStockLevel).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center">
            <Layers className="w-7 h-7 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hospital Inventory, Consumables & Oxygen Supply</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Stock Reorder Alerts • Batch Management • Medical Gas Cylinder Telemetry
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "items" ? "bg-teal-500 text-slate-950 shadow-md" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Supplies & Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("oxygen")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "oxygen" ? "bg-teal-500 text-slate-950 shadow-md" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Oxygen Cylinders ({cylinders.length})
          </button>
        </div>
      </div>

      {activeTab === "items" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <span>Consumables & Surgical Supply Stock</span>
              {lowStockCount > 0 && (
                <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {lowStockCount} items below min threshold
                </span>
              )}
            </div>
          }
          subtitle="Track and restock clinical equipment, consumables, and food stock"
        >
          <Table
            columns={[
              {
                header: "Item Name & Code",
                accessor: (r: any) => (
                  <div>
                    <div className="font-bold text-slate-900">{r.name}</div>
                    <span className="text-xs font-mono text-slate-500">{r.code}</span>
                  </div>
                ),
              },
              { header: "Category", accessor: (r: any) => <Badge variant="neutral">{r.category}</Badge> },
              { header: "Unit", accessor: "unit" },
              {
                header: "Stock Level",
                accessor: (r: any) => (
                  <Badge variant={r.currentStock <= r.minStockLevel ? "danger" : "success"}>
                    {r.currentStock} {r.unit} (Min: {r.minStockLevel})
                  </Badge>
                ),
              },
              { header: "Storage Location", accessor: (r: any) => r.location || "Central Store" },
              {
                header: "Actions",
                accessor: (r: any) => (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedItem(r);
                      setAddModalOpen(true);
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Restock
                  </Button>
                ),
              },
            ]}
            data={items}
            keyExtractor={(r: any) => r.id}
          />
        </Card>
      )}

      {activeTab === "oxygen" && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-teal-600" />
              <span>Oxygen Cylinder Tracking Grid</span>
            </div>
          }
          subtitle="Real-time cylinder pressure, status, and department location"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cylinders.map((cyl) => {
              const isEmpty = cyl.status === "EMPTY";
              const inUse = cyl.status === "IN_USE";
              return (
                <div
                  key={cyl.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isEmpty
                      ? "bg-rose-50/60 border-rose-200"
                      : inUse
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-teal-50/50 border-teal-200"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{cyl.cylinderCode}</span>
                      <Badge variant={isEmpty ? "danger" : inUse ? "warning" : "success"} size="sm">
                        {cyl.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600">Type: <strong>{cyl.type}</strong> ({cyl.capacityLiters} L)</p>
                    <p className="text-xs text-slate-600 mt-1">Location: <strong>{cyl.currentLocation}</strong></p>

                    <div className="mt-3 p-2 bg-white rounded-lg border flex items-center justify-between text-xs font-mono">
                      <span>Pressure:</span>
                      <strong className={cyl.currentPressureBar < 30 ? "text-rose-600" : "text-emerald-700"}>
                        {cyl.currentPressureBar} Bar
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedCyl(cyl);
                        setOxyForm({
                          status: cyl.status,
                          pressureBar: cyl.currentPressureBar,
                          location: cyl.currentLocation,
                          notes: "Status update",
                        });
                        setOxyModalOpen(true);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Restock Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={`Restock Inventory Item: ${selectedItem?.name}`}
      >
        <form onSubmit={handleAddStock} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Batch Number"
              required
              value={stockForm.batchNumber}
              onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
            />
            <Input
              label={`Quantity (${selectedItem?.unit})`}
              type="number"
              required
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value, 10) })}
            />
          </div>

          <Input
            label="Unit Cost (₹)"
            type="number"
            step="0.1"
            value={stockForm.unitCost}
            onChange={(e) => setStockForm({ ...stockForm, unitCost: parseFloat(e.target.value) })}
          />

          <Input
            label="Notes / Delivery Challan Ref"
            value={stockForm.notes}
            onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Confirm Restock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Oxygen Update Modal */}
      <Modal
        isOpen={oxyModalOpen}
        onClose={() => setOxyModalOpen(false)}
        title={`Update Oxygen Cylinder: ${selectedCyl?.cylinderCode}`}
      >
        <form onSubmit={handleUpdateOxygen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={oxyForm.status}
              onChange={(e) => setOxyForm({ ...oxyForm, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 text-sm px-3.5 py-2 text-slate-800"
            >
              <option value="AVAILABLE">AVAILABLE (Full / Standby)</option>
              <option value="IN_USE">IN_USE (Connected to Patient/Ward)</option>
              <option value="EMPTY">EMPTY (Needs Refill)</option>
              <option value="MAINTENANCE">MAINTENANCE (Testing/Valve Service)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pressure Reading (Bar)"
              type="number"
              value={oxyForm.pressureBar}
              onChange={(e) => setOxyForm({ ...oxyForm, pressureBar: parseFloat(e.target.value) })}
            />
            <Input
              label="Current Location"
              value={oxyForm.location}
              onChange={(e) => setOxyForm({ ...oxyForm, location: e.target.value })}
            />
          </div>

          <Input
            label="Remarks / Activity Log"
            value={oxyForm.notes}
            onChange={(e) => setOxyForm({ ...oxyForm, notes: e.target.value })}
          />

          <div className="pt-3 border-t flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOxyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Save Cylinder Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
